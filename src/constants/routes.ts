/**
 * Route constants — App Router paths
 *
 * Updated from original scaffold:
 *   - /auth/login → /login  (route group (auth) doesn't add prefix)
 *   - /dashboard/students → /students  (flat under (dashboard) group)
 *
 * Import these everywhere instead of hardcoding strings so a route
 * rename is a one-line change.
 */

export const ROUTES = {
  // Public / auth
  ROOT:        '/',
  LOGIN:       '/login',
  ONBOARDING:  '/onboarding',

  // Dashboard
  DASHBOARD:    '/dashboard',
  STUDENTS:     '/students',
  TEACHERS:     '/teachers',
  CLASSES:      '/classes',
  ATTENDANCE:   '/attendance',
  RESULTS:      '/results',
  TIMETABLE:    '/timetable',
  PARENTS:      '/parents',
  ROLES:        '/roles',
  ANNOUNCEMENTS: '/announcements',
  SETTINGS:     '/settings',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
