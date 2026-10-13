/**
 * Subjects Page — /subjects
 *
 * Thin server component: sets page metadata and delegates all rendering
 * to SubjectsView (client component with TanStack Query + modals).
 */

import type { Metadata } from 'next';
import { SubjectsView } from '@/features/subjects';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const metadata: Metadata = {
  title: 'Subjects',
  description: 'Manage school subjects, class allocations, and teacher assignments',
};

export default function SubjectsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <SubjectsView />
    </RoleGuard>
  );
}
