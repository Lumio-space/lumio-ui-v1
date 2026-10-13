'use client';

/**
 * InviteParentModal
 *
 * Modal to invite a parent with email only.
 * Profile details are collected during the acceptance flow, not during invitation creation.
 */

import React, { useState } from 'react';
import {
  MailIcon,
  SendIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { useInviteParent } from '../hooks/useInviteParent';
import type { UserInvitationRecord } from '../types';

interface InviteParentModalProps {
  open: boolean;
  onClose: () => void;
  onInvitationCreated?: (invitation: UserInvitationRecord) => void;
}

export function InviteParentModal({
  open,
  onClose,
  onInvitationCreated,
}: InviteParentModalProps) {
  const inviteMutation = useInviteParent();

  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmail('');
      setFormError(null);
      setIsSuccess(false);
    }
  }

  function validate(): boolean {
    setFormError(null);
    if (!email.trim()) {
      setFormError('Parent email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address');
      return false;
    }
    return true;
  }

  async function handleSendInvite() {
    if (!validate()) return;

    setFormError(null);
    try {
      const response = await inviteMutation.mutateAsync({
        email: email.trim(),
      });

      const tokenOrId = response.token || response.id;
      const today = new Date();
      const expires = new Date(today.getTime() + 7 * 86400000);

      const newInvite: UserInvitationRecord = {
        id: response.id || `inv_${Date.now()}`,
        email: email.trim(),
        role: 'parent',
        status: 'Pending',
        sent: today.toISOString(),
        expires: expires.toISOString(),
        token: tokenOrId,
      };

      onInvitationCreated?.(newInvite);
      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send parent invitation';
      setFormError(message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isSuccess ? 'Invitation Sent!' : 'Invite a parent'}
      description={
        isSuccess
          ? 'The parent invitation email has been sent successfully.'
          : 'Send an invitation link to a parent. They will set up their account credentials upon accepting.'
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
        <div className="space-y-6 py-2 text-center sm:text-left">
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
                <span className="font-medium">{email}</span>. The link is valid
                for 7 days.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-gold-50 border border-gold-200/60 p-4 text-sm text-amber-900 space-y-1">
            <p className="font-semibold">Role assignment summary:</p>
            <p className="text-amber-800 text-xs leading-relaxed">
              The invited parent will complete their profile information and set up their
              Lumio account credentials during the acceptance flow.
            </p>
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
              htmlFor="parent-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MailIcon className="h-4 w-4" />
              </span>
              <input
                id="parent-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="parent@example.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              The invitation link expires after 7 days.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
