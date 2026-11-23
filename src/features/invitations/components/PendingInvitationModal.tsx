'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  SchoolIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  SparklesIcon,
} from 'lucide-react';

import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { ROLE_META, type InviteRole } from '@/components/invite/inviteTypes';
import {
  useAcceptExistingTeacher,
  useDeclineInvitation,
} from '@/features/teachers/hooks/useAcceptInvitation';
import type { PendingInvitation } from '@/features/auth/types';

export interface PendingInvitationModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  invitation: PendingInvitation;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

export function PendingInvitationModal({
  open,
  onOpenChange,
  invitation,
  onAccepted,
  onDeclined,
}: PendingInvitationModalProps) {
  const router = useRouter();
  const [declined, setDeclined] = useState(false);
  const [declineConfirm, setDeclineConfirm] = useState(false);

  const {
    mutate: acceptExisting,
    isPending: isAccepting,
    error: acceptError,
  } = useAcceptExistingTeacher();

  const {
    mutate: declineInvite,
    isPending: isDeclining,
    error: declineError,
  } = useDeclineInvitation();

  const inviteRole = (invitation.role?.toLowerCase() as InviteRole) || 'teacher';
  const roleMeta = ROLE_META[inviteRole as keyof typeof ROLE_META] || ROLE_META.teacher;

  function handleAccept() {
    acceptExisting(
      {
        invitationId: invitation.id,
        token: invitation.token,
      },
      {
        onSuccess: () => {
          onAccepted?.();
          router.push('/dashboard');
        },
      }
    );
  }

  function handleDecline() {
    declineInvite(
      {
        invitationId: invitation.id,
        token: invitation.token,
      },
      {
        onSuccess: () => {
          setDeclined(true);
          onDeclined?.();
        },
      }
    );
  }

  if (declined) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} size="md">
        <div className="py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <XCircleIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-slate-900">
            Invitation Declined
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            You declined the invitation to join{' '}
            <strong className="text-slate-700">{invitation.schoolName}</strong>.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
    >
      <div className="space-y-5">
        {/* Header graphic */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-200">
            <SchoolIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900">
                School Invitation
              </h2>
              <Badge tone={roleMeta.tone} dot>
                {roleMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              You have been invited to join this school workspace.
            </p>
          </div>
        </div>

        {/* Invitation details card */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">School</span>
            <span className="font-semibold text-slate-900">
              {invitation.schoolName}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2.5">
            <span className="text-slate-500">Role</span>
            <Badge tone={roleMeta.tone}>
              {roleMeta.label}
            </Badge>
          </div>

          {invitation.assignmentType && invitation.assignmentType !== 'none' && (
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2.5">
              <span className="text-slate-500">Assignment</span>
              <span className="font-medium text-slate-700 capitalize">
                {invitation.assignmentType.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Information text */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs leading-relaxed text-indigo-900 flex items-start gap-2.5">
          <SparklesIcon className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
          <span>
            Accepting will activate your {roleMeta.label.toLowerCase()} membership at{' '}
            <strong>{invitation.schoolName}</strong> and take you to your dashboard.
          </span>
        </div>

        {/* Error message */}
        {(acceptError || declineError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-red-500" />
            <span>
              {acceptError instanceof Error
                ? acceptError.message
                : declineError instanceof Error
                ? declineError.message
                : 'Failed to process invitation.'}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-2">
          {declineConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-center font-medium text-slate-700">
                Are you sure you want to decline this invitation?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-1/2"
                  disabled={isDeclining}
                  onClick={() => setDeclineConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="w-1/2"
                  loading={isDeclining}
                  onClick={handleDecline}
                >
                  Confirm Decline
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                disabled={isAccepting || isDeclining}
                onClick={() => setDeclineConfirm(true)}
                className="text-slate-500 hover:text-slate-700"
              >
                Decline
              </Button>
              <Button
                type="button"
                loading={isAccepting}
                disabled={isAccepting || isDeclining}
                onClick={handleAccept}
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                Accept Invitation
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
