export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';


export type LegacyRole = 'admin' | 'teacher' | 'parent';


export const LEGACY_ROLE_MAP: Record<LegacyRole, Role> = {
  admin:   'SCHOOL_ADMIN',
  teacher: 'TEACHER',
  parent:  'PARENT',
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:  'Super Admin',
  SCHOOL_ADMIN: 'Administrator',
  TEACHER:      'Teacher',
  STUDENT:      'Student',
  PARENT:       'Parent',
};

export const LEGACY_ROLE_LABELS: Record<LegacyRole, string> = {
  admin:   'Administrator',
  teacher: 'Teacher',
  parent:  'Parent',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  schoolId?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}
