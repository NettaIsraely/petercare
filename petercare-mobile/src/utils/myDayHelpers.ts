import { MyWeekData, TimelineEvent } from '../types/events';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { Treatment } from '../types/treatment';
import { UserSummary } from '../types/user';
import {
  formatWeekDayHeader,
  getShiftDeadlineTime,
  isOnOrAfterToday,
  isPastShiftDeadline,
  isToday,
  normalizeDateString,
  parseTimeToMinutes,
} from './dateHelpers';

interface AlertTimes {
  morningTime?: string;
  eveningTime?: string;
}

function isUserOnRide(ride: Ride, userId: string): boolean {
  if (ride.primary_rider.id === userId) {
    return true;
  }
  return ride.additional_riders?.some((rider) => rider.id === userId) ?? false;
}

function getUserFutureScheduleDates(
  userId: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[]
): string[] {
  const dates = new Set<string>();

  feedings.forEach((feeding) => {
    if (
      feeding.assigned_user?.id === userId &&
      isOnOrAfterToday(feeding.schedule_date)
    ) {
      dates.add(normalizeDateString(feeding.schedule_date));
    }
  });

  tasks.forEach((task) => {
    if (
      task.deadline &&
      task.assigned_user?.id === userId &&
      isOnOrAfterToday(task.deadline)
    ) {
      dates.add(normalizeDateString(task.deadline));
    }
  });

  rides.forEach((ride) => {
    if (isUserOnRide(ride, userId) && isOnOrAfterToday(ride.date)) {
      dates.add(normalizeDateString(ride.date));
    }
  });

  treatments.forEach((treatment) => {
    if (treatment.user.id === userId && isOnOrAfterToday(treatment.date)) {
      dates.add(normalizeDateString(treatment.date));
    }
  });

  return Array.from(dates).sort();
}

function getFeedingSortMinutes(feeding: Feeding, alertTimes: AlertTimes): number {
  const deadline = getShiftDeadlineTime(
    feeding.shift_type,
    alertTimes.morningTime,
    alertTimes.eveningTime
  );
  return parseTimeToMinutes(deadline);
}

function getEventsForDate(
  date: string,
  userId: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  alertTimes: AlertTimes
): TimelineEvent[] {
  const normalizedDate = normalizeDateString(date);

  const dayFeedings = feedings
    .filter(
      (f) =>
        normalizeDateString(f.schedule_date) === normalizedDate &&
        f.assigned_user?.id === userId
    )
    .map((feeding) => ({
      kind: 'feeding' as const,
      data: feeding,
      sortMinutes: getFeedingSortMinutes(feeding, alertTimes),
    }));

  const dayRides = rides
    .filter(
      (r) => normalizeDateString(r.date) === normalizedDate && isUserOnRide(r, userId)
    )
    .map((ride) => ({
      kind: 'ride' as const,
      data: ride,
      sortMinutes: parseTimeToMinutes(ride.start_time),
    }));

  const dayTreatments = treatments
    .filter(
      (t) =>
        normalizeDateString(t.date) === normalizedDate &&
        t.user.id === userId
    )
    .map((treatment) => ({
      kind: 'treatment' as const,
      data: treatment,
      sortMinutes: parseTimeToMinutes('09:00:00'),
    }));

  const dayTasks = tasks
    .filter(
      (t) =>
        t.deadline &&
        normalizeDateString(t.deadline) === normalizedDate &&
        t.assigned_user?.id === userId
    )
    .map((task) => ({
      kind: 'task' as const,
      data: task,
      sortMinutes: parseTimeToMinutes('23:59:00'),
    }));

  return [...dayFeedings, ...dayRides, ...dayTreatments, ...dayTasks].sort(
    (a, b) => a.sortMinutes - b.sortMinutes
  );
}

export function computeMyWeek(
  userId: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  alertTimes: AlertTimes = {}
): MyWeekData {
  const todayFeedings = feedings.filter((f) => isToday(f.schedule_date));

  const userScheduleFeedings = feedings.filter(
    (f) =>
      isOnOrAfterToday(f.schedule_date) &&
      f.assigned_user?.id === userId
  );

  const scheduleRides = rides.filter(
    (r) => isOnOrAfterToday(r.date) && isUserOnRide(r, userId)
  );

  const userScheduleTasks = tasks.filter(
    (t) =>
      t.deadline &&
      isOnOrAfterToday(t.deadline) &&
      t.assigned_user?.id === userId
  );

  const unassignedFeedings = todayFeedings.filter(
    (f) => f.feeding_status === 'UNASSIGNED'
  );

  const overdueFeedings = todayFeedings.filter(
    (f) =>
      f.assigned_user?.id === userId &&
      f.feeding_status !== 'COMPLETE' &&
      isPastShiftDeadline(
        f.schedule_date,
        f.shift_type,
        alertTimes.morningTime,
        alertTimes.eveningTime
      )
  );

  const daySections = getUserFutureScheduleDates(userId, feedings, tasks, rides, treatments)
    .map((date) => {
      const events = getEventsForDate(
        date,
        userId,
        feedings,
        tasks,
        rides,
        treatments,
        alertTimes
      );
      if (events.length === 0) {
        return null;
      }
      const { dayName, dateLabel } = formatWeekDayHeader(date);
      return { date, dayName, dateLabel, events };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const openTasks = tasks.filter(
    (t) => t.assigned_user?.id === userId && !t.deadline && !(t.is_complete ?? false)
  );

  return {
    summaryCounts: {
      feedings: userScheduleFeedings.length,
      rides: scheduleRides.length,
      tasks: userScheduleTasks.length,
    },
    unassignedFeedings,
    overdueFeedings,
    daySections,
    openTasks,
  };
}

export function mergeUserAlertTimes(user?: UserSummary): AlertTimes {
  return {
    morningTime: user?.morning_alert_time ?? '08:00:00',
    eveningTime: user?.evening_alert_time ?? '18:00:00',
  };
}
