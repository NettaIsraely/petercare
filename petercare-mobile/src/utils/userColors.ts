import { ViewStyle } from 'react-native';

export const UNASSIGNED_FEEDING_COLOR = '#FFEB3B';

const USER_COLORS = [
  '#DCE9F5',
  '#D8F0E0',
  '#F5D8DE',
  '#E5D8F0',
  '#D0EDE5',
  '#E8D8F0',
  '#F5D8E8',
  '#D8E8F5',
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export interface EventCardStyleOptions {
  assignedUserId?: string;
  isUnassignedFeeding?: boolean;
  isCurrentUser?: boolean;
}

export function getEventCardStyle(options: EventCardStyleOptions = {}): ViewStyle {
  const { assignedUserId, isUnassignedFeeding, isCurrentUser } = options;

  if (isUnassignedFeeding) {
    return {
      backgroundColor: UNASSIGNED_FEEDING_COLOR,
      borderWidth: 1,
      borderColor: '#E6C200',
    };
  }

  if (!assignedUserId) {
    return {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E6ED',
    };
  }

  return {
    backgroundColor: getUserColor(assignedUserId),
    borderWidth: isCurrentUser ? 2.5 : 0,
    borderColor: isCurrentUser ? '#3498DB' : undefined,
  };
}
