import { ShiftType } from '../feedings/entities/feeding.entity';
import { formatUserFacingDate, formatScheduleDate } from '../common/timezone.util';

export function formatShiftLabel(shiftType: ShiftType): string {
  return shiftType === ShiftType.MORNING ? 'Morning' : 'Evening';
}

export function feedingReminderMessage(shiftType: ShiftType): string {
  return `Reminder: You have the ${formatShiftLabel(shiftType)} feeding shift coming up!`;
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
