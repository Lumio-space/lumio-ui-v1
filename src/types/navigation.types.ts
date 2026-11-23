/**
 * Navigation Types
 *
 * Shared by config/navigation.ts and all sidebar/nav components.
 */

import type * as React from 'react';
import type { UserRole } from './auth.types';

export type LucideIcon = React.ComponentType<{ className?: string; size?: number | string; [key: string]: any }>;

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  permission?: string;
  badge?: number | string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}
