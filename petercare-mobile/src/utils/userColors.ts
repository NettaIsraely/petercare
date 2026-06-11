import { ViewStyle } from 'react-native';

const USER_COLORS = [
  '#D6EAF8',
  '#D5F5E3',
  '#FCF3CF',
  '#FADBD8',
  '#E8DAEF',
  '#D1F2EB',
  '#FDEBD0',
  '#EBDEF0',
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}

export function getEventCardStyle(assignedUserId?: string): ViewStyle {
  if (!assignedUserId) {
    return {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E6ED',
    };
  }

  return {
    backgroundColor: getUserColor(assignedUserId),
    borderWidth: 0,
  };
}
