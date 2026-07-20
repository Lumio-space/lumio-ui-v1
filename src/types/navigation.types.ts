/**
 * Navigation Types
 *
 * Shared by config/navigation.ts and all sidebar/nav components.
 */

import type { LucideIcon } from 'lucide-react';
import type { LegacyRole } from './auth.types';

export interface NavItem {
 
  label: string;
  href: string;
  icon: LucideIcon;
  roles: LegacyRole[];
  permission?: string;
  badge?: number | string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
