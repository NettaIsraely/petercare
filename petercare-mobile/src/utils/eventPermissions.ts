import { UserRole } from '../types/auth';
import { TimelineEvent } from '../types/events';
import { isEventCompleted } from './scheduleHelpers';

export type EventAction = 'create' | 'edit' | 'volunteer' | 'claim' | 'complete' | 'takeOver';

export function canCreateEvents(role?: UserRole): boolean {
  return role !== undefined && role !== 'GUEST';
}

export function canEditEvent(
  role: UserRole | undefined,
  event: TimelineEvent,
  userId?: string
): boolean {
  if (!role || role === 'GUEST' || !userId) {
    return false;
  }

  if (role === 'OWNER') {
    return true;
  }

  switch (event.kind) {
    case 'feeding': {
      const isUnassigned = event.data.feeding_status === 'UNASSIGNED';
      const isMine = event.data.assigned_user?.id === userId;
      return isUnassigned || isMine;
    }
    case 'task': {
      const isUnassigned = !event.data.assigned_user?.id;
      const isMine = event.data.assigned_user?.id === userId;
      return isUnassigned || isMine;
    }
    case 'ride': {
      const isPrimary = event.data.primary_rider?.id === userId;
      const isAdditional = event.data.additional_riders?.some((r) => r.id === userId);
      return isPrimary || !!isAdditional;
    }
    case 'treatment':
      return event.data.user?.id === userId;
    default:
      return false;
  }
}

export function canPerformAction(
  role: UserRole | undefined,
  action: EventAction,
  event: TimelineEvent | null,
  userId?: string
): boolean {
  if (!role || role === 'GUEST') {
    return false;
  }

  if (action === 'create') {
    return canCreateEvents(role);
  }

  if (!event || !userId) {
    return false;
  }

  switch (action) {
    case 'edit':
      return canEditEvent(role, event, userId);
    case 'volunteer':
      return (
        event.kind === 'feeding' &&
        event.data.feeding_status === 'UNASSIGNED' &&
        canEditEvent(role, event, userId)
      );
    case 'claim':
      return event.kind === 'task' && !event.data.assigned_user?.id;
    case 'takeOver':
      return (
        (role === 'OWNER' || role === 'CAREGIVER') &&
        event.kind === 'feeding' &&
        event.data.feeding_status !== 'COMPLETE' &&
        event.data.feeding_status !== 'UNASSIGNED' &&
        !!event.data.assigned_user?.id &&
        event.data.assigned_user.id !== userId
      );
    case 'complete':
      if (role === 'OWNER') {
        if (event.kind === 'feeding') {
          return (
            event.data.feeding_status !== 'COMPLETE' &&
            event.data.feeding_status !== 'UNASSIGNED'
          );
        }
        if (event.kind === 'task') {
          return !!event.data.assigned_user && !event.data.is_complete;
        }
        if (event.kind === 'treatment') {
          return !event.data.is_complete;
        }
        return false;
      }
      if (event.kind === 'feeding') {
        return (
          event.data.feeding_status !== 'COMPLETE' &&
          event.data.feeding_status !== 'UNASSIGNED' &&
          event.data.assigned_user?.id === userId
        );
      }
      if (event.kind === 'task') {
        return (
          !!event.data.assigned_user &&
          event.data.assigned_user.id === userId &&
          !event.data.is_complete
        );
      }
      if (event.kind === 'treatment') {
        return event.data.user?.id === userId && !event.data.is_complete;
      }
      return false;
    default:
      return false;
  }
}

export function canToggleComplete(
  role: UserRole | undefined,
  event: TimelineEvent,
  userId?: string
): boolean {
  if (isEventCompleted(event)) {
    return canEditEvent(role, event, userId);
  }
  return canPerformAction(role, 'complete', event, userId);
}
