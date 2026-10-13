import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TeachersView } from '@/features/teachers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import TeachersLoading from './loading';

export const metadata: Metadata = {
  title: 'Teachers',
};

export default function TeachersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <Suspense fallback={<TeachersLoading />}>
        <TeachersView />
      </Suspense>
    </RoleGuard>
  );
}
