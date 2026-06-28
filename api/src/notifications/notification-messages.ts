import { Feeding, ShiftType } from '../feedings/entities/feeding.entity';
import { Ride } from '../rides/entities/ride.entity';
import { Task } from '../tasks/entities/task.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventKind } from '../common/event-permissions';
import { formatUserFacingDate, formatScheduleDate } from '../common/timezone.util';

export function formatShiftLabel(shiftType: ShiftType): string {
  return shiftType === ShiftType.MORNING ? 'Morning' : 'Evening';
}

export function feedingReminderMessage(shiftType: ShiftType): string {
  return `Reminder: Feed the horses! You have the ${formatShiftLabel(shiftType)} feeding shift today!`;
}

export function shiftReassignedMessage(
  newAssigneeName: string,
  shiftType: ShiftType,
  scheduleDate: Date | string,
): string {
  const dateLabel = formatUserFacingDate(formatScheduleDate(scheduleDate));
  return `Heads up! ${newAssigneeName} covered your ${formatShiftLabel(shiftType)} feeding shift on ${dateLabel}.`;
}

export function unassignedNightAlertMessage(
  shiftType: ShiftType,
  scheduleDate: Date | string,
): string {
  const dateLabel = formatUserFacingDate(formatScheduleDate(scheduleDate));
  return `Tomorrow's ${formatShiftLabel(shiftType)} feeding on ${dateLabel} is still unassigned.`;
}

export function feedingIncompleteAssigneePromptMessage(shiftType: ShiftType): string {
  return `Please confirm in the app: did you complete today's ${formatShiftLabel(shiftType)} feeding? Tap to mark it complete if the horses have been fed.`;
}

export function feedingIncompleteBroadcastAssignedMessage(
  shiftType: ShiftType,
  assigneeName: string,
): string {
  return `Today's ${formatShiftLabel(shiftType)} feeding has not been marked complete. Assigned to: ${assigneeName}.`;
}

export function feedingIncompleteBroadcastUnassignedMessage(shiftType: ShiftType): string {
  return `Today's ${formatShiftLabel(shiftType)} feeding has not been marked complete and is still unassigned.`;
}

export function taskDeadlineReminderMessage(taskName: string): string {
  return `Reminder: "${taskName}" is due tomorrow.`;
}

export function roleRequestAlertMessage(requesterName: string): string {
  return `${requesterName} requested caregiver access.`;
}

export function roleRequestApprovedMessage(): string {
  return 'Your caregiver access request was approved.';
}

export function roleRequestDeniedMessage(): string {
  return 'Your caregiver access request was denied. You may submit a new request.';
}

function getEventModifiedLabel(
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): string {
  switch (eventKind) {
    case 'feeding': {
      const feeding = entity as Feeding;
      return `${formatShiftLabel(feeding.shift_type)} feeding`;
    }
    case 'task': {
      const task = entity as Task;
      return `task '${task.name}'`;
    }
    case 'ride':
      return 'ride';
    case 'treatment': {
      const treatment = entity as Treatment;
      return `treatment '${treatment.name}'`;
    }
    default:
      return 'event';
  }
}

function getEventModifiedScheduleDate(
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): Date | string | undefined {
  switch (eventKind) {
    case 'feeding':
      return (entity as Feeding).schedule_date;
    case 'task':
      return (entity as Task).deadline;
    case 'ride':
      return (entity as Ride).date;
    case 'treatment':
      return (entity as Treatment).date;
    default:
      return undefined;
  }
}

export function getEventScheduleDateString(
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): string | undefined {
  const scheduleDate = getEventModifiedScheduleDate(eventKind, entity);
  return scheduleDate ? formatScheduleDate(scheduleDate) : undefined;
}

export function eventModifiedMessage(
  editorName: string,
  eventKind: EventKind,
  entity: Feeding | Task | Ride | Treatment,
): string {
  const eventLabel = getEventModifiedLabel(eventKind, entity);
  const scheduleDate = getEventModifiedScheduleDate(eventKind, entity);

  if (scheduleDate) {
    const dateLabel = formatUserFacingDate(formatScheduleDate(scheduleDate));
    return `${editorName} made changes to your ${eventLabel} on ${dateLabel}.`;
  }

  return `${editorName} made changes to your ${eventLabel}.`;
}

export function rideJoinedMessage(
  joinerName: string,
  rideDate: Date | string,
): string {
  const dateLabel = formatUserFacingDate(formatScheduleDate(rideDate));
  return `${joinerName} joined your ride on ${dateLabel}.`;
}

export function rideRemovedMessage(
  editorName: string,
  rideDate: Date | string,
): string {
  const dateLabel = formatUserFacingDate(formatScheduleDate(rideDate));
  return `${editorName} removed you from the ride on ${dateLabel}.`;
}
