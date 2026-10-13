import type { Metadata } from 'next';
import { MySubjectsView } from '@/features/subjects';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const metadata: Metadata = {
  title: 'My Subjects',
};

export default function MySubjectsPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <MySubjectsView />
    </RoleGuard>
  );
}
