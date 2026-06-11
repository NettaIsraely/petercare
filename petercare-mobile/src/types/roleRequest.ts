import { UserRole } from './auth';

export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface RoleRequestUser {
  id: string;
  name: string;
  email?: string;
}

export interface RoleRequest {
  id: string;
  requested_role: UserRole;
  status: RoleRequestStatus;
  created_at: string;
  reviewed_at?: string | null;
  user: RoleRequestUser;
  reviewed_by?: RoleRequestUser | null;
}
