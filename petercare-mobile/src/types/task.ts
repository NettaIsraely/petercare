import { UserSummary } from './user';

export interface Task {
  id: string;
  name: string;
  deadline?: string;
  comments?: string;
  assigned_user?: UserSummary;
  is_complete?: boolean;
  created_at: string;
  updated_at: string;
}
