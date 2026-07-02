/**
 * Branding constants
 *
 * Single source of truth for logo paths and role display strings.
 * ROLE_LABELS is the canonical export; ROLE_LABEL kept for any
 * existing imports during the migration.
 */

export const LUMIO_LOGO = '/lumio_logo_text_only.png';

/** @deprecated use LEGACY_ROLE_LABELS from @/types/auth.types */
export type Role = 'admin' | 'teacher' | 'parent';

/** @deprecated use LEGACY_ROLE_LABELS from @/types/auth.types */
export const ROLE_LABELS: Record<Role, string> = {
  admin:   'Administrator',
  teacher: 'Teacher',
  parent:  'Parent',
};

/** Alias kept for any code that imported the old ROLE_LABEL (singular) */
export const ROLE_LABEL = ROLE_LABELS;
