/**
 * Parents Page — /parents
 */

import type { Metadata } from 'next';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ParentsView } from '@/features/invitations/components/ParentsView';

export const metadata: Metadata = { title: 'Parents' };

export default function ParentsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'teacher']}>
      <ParentsView />
    </RoleGuard>
  );
}
