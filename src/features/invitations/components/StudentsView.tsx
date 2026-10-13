'use client';

import React, { useState } from 'react';
import { PlusIcon, GraduationCapIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { InviteStudentModal } from './InviteStudentModal';

export function StudentsView() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student directory and invitations"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setInviteOpen(true)}
          >
            Invite student
          </Button>
        }
      />

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <GraduationCapIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="font-semibold text-slate-700">Student Directory</p>
        <p className="mt-1 text-xs text-slate-400">
          Use the &ldquo;Invite student&rdquo; button above to send account invitations to students.
        </p>
      </div>

      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
