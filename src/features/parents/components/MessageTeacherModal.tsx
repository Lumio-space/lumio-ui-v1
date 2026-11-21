'use client';

/**
 * MessageTeacherModal
 *
 * Parent-to-Form-Teacher pastoral communication modal.
 * Migrated from lumio-react/src/components/dashboard/ParentDashboard.tsx.
 *
 * Enables parents to send direct messages/inquiries to their ward's Form Teacher.
 */

import React, { useState } from 'react';
import { SendIcon, MailIcon, CheckCircle2Icon, GraduationCapIcon } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface MessageTeacherModalProps {
  open: boolean;
  teacherName: string;
  studentName: string;
  className?: string;
  teacherEmail?: string;
  onClose: () => void;
}

export function MessageTeacherModal({
  open,
  teacherName,
  studentName,
  className,
  teacherEmail,
  onClose,
}: MessageTeacherModalProps) {
  const [subject, setSubject] = useState(
    studentName ? `Inquiry regarding ${studentName}` : ''
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
    // Simulate sending parent inquiry to form teacher
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
      title={teacherName ? `Message ${teacherName}` : 'Message Form Teacher'}
      description={
        studentName
          ? `Direct pastoral communication regarding ${studentName}${className ? ` (${className})` : ''}.`
          : 'Send a message to your child’s teacher.'
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
              form="message-teacher-form"
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
            Your note has been delivered to {teacherName}
            {teacherEmail ? ` (${teacherEmail})` : ''}.
          </p>
        </div>
      ) : (
        <form
          id="message-teacher-form"
          onSubmit={handleSend}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
            <GraduationCapIcon className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-700">Recipient:</span>
            <span>{teacherName}</span>
            {className && (
              <span className="text-slate-400">· {className} Form Teacher</span>
            )}
            {teacherEmail && (
              <span className="flex items-center gap-1 text-slate-400">
                <MailIcon className="h-3 w-3" />
                {teacherEmail}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="teacher-message-subject"
              className="text-xs font-semibold text-slate-700"
            >
              Subject
            </label>
            <Input
              id="teacher-message-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Inquiry regarding homework or attendance"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="teacher-message-body"
              className="text-xs font-semibold text-slate-700"
            >
              Message Content
            </label>
            <textarea
              id="teacher-message-body"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your note to the form teacher…"
              required
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </form>
      )}
    </Modal>
  );
}
