/**
 * Navigation Types
 *
 * Shared by config/navigation.ts and all sidebar/nav components.
 */

import type { LucideIcon } from 'lucide-react';
import type { LegacyRole } from './auth.types';

export interface NavItem {
  /** Display label */
  label: string;
  /** Next.js href (no /app prefix — App Router paths) */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Which roles can see this item */
  roles: LegacyRole[];
  /** Permission key for future RBAC checks */
  permission?: string;
  /** Optional badge count / status */
  badge?: number | string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
