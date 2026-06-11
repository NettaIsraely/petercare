import { ScheduleSectionData, TimelineEvent } from '../types/events';
import { Feeding } from '../types/feeding';
import { Ride } from '../types/ride';
import { Task } from '../types/task';
import { Treatment } from '../types/treatment';
import {
  getShiftDeadlineTime,
  normalizeDateString,
  parseTimeToMinutes,
} from './dateHelpers';
import { mergeUserAlertTimes } from './myDayHelpers';
import { UserSummary } from '../types/user';

interface AlertTimes {
  morningTime?: string;
  eveningTime?: string;
}

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

export function getEventsForDate(
  date: string,
  feedings: Feeding[],
  tasks: Task[],
  rides: Ride[],
  treatments: Treatment[],
  profile?: UserSummary
): TimelineEvent[] {
  const alertTimes = mergeUserAlertTimes(profile);
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
  const alertTimes = mergeUserAlertTimes(profile);

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
  return toFeedingEvent(feeding, mergeUserAlertTimes(profile));
}

export function rideToTimelineEvent(ride: Ride): TimelineEvent {
  return toRideEvent(ride);
}

export function treatmentToTimelineEvent(treatment: Treatment): TimelineEvent {
  return toTreatmentEvent(treatment);
}
