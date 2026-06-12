import { Task } from '../types/task';
import { normalizeDateString } from './dateHelpers';
import { taskToTimelineEvent } from './scheduleHelpers';

export type AssigneeFilter = 'all' | 'me' | 'unassigned' | string;

export function partitionTasks(tasks: Task[]): {
  openTasks: Task[];
  completedTasks: Task[];
} {
  const openTasks: Task[] = [];
  const completedTasks: Task[] = [];

  for (const task of tasks) {
    if (task.is_complete ?? false) {
      completedTasks.push(task);
    } else {
      openTasks.push(task);
    }
  }

  return { openTasks, completedTasks };
}

export function filterTasksByAssignee(
  tasks: Task[],
  filter: AssigneeFilter,
  currentUserId?: string
): Task[] {
  if (filter === 'all') {
    return tasks;
  }

  if (filter === 'me') {
    if (!currentUserId) {
      return [];
    }
    return tasks.filter((task) => task.assigned_user?.id === currentUserId);
  }

  if (filter === 'unassigned') {
    return tasks.filter((task) => !task.assigned_user);
  }

  return tasks.filter((task) => task.assigned_user?.id === filter);
}

export function sortCompletedTasksForList(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function sortTasksForList(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const deadlineA = a.deadline ? normalizeDateString(a.deadline) : null;
    const deadlineB = b.deadline ? normalizeDateString(b.deadline) : null;

    if (deadlineA && deadlineB) {
      const dateCompare = deadlineA.localeCompare(deadlineB);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return a.name.localeCompare(b.name);
    }

    if (deadlineA && !deadlineB) {
      return -1;
    }

    if (!deadlineA && deadlineB) {
      return 1;
    }

    return a.name.localeCompare(b.name);
  });
}

export function buildFilteredBarnTasks(
  tasks: Task[],
  filter: AssigneeFilter,
  currentUserId?: string
): { openTasks: Task[]; completedTasks: Task[] } {
  const filtered = filterTasksByAssignee(tasks, filter, currentUserId);
  const { openTasks, completedTasks } = partitionTasks(filtered);

  return {
    openTasks: sortTasksForList(openTasks),
    completedTasks: sortCompletedTasksForList(completedTasks),
  };
}

export { taskToTimelineEvent };
