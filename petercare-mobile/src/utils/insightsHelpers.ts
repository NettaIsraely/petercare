import { Feeding } from '../types/feeding';
import { Horse } from '../types/horse';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { normalizeDateString, toDateString } from './dateHelpers';

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

function formatWeekLabel(start: Date, end: Date): string {
  const startLabel = start.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
  });
  const endLabel = end.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function getCurrentWeekRange(referenceDate = new Date()): WeekRange {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startDate = new Date(date);
  startDate.setDate(date.getDate() - daysFromMonday);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: toDateString(startDate),
    end: toDateString(endDate),
    label: formatWeekLabel(startDate, endDate),
  };
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
