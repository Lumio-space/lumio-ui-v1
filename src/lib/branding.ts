import { LEGACY_ROLE_LABELS, type LegacyRole } from '@/types/auth.types';

export const LUMIO_LOGO = '/lumio_logo_text_only.png';

/** @deprecated use LEGACY_ROLE_LABELS from @/types/auth.types */
export type Role = LegacyRole;
 

/** @deprecated use LEGACY_ROLE_LABELS from @/types/auth.types */
export const ROLE_LABELS = LEGACY_ROLE_LABELS
/** Alias kept for any code that imported the old ROLE_LABEL (singular) */
export const ROLE_LABEL = LEGACY_ROLE_LABELS;
