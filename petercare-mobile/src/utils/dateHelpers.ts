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
