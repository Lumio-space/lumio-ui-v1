import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InviteLoginView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Sign In to Accept — Teacher Invitation',
};

export default function InviteLoginPage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <InviteLoginView />
    </Suspense>
  );
}
