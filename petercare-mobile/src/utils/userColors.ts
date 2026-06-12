import { ViewStyle } from 'react-native';
import { ProfileColorKey, UserSummary } from '../types/user';

export const UNASSIGNED_FEEDING_COLOR = '#FFEB3B';

export const PROFILE_COLOR_PALETTE: Record<ProfileColorKey, string> = {
  blue: '#A8CFF5',
  green: '#D8F0E0',
  red: '#F5D8DE',
  purple: '#E5D8F0',
  brown: '#D4B896',
  orange: '#F5E0C8',
  gray: '#C4C9D0',
  cream: '#FFF8E7',
};

export const PROFILE_COLOR_OPTIONS: {
  key: ProfileColorKey;
  label: string;
  hex: string;
}[] = [
  { key: 'blue', label: 'Blue', hex: PROFILE_COLOR_PALETTE.blue },
  { key: 'green', label: 'Green', hex: PROFILE_COLOR_PALETTE.green },
  { key: 'red', label: 'Red', hex: PROFILE_COLOR_PALETTE.red },
  { key: 'purple', label: 'Purple', hex: PROFILE_COLOR_PALETTE.purple },
  { key: 'brown', label: 'Brown', hex: PROFILE_COLOR_PALETTE.brown },
  { key: 'orange', label: 'Orange', hex: PROFILE_COLOR_PALETTE.orange },
  { key: 'gray', label: 'Gray', hex: PROFILE_COLOR_PALETTE.gray },
  { key: 'cream', label: 'Cream', hex: PROFILE_COLOR_PALETTE.cream },
];

const HASH_FALLBACK_COLORS = Object.values(PROFILE_COLOR_PALETTE);

export type ColorUser = Pick<UserSummary, 'id' | 'profile_color'>;

function hashFallbackColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % HASH_FALLBACK_COLORS.length;
  return HASH_FALLBACK_COLORS[index];
}

export function resolveUserColor(user: ColorUser): string {
  if (user.profile_color && user.profile_color in PROFILE_COLOR_PALETTE) {
    return PROFILE_COLOR_PALETTE[user.profile_color];
  }
  return hashFallbackColor(user.id);
}

export function resolveUserColorById(
  userId: string,
  users?: ColorUser[]
): string {
  const user = users?.find((entry) => entry.id === userId);
  if (user) {
    return resolveUserColor(user);
  }
  return hashFallbackColor(userId);
}

export interface EventCardStyleOptions {
  assignedUserId?: string;
  colorUser?: ColorUser;
  users?: ColorUser[];
  isUnassignedFeeding?: boolean;
  isCurrentUser?: boolean;
}

export function getEventCardStyle(options: EventCardStyleOptions = {}): ViewStyle {
  const {
    assignedUserId,
    colorUser,
    users,
    isUnassignedFeeding,
    isCurrentUser,
  } = options;

  if (isUnassignedFeeding) {
    return {
      backgroundColor: UNASSIGNED_FEEDING_COLOR,
      borderWidth: 1,
      borderColor: '#E6C200',
    };
  }

  if (!assignedUserId && !colorUser) {
    return {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E0E6ED',
    };
  }

  const backgroundColor = colorUser
    ? resolveUserColor(colorUser)
    : resolveUserColorById(assignedUserId!, users);

  return {
    backgroundColor,
    borderWidth: isCurrentUser ? 2.5 : 0,
    borderColor: isCurrentUser ? '#3498DB' : undefined,
  };
}
