export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';
export type LegacyRole = UserRole;

export function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const r = role.toLowerCase().replace(/[-_]/g, '');
  if (r === 'superadmin' || r === 'schooladmin' || r === 'admin') return 'admin';
  if (r === 'teacher') return 'teacher';
  if (r === 'parent') return 'parent';
  if (r === 'student') return 'student';
  return null;
}

export const LEGACY_ROLE_MAP: Record<UserRole, Role> = {
  admin:   'SCHOOL_ADMIN',
  teacher: 'TEACHER',
  parent:  'PARENT',
  student: 'STUDENT',
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:  'Super Admin',
  SCHOOL_ADMIN: 'Administrator',
  TEACHER:      'Teacher',
  STUDENT:      'Student',
  PARENT:       'Parent',
};

export const CANONICAL_ROLE_LABELS: Record<UserRole, string> = {
  admin:   'Administrator',
  teacher: 'Teacher',
  parent:  'Parent',
  student: 'Student',
};

export const LEGACY_ROLE_LABELS: Record<LegacyRole, string> = CANONICAL_ROLE_LABELS;

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
