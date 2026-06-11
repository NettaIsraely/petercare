import { MyDayData, TimelineEvent } from '../types/events';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { Treatment } from '../types/treatment';
import { UserSummary } from '../types/user';
import {
  getShiftDeadlineTime,
  isPastShiftDeadline,
  isToday,
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

function getFeedingSortMinutes(feeding: Feeding, alertTimes: AlertTimes): number {
  const deadline = getShiftDeadlineTime(
    feeding.shift_type,
    alertTimes.morningTime,
    alertTimes.eveningTime
  );
  return parseTimeToMinutes(deadline);
}

export function computeMyDay(
  userId: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  alertTimes: AlertTimes = {}
): MyDayData {
  const todayFeedings = feedings.filter((f) => isToday(f.schedule_date));
  const todayRides = rides.filter((r) => isToday(r.date) && isUserOnRide(r, userId));
  const todayTreatments = treatments.filter(
    (t) => isToday(t.date) && t.user.id === userId
  );
  const todayTasks = tasks.filter(
    (t) =>
      t.deadline &&
      isToday(t.deadline) &&
      t.assigned_user?.id === userId &&
      !(t.is_complete ?? false)
  );

  const userTodayFeedings = todayFeedings.filter(
    (f) => f.assigned_user?.id === userId && f.feeding_status !== 'COMPLETE'
  );
  const userTodayTasks = tasks.filter(
    (t) =>
      t.deadline &&
      isToday(t.deadline) &&
      t.assigned_user?.id === userId &&
      !(t.is_complete ?? false)
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

  const itineraryEvents: TimelineEvent[] = [
    ...userTodayFeedings.map((feeding) => ({
      kind: 'feeding' as const,
      data: feeding,
      sortMinutes: getFeedingSortMinutes(feeding, alertTimes),
    })),
    ...todayRides.map((ride) => ({
      kind: 'ride' as const,
      data: ride,
      sortMinutes: parseTimeToMinutes(ride.start_time),
    })),
    ...todayTreatments.map((treatment) => ({
      kind: 'treatment' as const,
      data: treatment,
      sortMinutes: parseTimeToMinutes('09:00:00'),
    })),
    ...todayTasks.map((task) => ({
      kind: 'task' as const,
      data: task,
      sortMinutes: parseTimeToMinutes('23:59:00'),
    })),
  ].sort((a, b) => a.sortMinutes - b.sortMinutes);

  const openTasks = tasks.filter(
    (t) => t.assigned_user?.id === userId && !t.deadline && !(t.is_complete ?? false)
  );

  return {
    summaryCounts: {
      feedings: userTodayFeedings.length,
      rides: todayRides.length,
      tasks: userTodayTasks.length,
    },
    unassignedFeedings,
    overdueFeedings,
    itinerary: itineraryEvents,
    openTasks,
  };
}

export function mergeUserAlertTimes(user?: UserSummary): AlertTimes {
  return {
    morningTime: user?.morning_alert_time ?? '08:00:00',
    eveningTime: user?.evening_alert_time ?? '18:00:00',
  };
}
