import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InviteLoginView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Sign In to Accept — Accept Invitation',
};

export default function AcceptInviteLoginPage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <InviteLoginView />
    </Suspense>
  );
}
