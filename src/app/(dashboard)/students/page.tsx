/**
 * Students Page — /students
 */

import type { Metadata } from 'next';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { StudentsView } from '@/features/invitations/components/StudentsView';

export const metadata: Metadata = { title: 'Students' };

export default function StudentsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <StudentsView />
    </RoleGuard>
  );
}
