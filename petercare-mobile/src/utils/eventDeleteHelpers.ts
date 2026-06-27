import { Alert } from 'react-native';
import { TimelineEvent } from '../types/events';

function getEventLabel(event: TimelineEvent): string {
  switch (event.kind) {
    case 'ride':
      return 'ride';
    case 'task':
      return 'task';
    case 'treatment':
      return 'treatment';
    default:
      return 'event';
  }
}

export function confirmEventDelete(event: TimelineEvent): Promise<boolean> {
  const label = getEventLabel(event);

  return new Promise((resolve) => {
    Alert.alert(
      'Delete Event?',
      `Are you sure you want to delete this ${label}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
