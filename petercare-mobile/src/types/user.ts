import { UserRole } from './auth';

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  morning_alert_time?: string;
  evening_alert_time?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  morning_alert_time?: string;
  evening_alert_time?: string;
  expo_push_token?: string;
}
