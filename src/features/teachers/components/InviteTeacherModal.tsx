'use client';

/**
 * InviteTeacherModal
 *
 * Clean, email-only invitation modal.
 * The backend only accepts email for teacher invites (role=teacher membership).
 * Class and subject assignments are managed separately after the teacher joins.
 */

import React, { useState } from 'react';
import {
  MailIcon,
  SendIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useInviteTeacher } from '../hooks';
import type { TeacherInvitation } from '../types';

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  invitations?: TeacherInvitation[];
  onInvitationCreated?: (invitation: TeacherInvitation) => void;
}

export function InviteTeacherModal({
  open,
  onClose,
  onInvitationCreated,
}: InviteTeacherModalProps) {
  const inviteMutation = useInviteTeacher();

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail('');
      setFormError(null);
      setIsSuccess(false);
    }
  }

  const trimmedEmail = email.trim();
  const canSend = Boolean(trimmedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail));

  async function handleSendInvite() {
    setFormError(null);
    if (!trimmedEmail) {
      setFormError('Email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      const response = await inviteMutation.mutateAsync({
        email: trimmedEmail,
        assignmentType: 'none',
      });

      const tokenOrId = response.token || response.id;
      const today = new Date();
      const expires = new Date(today.getTime() + 7 * 86400000);

      const newInvite: TeacherInvitation = {
        id: response.id || `inv_${Date.now()}`,
        name: trimmedEmail,
        email: trimmedEmail,
        role: 'teacher',
        status: 'Pending',
        sent: today.toISOString(),
        expires: expires.toISOString(),
        token: tokenOrId,
      };

      onInvitationCreated?.(newInvite);
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err instanceof Error ? err.message : 'Failed to send teacher invitation');
      setFormError(message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSuccess ? 'Invitation Sent!' : 'Invite a teacher'}
      description={
        isSuccess
          ? 'The teacher invitation email has been sent successfully.'
          : 'Enter the teacher’s email address to invite them to join the school on Lumio.'
      }
      size="md"
      footer={
        isSuccess ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={!canSend || inviteMutation.isPending}
              loading={inviteMutation.isPending}
              leftIcon={<SendIcon className="h-4 w-4" />}
            >
              Send invitation
            </Button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div className="space-y-4 py-2">
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-soft">
              <CheckCircle2Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 text-base">
                Invitation sent!
              </p>
              <p className="mt-0.5 text-sm text-emerald-700">
                An invitation email was sent to{' '}
                <span className="font-semibold">{trimmedEmail}</span>. The link is valid
                for 7 days.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 border border-slate-100">
            Once the teacher accepts and activates their account, you can assign them as a Form Teacher or assign them to class subjects.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="teacher-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MailIcon className="h-4 w-4" />
              </span>
              <input
                id="teacher-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="teacher@example.com"
                autoFocus
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              The teacher will receive an invitation link to set up their account. Valid for 7 days.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>
              Class and subject assignments happen after the teacher accepts and joins the school.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
