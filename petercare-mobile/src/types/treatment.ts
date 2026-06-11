import { Horse } from './horse';
import { UserSummary } from './user';

export const PREDEFINED_TREATMENT_NAMES = ['Physiotherapy', 'Shoeing'] as const;
export type PredefinedTreatmentName = (typeof PREDEFINED_TREATMENT_NAMES)[number];

export interface Treatment {
  id: string;
  name: string;
  duration_minutes?: number;
  horses: Horse[];
  user: UserSummary;
  date: string;
  is_complete?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTreatmentPayload {
  name: string;
  horse_ids: string[];
  user_id: string;
  date?: string;
  duration_minutes?: number;
}

export interface UpdateTreatmentPayload {
  name?: string;
  horse_ids?: string[];
  user_id?: string;
  date?: string;
  duration_minutes?: number;
}
