import { Feeding } from './feeding';
import { Ride } from './ride';
import { Task } from './task';
import { Treatment } from './treatment';

export type TimelineEvent =
  | { kind: 'feeding'; data: Feeding; sortMinutes: number }
  | { kind: 'ride'; data: Ride; sortMinutes: number }
  | { kind: 'treatment'; data: Treatment; sortMinutes: number }
  | { kind: 'task'; data: Task; sortMinutes: number };

export interface WeekDaySection {
  date: string;
  dayName: string;
  dateLabel: string;
  events: TimelineEvent[];
}

export interface MyWeekData {
  summaryCounts: {
    feedings: number;
    rides: number;
    tasks: number;
  };
  unassignedFeedings: Feeding[];
  overdueFeedings: Feeding[];
  daySections: WeekDaySection[];
  openTasks: Task[];
}

export interface ScheduleSectionData {
  feedings: TimelineEvent[];
  rides: TimelineEvent[];
  treatments: TimelineEvent[];
  tasksWithDeadlines: TimelineEvent[];
  datelessTasks: Task[];
}

export type ScheduleViewMode = 'calendar' | 'list';

export type CreateEventCategory = 'feeding' | 'task' | 'ride' | 'treatment';
