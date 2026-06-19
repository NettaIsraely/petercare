import { UserSummary } from './user';

export type ShiftType = 'MORNING' | 'EVENING';
export type FeedingStatus = 'UNASSIGNED' | 'ASSIGNED' | 'COMPLETE';

export interface Feeding {
  id: string;
  schedule_date: string;
  shift_type: ShiftType;
  feeding_status: FeedingStatus;
  assigned_user?: UserSummary;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedingPayload {
  schedule_date: string;
  shift_type: ShiftType;
  assigned_user_id?: string;
}

export interface UpdateFeedingPayload {
  assigned_user_id?: string | null;
  notification_time?: string;
  feeding_status?: FeedingStatus;
}
