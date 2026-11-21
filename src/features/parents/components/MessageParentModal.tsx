'use client';

/**
 * MessageParentModal
 *
 * Form-Teacher pastoral communication modal.
 * Migrated from lumio-react/src/pages/ParentsPage.tsx.
 *
 * Authorized EXCLUSIVELY for Form Teachers communicating regarding students in their assigned cohort.
 */

import React, { useState } from 'react';
import { SendIcon, MailIcon, CheckCircle2Icon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageParentModalProps {
  open: boolean;
  parentName: string;
  studentName?: string;
  parentEmail?: string;
  onClose: () => void;
}

export function MessageParentModal({
  open,
  parentName,
  studentName,
  parentEmail,
  onClose,
}: MessageParentModalProps) {
  const [subject, setSubject] = useState(
    studentName ? `Regarding ${studentName}'s Academic Progress & Welfare` : ''
  );
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleClose() {
    setSent(false);
    setMessage('');
    onClose();
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    // Simulate sending client communication record
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    }, 600);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={parentName ? `Message ${parentName}` : 'Message Parent'}
      description={
        studentName
          ? `Direct pastoral communication regarding ${studentName}.`
          : 'Send a pastoral message to this parent.'
      }
      size="md"
      footer={
        sent ? null : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="message-parent-form"
              loading={sending}
              disabled={sending || !message.trim()}
              leftIcon={<SendIcon className="h-4 w-4" />}
            >
              Send message
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
            <CheckCircle2Icon className="h-6 w-6" />
          </div>
          <p className="font-display text-base font-bold text-slate-900">
            Message Sent Successfully
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Your message has been delivered to {parentName}
            {parentEmail ? ` (${parentEmail})` : ''}.
          </p>
        </div>
      ) : (
        <form
          id="message-parent-form"
          onSubmit={handleSend}
          className="space-y-4"
        >
          {parentEmail && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
              <MailIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Recipient: {parentEmail}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="message-subject"
              className="text-xs font-semibold text-slate-700"
            >
              Subject
            </label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Attendance notice or progress review"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="message-body"
              className="text-xs font-semibold text-slate-700"
            >
              Message Content
            </label>
            <textarea
              id="message-body"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your note to the parent…"
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
