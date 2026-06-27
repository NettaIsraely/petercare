import { ShiftType } from '../feedings/entities/feeding.entity';
import {
  feedingIncompleteAssigneePromptMessage,
  feedingIncompleteBroadcastAssignedMessage,
  feedingIncompleteBroadcastUnassignedMessage,
  feedingReminderMessage,
  eventModifiedMessage,
  rideJoinedMessage,
  shiftReassignedMessage,
  unassignedNightAlertMessage,
} from './notification-messages';

describe('notification-messages', () => {
  it('formats feeding reminder with title-case shift label', () => {
    expect(feedingReminderMessage(ShiftType.MORNING)).toBe(
      'Reminder: Feed the horses! You have the Morning feeding shift today!',
    );
  });

  it('formats shift reassigned message with DD/MM/YYYY date', () => {
    expect(
      shiftReassignedMessage('Jane Smith', ShiftType.EVENING, '2026-06-20'),
    ).toBe('Heads up! Jane Smith covered your Evening feeding shift on 20/06/2026.');
  });

  it('formats unassigned night alert with DD/MM/YYYY date', () => {
    expect(unassignedNightAlertMessage(ShiftType.MORNING, '2026-06-21')).toBe(
      "Tomorrow's Morning feeding on 21/06/2026 is still unassigned.",
    );
  });

  it('formats incomplete assignee prompt', () => {
    expect(feedingIncompleteAssigneePromptMessage(ShiftType.MORNING)).toBe(
      'Please confirm in the app: did you complete today\'s Morning feeding? Tap to mark it complete if the horses have been fed.',
    );
  });

  it('formats incomplete broadcast with assignee name', () => {
    expect(
      feedingIncompleteBroadcastAssignedMessage(ShiftType.EVENING, 'Jane Smith'),
    ).toBe(
      "Today's Evening feeding has not been marked complete. Assigned to: Jane Smith.",
    );
  });

  it('formats incomplete broadcast when unassigned', () => {
    expect(feedingIncompleteBroadcastUnassignedMessage(ShiftType.MORNING)).toBe(
      "Today's Morning feeding has not been marked complete and is still unassigned.",
    );
  });

  it('formats event modified message', () => {
    expect(eventModifiedMessage('Alex')).toBe('Alex made changes to this event.');
  });

  it('formats ride joined message', () => {
    expect(rideJoinedMessage('Alex', '2026-06-20')).toBe(
      'Alex joined your ride on 20/06/2026.',
    );
  });
});
