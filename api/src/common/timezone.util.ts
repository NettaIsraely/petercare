import { DateTime, IANAZone } from 'luxon';

export const DEFAULT_TIMEZONE = 'Asia/Jerusalem';
export const DEFAULT_STABLE_TIMEZONE = 'Asia/Jerusalem';

export function isValidTimezone(tz: string): boolean {
  return IANAZone.isValidZone(tz);
}

export function getLocalHour(utcNow: DateTime, tz: string): number {
  return utcNow.setZone(tz).hour;
}

export function getLocalDateString(utcNow: DateTime, tz: string): string {
  const localDate = utcNow.setZone(tz).toISODate();
  if (!localDate) {
    throw new Error(`Unable to resolve local date for timezone ${tz}`);
  }
  return localDate;
}

export function isLocalHour(utcNow: DateTime, tz: string, hour: number): boolean {
  const local = utcNow.setZone(tz);
  return local.hour === hour && local.minute === 0;
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const next = DateTime.fromISO(dateStr, { zone: 'utc' }).plus({ days });
  const isoDate = next.toISODate();
  if (!isoDate) {
    throw new Error(`Unable to add days to date ${dateStr}`);
  }
  return isoDate;
}

export function normalizeTimeString(timeStr: string): string {
  const parts = timeStr.split(':');
  const hours = parts[0]?.padStart(2, '0') ?? '00';
  const minutes = parts[1]?.padStart(2, '0') ?? '00';
  const seconds = parts[2]?.padStart(2, '0') ?? '00';
  return `${hours}:${minutes}:${seconds}`;
}

export function formatScheduleDate(scheduleDate: Date | string): string {
  if (typeof scheduleDate === 'string') {
    return scheduleDate.split('T')[0];
  }
  const year = scheduleDate.getUTCFullYear();
  const month = String(scheduleDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(scheduleDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localTimeOnDateToUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): DateTime {
  const normalizedTime = normalizeTimeString(timeStr);
  const local = DateTime.fromISO(`${dateStr}T${normalizedTime}`, { zone: tz });
  if (!local.isValid) {
    throw new Error(
      `Invalid local datetime ${dateStr}T${normalizedTime} in ${tz}`,
    );
  }
  return local.toUTC();
}

export function resolveUserTimezone(timezone?: string | null): string {
  if (timezone && isValidTimezone(timezone)) {
    return timezone;
  }
  return DEFAULT_TIMEZONE;
}
