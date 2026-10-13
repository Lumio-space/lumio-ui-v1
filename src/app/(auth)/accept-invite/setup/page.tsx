import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InviteSetupView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Set Up Account — Accept Invitation',
};

export default function AcceptInviteSetupPage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <InviteSetupView />
    </Suspense>
  );
}
