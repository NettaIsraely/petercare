import { DateTime } from 'luxon';
import { ShiftType } from '../types/feeding';
import { APP_TIMEZONE } from '../constants/timezone';

// Schedule dates and shift times are barn wall clock in APP_TIMEZONE, not device local.

function nowInAppTimezone(): DateTime {
  return DateTime.now().setZone(APP_TIMEZONE);
}

function toIsoDateInAppTimezone(date?: Date): string {
  const instant = date ? DateTime.fromJSDate(date) : DateTime.now();
  const isoDate = instant.setZone(APP_TIMEZONE).toISODate();
  if (!isoDate) {
    throw new Error(`Unable to format date in ${APP_TIMEZONE}`);
  }
  return isoDate;
}

function dateTimeFromScheduleDate(dateStr: string): DateTime {
  return DateTime.fromISO(normalizeDateString(dateStr), { zone: APP_TIMEZONE });
}

export function toDateString(date?: Date): string {
  return toIsoDateInAppTimezone(date);
}

export function normalizeDateString(value: string | Date): string {
  if (value instanceof Date) {
    return toDateString(value);
  }
  return value.split('T')[0];
}

export function formatUserFacingDate(value: string | Date): string {
  const isoDate = normalizeDateString(value);
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }
  return `${day}/${month}/${year}`;
}

export function isToday(value: string | Date): boolean {
  return normalizeDateString(value) === toIsoDateInAppTimezone();
}

export function getRollingWeekDateStrings(anchorDate: string): string[] {
  const anchor = dateTimeFromScheduleDate(anchorDate);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const isoDate = anchor.plus({ days: i }).toISODate();
    if (isoDate) {
      days.push(isoDate);
    }
  }
  return days;
}

export function getWeekRangeLabel(dates: string[]): string {
  if (dates.length === 0) {
    return '';
  }

  const start = dateTimeFromScheduleDate(dates[0]);
  const end = dateTimeFromScheduleDate(dates[dates.length - 1]);

  const startLabel = start.toFormat('dd/MM');
  const endLabel =
    start.year !== end.year ? end.toFormat('dd/MM/yyyy') : end.toFormat('dd/MM');

  return `${startLabel} – ${endLabel}`;
}

export function shiftDateByWeeks(dateStr: string, weeks: number): string {
  const isoDate = dateTimeFromScheduleDate(dateStr).plus({ weeks }).toISODate();
  if (!isoDate) {
    throw new Error(`Unable to shift date ${dateStr}`);
  }
  return isoDate;
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hours12 = hour % 12 || 12;
  return `${hours12} ${period}`;
}

export function getNext14DayStrings(): string[] {
  const today = nowInAppTimezone().startOf('day');
  const days: string[] = [];
  for (let i = 0; i < 14; i += 1) {
    const isoDate = today.plus({ days: i }).toISODate();
    if (isoDate) {
      days.push(isoDate);
    }
  }
  return days;
}

export function isWithinNext14Days(value: string | Date): boolean {
  const dateStr = normalizeDateString(value);
  return getNext14DayStrings().includes(dateStr);
}

export function getNext7DayStrings(): string[] {
  const today = nowInAppTimezone().startOf('day');
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const isoDate = today.plus({ days: i }).toISODate();
    if (isoDate) {
      days.push(isoDate);
    }
  }
  return days;
}

export function isWithinNext7Days(value: string | Date): boolean {
  const dateStr = normalizeDateString(value);
  return getNext7DayStrings().includes(dateStr);
}

export function isOnOrAfterToday(value: string | Date): boolean {
  return normalizeDateString(value) >= toIsoDateInAppTimezone();
}

export function formatWeekDayHeader(dateStr: string): { dayName: string; dateLabel: string } {
  const normalized = normalizeDateString(dateStr);
  const today = toIsoDateInAppTimezone();
  const tomorrow = nowInAppTimezone().plus({ days: 1 }).toISODate() ?? today;
  const date = dateTimeFromScheduleDate(normalized);

  let dayName: string;
  if (normalized === today) {
    dayName = 'Today';
  } else if (normalized === tomorrow) {
    dayName = 'Tomorrow';
  } else {
    dayName = date.toFormat('cccc');
  }

  const dateLabel = formatUserFacingDate(normalized);

  return { dayName, dateLabel };
}

export function parseTimeToMinutes(timeStr: string): number {
  const normalized = timeStr.split(':');
  const hours = parseInt(normalized[0], 10);
  const minutes = parseInt(normalized[1], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
}

export function getShiftDeadlineTime(
  shiftType: ShiftType,
  morningTime = '08:00:00',
  eveningTime = '18:00:00'
): string {
  return shiftType === 'MORNING' ? morningTime : eveningTime;
}

export function isPastShiftDeadline(
  scheduleDate: string,
  shiftType: ShiftType,
  morningTime = '08:00:00',
  eveningTime = '18:00:00'
): boolean {
  if (!isToday(scheduleDate)) {
    return false;
  }

  const deadlineTime = getShiftDeadlineTime(shiftType, morningTime, eveningTime);
  const datePart = normalizeDateString(scheduleDate);
  const deadline = DateTime.fromISO(`${datePart}T${deadlineTime}`, { zone: APP_TIMEZONE });
  return DateTime.now().toMillis() > deadline.toMillis();
}

export function formatTimeLabel(timeStr: string): string {
  const minutes = parseTimeToMinutes(timeStr);
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

export function formatShiftLabel(shiftType: ShiftType): string {
  return shiftType === 'MORNING' ? 'Morning Feeding' : 'Evening Feeding';
}

export function formatTimeForApi(input: string): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }
  const parts = trimmed.split(':');
  if (parts.length >= 3) {
    return trimmed;
  }
  if (parts.length === 2) {
    return `${trimmed}:00`;
  }
  return undefined;
}

export function formatTimeForInput(apiTime?: string): string {
  if (!apiTime) {
    return '';
  }
  const parts = apiTime.split(':');
  if (parts.length >= 2) {
    return normalizeTimeForWebInput(`${parts[0]}:${parts[1]}`) || `${parts[0]}:${parts[1]}`;
  }
  return apiTime;
}

export function normalizeTimeForWebInput(value: string): string {
  if (!value.trim()) {
    return '';
  }
  const parts = value.trim().split(':');
  if (parts.length < 2) {
    return '';
  }
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '';
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '';
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const HH_MM_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function isValidTimeInput(input: string): boolean {
  return HH_MM_PATTERN.test(input.trim());
}

export function timeStringToDate(time: string): Date {
  const normalized = formatTimeForInput(time) || '08:00';
  const [hours, minutes] = normalized.split(':').map((part) => parseInt(part, 10));
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export const RIDE_DEFAULT_DURATION_MINUTES = 60;
export const END_OF_DAY_TIME = '23:59';

const END_OF_DAY_MINUTES = 23 * 60 + 59;

export function minutesToTimeString(minutes: number): string {
  if (!Number.isFinite(minutes)) {
    return '00:00';
  }
  const clamped = Math.max(0, Math.min(END_OF_DAY_MINUTES, minutes));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function addMinutesToTime(time: string, deltaMinutes: number): string {
  return minutesToTimeString(parseTimeToMinutes(time) + deltaMinutes);
}

export function clampRideEndTime(start: string, end: string): string {
  const startMinutes = parseTimeToMinutes(start);
  let endMinutes = parseTimeToMinutes(end);
  endMinutes = Math.min(endMinutes, END_OF_DAY_MINUTES);
  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(startMinutes + 1, END_OF_DAY_MINUTES);
  }
  return minutesToTimeString(endMinutes);
}

export function deriveRideEndFromStart(start: string, durationMinutes: number): string {
  const proposedEnd = parseTimeToMinutes(start) + durationMinutes;
  return clampRideEndTime(start, minutesToTimeString(proposedEnd));
}

export function deriveMaxRideStartTime(durationMinutes: number): string {
  return minutesToTimeString(END_OF_DAY_MINUTES - durationMinutes);
}
