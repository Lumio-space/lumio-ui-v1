/**
 * Navigation Configuration
 *
 * Single source of truth for sidebar nav and bottom nav.
 * Migrated from lib/nav.ts — route paths updated for App Router
 * (no /app prefix; Next.js handles routing via folder structure).
 *
 * Permission keys are scaffolded for Phase 5 RBAC integration.
 */

import {
  LayoutDashboardIcon,
  GraduationCapIcon,
  UsersIcon,
  BookOpenIcon,
  LibraryBigIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  CalendarDaysIcon,
  HeartHandshakeIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import type { NavItem } from '@/types/navigation.types';

export const NAV_ITEMS: NavItem[] = [
  {
    label:      'Dashboard',
    href:       '/dashboard',
    icon:       LayoutDashboardIcon,
    roles:      ['admin', 'teacher', 'parent', 'student'],
    permission: 'VIEW_DASHBOARD',
  },
  {
    label:      'Students',
    href:       '/students',
    icon:       GraduationCapIcon,
    roles:      ['admin'],
    permission: 'VIEW_STUDENTS',
  },
  {
    label:      'Teachers',
    href:       '/teachers',
    icon:       UsersIcon,
    roles:      ['admin'],
    permission: 'VIEW_TEACHERS',
  },
  {
    label:      'Classes',
    href:       '/classes',
    icon:       BookOpenIcon,
    roles:      ['admin'],
    permission: 'VIEW_CLASSES',
  },
  {
    label:      'Subjects',
    href:       '/subjects',
    icon:       LibraryBigIcon,
    roles:      ['admin'],
    permission: 'VIEW_SUBJECTS',
  },
  {
    label:      'My Classes',
    href:       '/my-classes',
    icon:       BookOpenIcon,
    roles:      ['teacher'],
    permission: 'VIEW_MY_CLASSES',
  },
  {
    label:      'My Subjects',
    href:       '/my-subjects',
    icon:       LibraryBigIcon,
    roles:      ['teacher'],
    permission: 'VIEW_MY_SUBJECTS',
  },
  {
    label:      'Attendance',
    href:       '/attendance',
    icon:       CalendarCheckIcon,
    roles:      ['admin', 'teacher', 'parent', 'student'],
    permission: 'VIEW_ATTENDANCE',
  },
  {
    label:      'Results',
    href:       '/results',
    icon:       ClipboardListIcon,
    roles:      ['admin', 'teacher', 'parent', 'student'],
    permission: 'VIEW_RESULTS',
  },
  {
    label:      'Timetable',
    href:       '/timetable',
    icon:       CalendarDaysIcon,
    roles:      ['teacher', 'parent', 'student'],
    permission: 'VIEW_TIMETABLE',
  },
  {
    label:      'Parents',
    href:       '/parents',
    icon:       HeartHandshakeIcon,
    roles:      ['admin', 'teacher'],
    permission: 'VIEW_PARENTS',
  },
  {
    label:      'Roles',
    href:       '/roles',
    icon:       ShieldCheckIcon,
    roles:      ['admin'],
    permission: 'MANAGE_ROLES',
  },
  {
    label:      'Announcements',
    href:       '/announcements',
    icon:       MegaphoneIcon,
    roles:      ['admin', 'teacher', 'parent', 'student'],
    permission: 'VIEW_ANNOUNCEMENTS',
  },
  {
    label:      'Settings',
    href:       '/settings',
    icon:       SettingsIcon,
    roles:      ['admin', 'teacher', 'parent', 'student'],
    permission: 'VIEW_SETTINGS',
  },
];

/** Items shown in mobile bottom nav (subset of NAV_ITEMS) */
export const BOTTOM_NAV_LABELS = [
  'Dashboard',
  'Students',
  'Attendance',
  'Results',
  'Announcements',
] as const;

export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((i) =>
  BOTTOM_NAV_LABELS.includes(i.label as (typeof BOTTOM_NAV_LABELS)[number])
);
