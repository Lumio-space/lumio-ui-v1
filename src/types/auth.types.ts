/**
 * Auth Types
 *
 * Canonical role definitions for Lumio.
 * LegacyRole bridges the original project's 3-role system.
 * Phase 2 will wire these to next-auth sessions.
 */

/** Full enterprise role set */
export type Role =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

/** Legacy 3-role system kept for backward compat during migration */
export type LegacyRole = 'admin' | 'teacher' | 'parent';

/** Maps legacy roles to enterprise roles */
export const LEGACY_ROLE_MAP: Record<LegacyRole, Role> = {
  admin:   'SCHOOL_ADMIN',
  teacher: 'TEACHER',
  parent:  'PARENT',
};

/** Human-readable labels for display */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:  'Super Admin',
  SCHOOL_ADMIN: 'Administrator',
  TEACHER:      'Teacher',
  STUDENT:      'Student',
  PARENT:       'Parent',
};

/** Labels for the legacy 3-role switcher (preserved for Phase 1 UI) */
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
