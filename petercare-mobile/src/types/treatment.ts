import { Horse } from './horse';
import { UserSummary } from './user';

export interface Treatment {
  id: string;
  name: string;
  duration_minutes?: number;
  horse: Horse;
  user: UserSummary;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTreatmentPayload {
  name: string;
  horse_id: string;
  user_id: string;
  date?: string;
  duration_minutes?: number;
}
