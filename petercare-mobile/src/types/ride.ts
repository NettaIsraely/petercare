import { Horse } from './horse';
import { UserSummary } from './user';

export interface Ride {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  primary_rider: UserSummary;
  additional_riders?: UserSummary[];
  horses: Horse[];
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRidePayload {
  date: string;
  start_time: string;
  end_time: string;
  primary_rider_id: string;
  horses: string[];
  additional_riders_ids?: string[];
  comments?: string;
}
