import { UserRole } from './auth';

export type ProfileColorKey =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'brown'
  | 'orange'
  | 'gray'
  | 'cream';

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  display_order?: number;
  morning_alert_time?: string;
  evening_alert_time?: string;
  timezone?: string;
  profile_color?: ProfileColorKey;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  morning_alert_time?: string;
  evening_alert_time?: string;
  expo_push_token?: string;
  timezone?: string;
  profile_color?: ProfileColorKey;
}
