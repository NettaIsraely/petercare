export type UserRole = 'OWNER' | 'CAREGIVER' | 'GUEST';

export interface JwtPayload {
  sub: string;
  name: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export interface AuthUser {
  userId: string;
  name: string;
  role: UserRole;
}
