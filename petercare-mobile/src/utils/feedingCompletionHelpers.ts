import { Alert } from 'react-native';
import { Feeding } from '../types/feeding';
import { formatShiftLabel, formatUserFacingDate, isToday, normalizeDateString } from './dateHelpers';

function formatScheduledDateLabel(scheduleDate: string): string {
  return formatUserFacingDate(scheduleDate);
}

export function confirmFeedingCompletionIfNeeded(feeding: Feeding): Promise<boolean> {
  if (isToday(feeding.schedule_date)) {
    return Promise.resolve(true);
  }

  const shiftLabel = formatShiftLabel(feeding.shift_type).toLowerCase();
  const scheduledDate = formatScheduledDateLabel(feeding.schedule_date);

  return new Promise((resolve) => {
    Alert.alert(
      'Confirm Feeding Completion',
      `This ${shiftLabel} is scheduled for ${scheduledDate}, not today. Are you sure you want to mark it complete?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Mark Complete', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
