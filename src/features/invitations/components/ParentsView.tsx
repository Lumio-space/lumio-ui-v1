'use client';

import React, { useState } from 'react';
import { PlusIcon, UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { InviteParentModal } from './InviteParentModal';

export function ParentsView() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        description="Parent directory and invitations"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setInviteOpen(true)}
          >
            Invite parent
          </Button>
        }
      />

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <UsersIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="font-semibold text-slate-700">Parent Directory</p>
        <p className="mt-1 text-xs text-slate-400">
          Use the &ldquo;Invite parent&rdquo; button above to invite parents to connect with their children on Lumio.
        </p>
      </div>

      <InviteParentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
