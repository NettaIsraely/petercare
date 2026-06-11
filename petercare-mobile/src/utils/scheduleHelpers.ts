import { ScheduleSectionData, TimelineEvent } from '../types/events';
import { getRollingWeekDateStrings } from './dateHelpers';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { Treatment } from '../types/treatment';
import {
  getShiftDeadlineTime,
  normalizeDateString,
  parseTimeToMinutes,
} from './dateHelpers';
import { UserSummary } from '../types/user';

interface AlertTimes {
  morningTime?: string;
  eveningTime?: string;
}

export const CALENDAR_FEEDING_ALERT_TIMES: AlertTimes = {
  morningTime: '07:00:00',
  eveningTime: '19:00:00',
};

export type CalendarMarkedDates = Record<
  string,
  {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  }
>;

function getFeedingSortMinutes(feeding: Feeding, alertTimes: AlertTimes): number {
  const deadline = getShiftDeadlineTime(
    feeding.shift_type,
    alertTimes.morningTime,
    alertTimes.eveningTime
  );
  return parseTimeToMinutes(deadline);
}

function toFeedingEvent(feeding: Feeding, alertTimes: AlertTimes): TimelineEvent {
  return {
    kind: 'feeding',
    data: feeding,
    sortMinutes: getFeedingSortMinutes(feeding, alertTimes),
  };
}

function toRideEvent(ride: Ride): TimelineEvent {
  return {
    kind: 'ride',
    data: ride,
    sortMinutes: parseTimeToMinutes(ride.start_time),
  };
}

function toTreatmentEvent(treatment: Treatment): TimelineEvent {
  return {
    kind: 'treatment',
    data: treatment,
    sortMinutes: parseTimeToMinutes('09:00:00'),
  };
}

function toTaskEvent(task: Task): TimelineEvent {
  return {
    kind: 'task',
    data: task,
    sortMinutes: parseTimeToMinutes('23:59:00'),
  };
}

function compareByDateThenSortMinutes(a: TimelineEvent, b: TimelineEvent): number {
  const dateA = getEventDateString(a);
  const dateB = getEventDateString(b);
  if (dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }
  return a.sortMinutes - b.sortMinutes;
}

export interface EventTimeSlot {
  hasTime: boolean;
  hour: number;
  endHour?: number;
}

export function getAssignedUserId(event: TimelineEvent): string | undefined {
  switch (event.kind) {
    case 'feeding':
      return event.data.assigned_user?.id;
    case 'task':
      return event.data.assigned_user?.id;
    case 'ride':
      return event.data.primary_rider.id;
    case 'treatment':
      return event.data.user.id;
    default:
      return undefined;
  }
}

export function getAssigneeName(event: TimelineEvent): string | undefined {
  switch (event.kind) {
    case 'feeding':
      return event.data.feeding_status === 'UNASSIGNED'
        ? 'Unassigned'
        : event.data.assigned_user?.name;
    case 'task':
      return event.data.assigned_user?.name;
    case 'ride':
      return event.data.primary_rider.name;
    case 'treatment':
      return event.data.user.name;
    default:
      return undefined;
  }
}

export function isUnassignedFeeding(event: TimelineEvent): boolean {
  return event.kind === 'feeding' && event.data.feeding_status === 'UNASSIGNED';
}

export function isEventOwnedByUser(
  event: TimelineEvent,
  currentUserId?: string
): boolean {
  if (!currentUserId) {
    return false;
  }
  return getAssignedUserId(event) === currentUserId;
}

export function getEventTimeSlot(
  event: TimelineEvent,
  alertTimes: AlertTimes
): EventTimeSlot {
  switch (event.kind) {
    case 'feeding': {
      const deadline = getShiftDeadlineTime(
        event.data.shift_type,
        alertTimes.morningTime,
        alertTimes.eveningTime
      );
      const minutes = parseTimeToMinutes(deadline);
      return { hasTime: true, hour: Math.floor(minutes / 60) };
    }
    case 'ride': {
      const startMinutes = parseTimeToMinutes(event.data.start_time);
      const endMinutes = parseTimeToMinutes(event.data.end_time);
      return {
        hasTime: true,
        hour: Math.floor(startMinutes / 60),
        endHour: Math.floor(endMinutes / 60),
      };
    }
    case 'treatment':
    case 'task':
      return { hasTime: false, hour: 0 };
    default:
      return { hasTime: false, hour: 0 };
  }
}

export function getEventDateString(event: TimelineEvent): string {
  switch (event.kind) {
    case 'feeding':
      return normalizeDateString(event.data.schedule_date);
    case 'ride':
      return normalizeDateString(event.data.date);
    case 'treatment':
      return normalizeDateString(event.data.date);
    case 'task':
      return event.data.deadline ? normalizeDateString(event.data.deadline) : '';
    default:
      return '';
  }
}

export function buildCalendarMarkedDates(
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  selectedDate: string
): CalendarMarkedDates {
  const dates = new Set<string>();

  feedings.forEach((f) => dates.add(normalizeDateString(f.schedule_date)));
  rides.forEach((r) => dates.add(normalizeDateString(r.date)));
  treatments.forEach((t) => dates.add(normalizeDateString(t.date)));
  tasks.forEach((t) => {
    if (t.deadline) {
      dates.add(normalizeDateString(t.deadline));
    }
  });

  const marked: CalendarMarkedDates = {};
  dates.forEach((date) => {
    marked[date] = {
      marked: true,
      dotColor: '#3498DB',
    };
  });

  marked[selectedDate] = {
    ...(marked[selectedDate] ?? {}),
    selected: true,
    selectedColor: '#3498DB',
    marked: marked[selectedDate]?.marked ?? false,
    dotColor: '#FFFFFF',
  };

  return marked;
}

export function getEventsForWeek(
  anchorDate: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  profile?: UserSummary
): Record<string, TimelineEvent[]> {
  const weekDates = getRollingWeekDateStrings(anchorDate);
  const result: Record<string, TimelineEvent[]> = {};

  weekDates.forEach((date) => {
    result[date] = getEventsForDate(
      date,
      feedings,
      tasks,
      rides,
      treatments,
      profile
    );
  });

  return result;
}

export function getEventsForDate(
  date: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  profile?: UserSummary
): TimelineEvent[] {
  const alertTimes = CALENDAR_FEEDING_ALERT_TIMES;
  const normalizedDate = normalizeDateString(date);

  const dayFeedings = feedings
    .filter((f) => normalizeDateString(f.schedule_date) === normalizedDate)
    .map((f) => toFeedingEvent(f, alertTimes));

  const dayRides = rides
    .filter((r) => normalizeDateString(r.date) === normalizedDate)
    .map(toRideEvent);

  const dayTreatments = treatments
    .filter((t) => normalizeDateString(t.date) === normalizedDate)
    .map(toTreatmentEvent);

  const dayTasks = tasks
    .filter((t) => t.deadline && normalizeDateString(t.deadline) === normalizedDate)
    .map(toTaskEvent);

  return [...dayFeedings, ...dayRides, ...dayTreatments, ...dayTasks].sort(
    (a, b) => a.sortMinutes - b.sortMinutes
  );
}

export function buildScheduleListSections(
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  profile?: UserSummary
): ScheduleSectionData {
  const alertTimes = CALENDAR_FEEDING_ALERT_TIMES;

  const feedingEvents = feedings
    .map((f) => toFeedingEvent(f, alertTimes))
    .sort(compareByDateThenSortMinutes);

  const rideEvents = rides.map(toRideEvent).sort(compareByDateThenSortMinutes);

  const treatmentEvents = treatments
    .map(toTreatmentEvent)
    .sort(compareByDateThenSortMinutes);

  const tasksWithDeadlines = tasks
    .filter((t) => t.deadline)
    .map(toTaskEvent)
    .sort(compareByDateThenSortMinutes);

  const datelessTasks = tasks
    .filter((t) => !t.deadline && !(t.is_complete ?? false))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    feedings: feedingEvents,
    rides: rideEvents,
    treatments: treatmentEvents,
    tasksWithDeadlines,
    datelessTasks,
  };
}

export function taskToTimelineEvent(task: Task): TimelineEvent {
  return toTaskEvent(task);
}

export function feedingToTimelineEvent(
  feeding: Feeding,
  profile?: UserSummary
): TimelineEvent {
  return toFeedingEvent(feeding, CALENDAR_FEEDING_ALERT_TIMES);
}

export function rideToTimelineEvent(ride: Ride): TimelineEvent {
  return toRideEvent(ride);
}

export function treatmentToTimelineEvent(treatment: Treatment): TimelineEvent {
  return toTreatmentEvent(treatment);
}
