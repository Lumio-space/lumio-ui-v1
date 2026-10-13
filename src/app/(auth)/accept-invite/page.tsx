import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Accept Invitation',
};

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <AcceptInviteView />
    </Suspense>
  );
}
