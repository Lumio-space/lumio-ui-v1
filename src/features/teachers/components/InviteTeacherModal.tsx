'use client';

/**
 * InviteTeacherModal
 *
 * 2-step teacher invitation wizard:
 *   Step 1: Select class (class-first, form teacher assignment)
 *   Step 2: Teacher details (full name & email address)
 *   Success: Confirmation that invitation email was sent
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SchoolIcon,
  MailIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SendIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { formTeacherForClass } from '../constants';
import { useInviteTeacher } from '../hooks';
import type { TeacherInvitation } from '../types';

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  preselectedClassId?: string;
  initialStep?: number;
  invitations: TeacherInvitation[];
  onInvitationCreated: (invitation: TeacherInvitation) => void;
}

export function InviteTeacherModal({
  open,
  onClose,
  preselectedClassId,
  initialStep = 1,
  invitations,
  onInvitationCreated,
}: InviteTeacherModalProps) {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const inviteMutation = useInviteTeacher();

  const [step, setStep] = useState(initialStep);
  const [classId, setClassId] = useState(preselectedClassId ?? '');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Success state for invitation sent
  const [isSuccess, setIsSuccess] = useState(false);

  // Adjust state when open changes (React recommended pattern for prop changes)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setClassId(preselectedClassId ?? '');
      setStep(preselectedClassId ? 2 : initialStep);
      setEmail('');
      setFormError(null);
      setIsSuccess(false);
    }
  }

  const selectedClass = classes.find((c) => c.id === classId);

  const formatClassName = (c: ClassRecord) => {
    const gradeLabel = GRADE_LEVEL_LABELS[c.grade] ?? c.grade;
    const dept = c.department && c.department !== 'Nill' ? c.department : undefined;
    return composeClassName(gradeLabel, dept, c.section);
  };

  const selectedClassName = selectedClass ? formatClassName(selectedClass) : '';

  function validateStep2(): boolean {
    setFormError(null);
    if (!email.trim()) {
      setFormError('Teacher email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address');
      return false;
    }
    return true;
  }

  function handleContinue() {
    if (step === 1) {
      if (!classId) {
        setFormError('Please select a class to proceed');
        return;
      }
      setFormError(null);
      setStep(2);
    }
  }

  async function handleSendInvite() {
    if (!selectedClass) {
      setFormError('Please select a class to proceed');
      return;
    }
    if (!validateStep2()) return;

    setFormError(null);
    try {
      const response = await inviteMutation.mutateAsync({
        email: email.trim(),
        classId: selectedClass.id,
      });

      const tokenOrId = response.token || response.id;
      const today = new Date();
      const expires = new Date(today.getTime() + 7 * 86400000);

      const newInvite: TeacherInvitation = {
        id: response.id || `inv_${Date.now()}`,
        name: email.trim(),
        email: email.trim(),
        classId: selectedClass.id,
        className: selectedClassName,
        status: 'Pending',
        sent: today.toISOString(),
        expires: expires.toISOString(),
        token: tokenOrId,
      };

      onInvitationCreated(newInvite);
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send teacher invitation';
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
          : 'Teachers are invited to lead an existing class as its Form Teacher.'
      }
      size="lg"
      footer={
        isSuccess ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            {step === 2 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setFormError(null);
                  setStep(1);
                }}
                leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                disabled={inviteMutation.isPending}
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
            )}

            {step === 1 ? (
              <Button
                onClick={handleContinue}
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSendInvite}
                loading={inviteMutation.isPending}
                leftIcon={<SendIcon className="h-4 w-4" />}
              >
                Send invitation
              </Button>
            )}
          </>
        )
      }
    >
      {isSuccess ? (
        /* ------------------------- Success View with Copy Link ------------------------- */
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

          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900 space-y-1">
            <p className="font-semibold">Role assignment summary:</p>
            <p className="text-indigo-700">
              The invited teacher will be assigned as Form Teacher of{' '}
              <span className="font-bold">{selectedClassName}</span> upon
              accepting.
            </p>
          </div>
        </div>
      ) : (
        /* ------------------------- 2-Step Wizard View ------------------------- */
        <div className="space-y-6">
          {/* Stepper Header */}
          <ol className="flex items-center gap-2">
            {[
              { n: 1, label: 'Select class' },
              { n: 2, label: 'Teacher details' },
            ].map((s, i) => (
              <li key={s.n} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                    step > s.n
                      ? 'bg-emerald-500 text-white'
                      : step === s.n
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {step > s.n ? (
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={cn(
                    'hidden text-xs font-semibold sm:block',
                    step >= s.n ? 'text-slate-800' : 'text-slate-400'
                  )}
                >
                  {s.label}
                </span>
                {i < 1 && <span className="h-px flex-1 bg-slate-200" />}
              </li>
            ))}
          </ol>

          {/* Form Error Banner */}
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700"
            >
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* ----------------- Step 1: Select class ----------------- */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Choose the class this teacher will lead.
                </p>
                <Link
                  href="/classes"
                  onClick={onClose}
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  Create a class
                </Link>
              </div>

              {classesLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-16 animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              ) : classes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <SchoolIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No classes found
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    You must create at least one class before inviting a form teacher.
                  </p>
                  <Link href="/classes" onClick={onClose} className="mt-4 inline-block">
                    <Button size="sm" variant="outline">
                      Go to Classes
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {classes.map((c) => {
                    const existing = formTeacherForClass(invitations, c.id);
                    const taken =
                      Boolean(c.formTeacher) || existing?.status === 'Accepted';
                    const isPending = !taken && existing?.status === 'Pending';
                    const isSelected = classId === c.id;
                    const displayName = formatClassName(c);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (!taken) {
                            setClassId(c.id);
                            setFormError(null);
                          }
                        }}
                        disabled={taken}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                          taken
                            ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-70'
                            : isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                          <SchoolIcon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-semibold text-slate-900">
                            <span>{displayName}</span>
                            {c.department && c.department !== 'Nill' && (
                              <Badge
                                tone={
                                  DEPARTMENT_TONES[
                                    c.department as keyof typeof DEPARTMENT_TONES
                                  ] || 'purple'
                                }
                              >
                                {c.department}
                              </Badge>
                            )}
                          </span>
                          <span className="block text-xs text-slate-500">
                            Room {c.room} · {c.students ?? 0} students
                          </span>
                        </span>
                        {taken ? (
                          <Badge tone="green" dot>
                            Form Teacher assigned
                          </Badge>
                        ) : isPending ? (
                          <Badge tone="gold" dot>
                            Invitation pending
                          </Badge>
                        ) : (
                          <Badge tone="slate">Unassigned</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ----------------- Step 2: Teacher details ----------------- */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedClass && (
                <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
                  <SchoolIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate flex items-center gap-2">
                    <span>
                      Inviting a Form Teacher for{' '}
                      <span className="font-bold">{selectedClassName}</span>
                    </span>
                    {selectedClass.department &&
                      selectedClass.department !== 'Nill' && (
                        <Badge
                          tone={
                            DEPARTMENT_TONES[
                              selectedClass.department as keyof typeof DEPARTMENT_TONES
                            ] || 'purple'
                          }
                        >
                          {selectedClass.department}
                        </Badge>
                      )}
                  </span>
                </div>
              )}

              <div>
                <label
                  htmlFor="teacher-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
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
                    placeholder="john.okafor@lumio.edu"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  The invitation link expires after 7 days.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
