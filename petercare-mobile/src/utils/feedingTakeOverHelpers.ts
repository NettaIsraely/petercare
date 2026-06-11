import { Alert } from 'react-native';
import { Feeding } from '../types/feeding';
import { formatShiftLabel } from './dateHelpers';

export function confirmFeedingTakeOver(feeding: Feeding): Promise<boolean> {
  const shiftLabel = formatShiftLabel(feeding.shift_type).toLowerCase();
  const assigneeName = feeding.assigned_user?.name ?? 'someone else';

  return new Promise((resolve) => {
    Alert.alert(
      'Take Over Shift?',
      `This ${shiftLabel} is already assigned to ${assigneeName}. Are you sure you want to take it? They will be notified.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Take Shift', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
