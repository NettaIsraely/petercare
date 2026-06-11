import { ShiftType } from '../types/feeding';

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateString(value: string | Date): string {
  if (value instanceof Date) {
    return toDateString(value);
  }
  return value.split('T')[0];
}

export function isToday(value: string | Date): boolean {
  return normalizeDateString(value) === toDateString(new Date());
}

export function getRollingWeekDateStrings(anchorDate: string): string[] {
  const anchor = new Date(`${normalizeDateString(anchorDate)}T00:00:00`);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() + i);
    days.push(toDateString(date));
  }
  return days;
}

export function getWeekRangeLabel(dates: string[]): string {
  if (dates.length === 0) {
    return '';
  }

  const start = new Date(`${dates[0]}T00:00:00`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00`);

  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
  });

  return `${startLabel} – ${endLabel}`;
}

export function shiftDateByWeeks(dateStr: string, weeks: number): string {
  const date = new Date(`${normalizeDateString(dateStr)}T00:00:00`);
  date.setDate(date.getDate() + weeks * 7);
  return toDateString(date);
}

export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hours12 = hour % 12 || 12;
  return `${hours12} ${period}`;
}

export function getNext14DayStrings(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(toDateString(date));
  }
  return days;
}

export function isWithinNext14Days(value: string | Date): boolean {
  const dateStr = normalizeDateString(value);
  return getNext14DayStrings().includes(dateStr);
}

export function getNext7DayStrings(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(toDateString(date));
  }
  return days;
}

export function isWithinNext7Days(value: string | Date): boolean {
  const dateStr = normalizeDateString(value);
  return getNext7DayStrings().includes(dateStr);
}

export function formatWeekDayHeader(dateStr: string): { dayName: string; dateLabel: string } {
  const weekDays = getNext7DayStrings();
  const index = weekDays.indexOf(normalizeDateString(dateStr));
  const date = new Date(`${normalizeDateString(dateStr)}T00:00:00`);

  let dayName: string;
  if (index === 0) {
    dayName = 'Today';
  } else if (index === 1) {
    dayName = 'Tomorrow';
  } else {
    dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return { dayName, dateLabel };
}

export function parseTimeToMinutes(timeStr: string): number {
  const normalized = timeStr.split(':');
  const hours = parseInt(normalized[0], 10);
  const minutes = parseInt(normalized[1], 10);
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
  const deadline = new Date(`${datePart}T${deadlineTime}`);
  return Date.now() > deadline.getTime();
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
    return `${parts[0]}:${parts[1]}`;
  }
  return apiTime;
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
