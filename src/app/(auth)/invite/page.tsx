import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteView, AcceptInviteSkeleton } from '@/features/teachers';

export const metadata: Metadata = {
  title: 'Teacher Invitation',
};

export default function InvitePage() {
  return (
    <Suspense fallback={<AcceptInviteSkeleton />}>
      <AcceptInviteView />
    </Suspense>
  );
}
