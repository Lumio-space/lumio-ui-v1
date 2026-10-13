import type { Metadata } from 'next';
import { MyClassesView } from '@/features/classes';
import { RoleGuard } from '@/components/auth/RoleGuard';

export const metadata: Metadata = {
  title: 'My Classes',
};

export default function MyClassesPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <MyClassesView />
    </RoleGuard>
  );
}
