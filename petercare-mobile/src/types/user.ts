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

export interface NotificationPreferences {
  push_notifications_enabled: boolean;
  notify_feeding_reminders: boolean;
  notify_shift_reassigned: boolean;
  notify_unassigned_feeding: boolean;
  notify_feeding_incomplete_assignee: boolean;
  notify_feeding_incomplete_broadcast: boolean;
  notify_task_deadlines: boolean;
  notify_role_requests: boolean;
  notify_role_request_resolved: boolean;
}

export interface UserSummary extends NotificationPreferences {
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
  push_notifications_enabled?: boolean;
  notify_feeding_reminders?: boolean;
  notify_shift_reassigned?: boolean;
  notify_unassigned_feeding?: boolean;
  notify_feeding_incomplete_assignee?: boolean;
  notify_feeding_incomplete_broadcast?: boolean;
  notify_task_deadlines?: boolean;
  notify_role_requests?: boolean;
  notify_role_request_resolved?: boolean;
}
