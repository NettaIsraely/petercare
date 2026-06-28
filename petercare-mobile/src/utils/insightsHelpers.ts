import { DateTime } from 'luxon';
import { APP_TIMEZONE } from '../constants/timezone';
import { Feeding } from '../types/feeding';
import { Horse } from '../types/horse';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { normalizeDateString } from './dateHelpers';

export interface WeekRange {
  start: string;
  end: string;
  label: string;
}

export interface HorseRideCount {
  horseId: string;
  horseName: string;
  count: number;
}

export interface PersonalChecklistSummary {
  feedingsComplete: number;
  feedingsTotal: number;
  tasksComplete: number;
  tasksTotal: number;
}

export interface PersonalChecklist {
  feedings: Feeding[];
  tasks: Task[];
  summary: PersonalChecklistSummary;
}

function formatWeekLabel(start: DateTime, end: DateTime): string {
  const startLabel = start.toFormat('dd/MM');
  const endLabel = start.year !== end.year ? end.toFormat('dd/MM/yyyy') : end.toFormat('dd/MM');
  return `${startLabel} – ${endLabel}`;
}

function startOfWeekInAppTimezone(referenceDate?: Date): DateTime {
  const instant = referenceDate ? DateTime.fromJSDate(referenceDate) : DateTime.now();
  const local = instant.setZone(APP_TIMEZONE).startOf('day');
  const daysFromMonday = local.weekday - 1;
  return local.minus({ days: daysFromMonday });
}

export function getCurrentWeekRange(referenceDate?: Date): WeekRange {
  const startDate = startOfWeekInAppTimezone(referenceDate);
  const endDate = startDate.plus({ days: 6 });

  return {
    start: startDate.toISODate() ?? '',
    end: endDate.toISODate() ?? '',
    label: formatWeekLabel(startDate, endDate),
  };
}

export function getWeekRangeForOffset(
  weekOffset: number,
  referenceDate?: Date
): WeekRange {
  const startDate = startOfWeekInAppTimezone(referenceDate).plus({ weeks: weekOffset });
  const endDate = startDate.plus({ days: 6 });

  return {
    start: startDate.toISODate() ?? '',
    end: endDate.toISODate() ?? '',
    label: formatWeekLabel(startDate, endDate),
  };
}

export function isCurrentCalendarWeek(weekRange: WeekRange): boolean {
  const currentWeek = getCurrentWeekRange();
  return weekRange.start === currentWeek.start;
}

export function isDateInRange(
  value: string | Date | undefined | null,
  range: WeekRange
): boolean {
  if (!value) {
    return false;
  }

  const datePart = normalizeDateString(value);
  return datePart >= range.start && datePart <= range.end;
}

export function computeHorseRideCounts(
  horses: Horse[],
  rides: Ride[],
  weekRange: WeekRange
): HorseRideCount[] {
  const weekRides = rides.filter((ride) => isDateInRange(ride.date, weekRange));

  const counts = horses.map((horse) => ({
    horseId: horse.id,
    horseName: horse.name,
    count: weekRides.filter((ride) =>
      ride.horses.some((rideHorse) => rideHorse.id === horse.id)
    ).length,
  }));

  return counts.sort((a, b) => b.count - a.count || a.horseName.localeCompare(b.horseName));
}

export function computePersonalChecklist(
  userId: string,
  feedings: Feeding[],
  tasks: Task[],
  weekRange: WeekRange
): PersonalChecklist {
  const userFeedings = feedings.filter(
    (feeding) =>
      feeding.assigned_user?.id === userId &&
      isDateInRange(feeding.schedule_date, weekRange)
  );

  const userTasks = tasks.filter(
    (task) =>
      task.assigned_user?.id === userId &&
      (!task.deadline || isDateInRange(task.deadline, weekRange))
  );

  const feedingsComplete = userFeedings.filter(
    (feeding) => feeding.feeding_status === 'COMPLETE'
  ).length;
  const tasksComplete = userTasks.filter((task) => task.is_complete ?? false).length;

  return {
    feedings: userFeedings,
    tasks: userTasks,
    summary: {
      feedingsComplete,
      feedingsTotal: userFeedings.length,
      tasksComplete,
      tasksTotal: userTasks.length,
    },
  };
}
