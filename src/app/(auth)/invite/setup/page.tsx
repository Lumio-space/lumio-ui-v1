import type { Metadata } from 'next';
import { Suspense } from 'react';
import { InviteSetupView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Set Up Account — Teacher Invitation',
};

export default function InviteSetupPage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <InviteSetupView />
    </Suspense>
  );
}
