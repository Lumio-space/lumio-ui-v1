/**
 * Dashboard Group Layout — (dashboard)
 *
 * Server Component: handles metadata + wraps children in DashboardShell.
 * DashboardShell is a Client Component that owns sidebar open/close state.
 *
 * Route group (dashboard) does NOT add "dashboard" to URLs, so:
 *   (dashboard)/dashboard/page.tsx → /dashboard
 *   (dashboard)/students/page.tsx  → /students
 */

import type { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/DashboardShell';

export const metadata: Metadata = {
  title: { template: '%s | Lumio', default: 'Lumio' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
