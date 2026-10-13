'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  LockKeyholeIcon,
  ChevronDownIcon,
  RefreshCwIcon,
  UserCheckIcon,
} from 'lucide-react';

import { InviteLayout } from '@/components/invite/InviteLayout';
import { InviteInput, InviteSelect } from '@/components/invite/InviteInput';
import { PasswordChecklist } from './PasswordChecklist';
import { InviteSuccess } from '@/components/invite/InviteSuccess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Progress } from '@/components/shared/Progress';
import { ROLE_META, type InvitePayload, type InviteRole } from '@/components/invite/inviteTypes';
import {
  passwordScore,
  passwordRules,
} from '../schemas/accept-invitation.schema';
import { useValidateInvitation, useAcceptNewTeacher } from '../hooks/useAcceptInvitation';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { AcceptInviteSkeleton } from './AcceptInviteSkeleton';
import { cn } from '@/lib/utils';

export interface SetupValues {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type SetupErrors = Partial<Record<keyof SetupValues, string>>;

const GENDERS = ['Prefer not to say', 'Female', 'Male', 'Other'];
const LANGUAGES = ['English', 'Yoruba', 'Igbo', 'Hausa', 'French'];
const PHONE_PLACEHOLDER = '+234 802 123 4567';

function validateSetup(values: SetupValues): SetupErrors {
  const errors: SetupErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (values.firstName.trim().length < 2) {
    errors.firstName = 'Enter a valid first name';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (values.lastName.trim().length < 2) {
    errors.lastName = 'Enter a valid last name';
  }

  if (values.phone.trim() && values.phone.replace(/[^0-9]/g, '').length < 10) {
    errors.phone = 'Enter a valid phone number (at least 10 digits)';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (passwordScore(values.password) < passwordRules.length) {
    errors.password = 'Password does not meet all requirements';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

interface InviteSetupViewProps {
  token?: string;
  onBack?: () => void;
}

export function InviteSetupView({ token: propToken, onBack }: InviteSetupViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = propToken ?? searchParams.get('token') ?? '';

  const basePath = pathname.startsWith('/accept-invite') ? '/accept-invite' : '/invite';

  const {
    data: inviteData,
    isLoading,
    isError,
  } = useValidateInvitation(token);

  const {
    mutate: acceptNew,
    isPending: isSubmitting,
    isSuccess,
    error: submitError,
    reset: resetMutation,
  } = useAcceptNewTeacher();

  const { data: rawClasses } = useClasses();
  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    if (rawClasses && typeof rawClasses === 'object') {
      const anyData = rawClasses as { data?: unknown; classes?: unknown; items?: unknown };
      if (Array.isArray(anyData.data)) return anyData.data as ClassRecord[];
      if (Array.isArray(anyData.classes)) return anyData.classes as ClassRecord[];
      if (Array.isArray(anyData.items)) return anyData.items as ClassRecord[];
    }
    return [];
  }, [rawClasses]);

  const targetClassId = inviteData?.classId;
  const targetClass =
    (targetClassId ? classes.find((c) => c.id === targetClassId) : undefined) ||
    inviteData?.class;
  const classDepartment =
    targetClass?.department && targetClass.department !== 'Nill'
      ? targetClass.department
      : undefined;
  const assignedClassName = targetClass
    ? composeClassName(
        GRADE_LEVEL_LABELS[targetClass.grade] ?? targetClass.grade,
        classDepartment,
        targetClass.section
      )
    : undefined;

  const [showErrors, setShowErrors] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<SetupValues>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [optional, setOptional] = useState({
    age: '',
    gender: GENDERS[0],
    city: '',
    language: LANGUAGES[0],
    note: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function deriveInitials(name?: string): string | undefined {
    if (!name?.trim()) return undefined;
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  const schoolName = inviteData?.schoolName || '';
  const inviteRole: InviteRole = (inviteData?.role?.toLowerCase() as InviteRole) || 'teacher';
  const role = ROLE_META[inviteRole as keyof typeof ROLE_META] || ROLE_META.teacher;

  const invite: InvitePayload = {
    token,
    role: inviteRole,
    state: isError ? 'invalid' : 'valid',
    existingAccount: Boolean(inviteData?.isExistingUser),
    invitee: {
      firstName: values.firstName || inviteData?.inviteeName || '',
      lastName: values.lastName || '',
      email: inviteData?.email || '',
    },
    school: {
      name: schoolName,
      initials: inviteData?.schoolInitials || deriveInitials(schoolName),
      location: inviteData?.schoolLocation || undefined,
      logo: inviteData?.schoolLogo,
    },
    inviter: inviteData?.inviterName
      ? {
          name: inviteData.inviterName,
          title: inviteData?.inviterRole || undefined,
        }
      : undefined,
    message: inviteData?.message,
    sentOn: '',
    expiresOn: inviteData?.expiresAt || '',
  };
  const errors = useMemo(() => validateSetup(values), [values]);
  const errorCount = Object.keys(errors).length;
  const hasErrors = errorCount > 0;

  function setField<K extends keyof SetupValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (submitError) resetMutation();
  }

  function blurField(key: string) {
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function errorFor(key: keyof SetupValues) {
    return showErrors || touched[key] ? errors[key] : undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setShowErrors(true);

    if (hasErrors) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    acceptNew({
      token,
      firstName: values.firstName,
      lastName: values.lastName,
      fullName: `${values.firstName} ${values.lastName}`.trim(),
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      password: values.password,
    });
  }

  /* ------------------------- Loading ------------------------- */
  if (isLoading) {
    return <AcceptInviteSkeleton />;
  }

  /* ----------------- Invalid / Expired guard ----------------- */
  if (isError || !inviteData || inviteData.status === 'expired') {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 text-gold-500">
            <AlertTriangleIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">
            We can&rsquo;t set up this account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            This invitation is no longer valid, so the setup form can&rsquo;t be
            opened. Ask {invite.school.name} to send a fresh invitation.
          </p>
          <div className="mt-7 space-y-3">
            <Link href={`${basePath}?token=${encodeURIComponent(token)}`} className="block">
              <Button size="xl" className="w-full">
                Review invitation
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="ghost" size="xl" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </InviteLayout>
    );
  }

  /* ----------------- Existing Account Guard ----------------- */
  if (invite.existingAccount) {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserCheckIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">
            You already have a Lumio account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            There&rsquo;s no need to create another account for{' '}
            {invite.invitee.email}. Sign in and we&rsquo;ll add{' '}
            {invite.school.name} to it.
          </p>
          <Link
            href={`${basePath}/login?token=${encodeURIComponent(token)}`}
            className="mt-7 block"
          >
            <Button
              size="xl"
              className="w-full"
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Sign in to accept
            </Button>
          </Link>
        </div>
      </InviteLayout>
    );
  }

  /* ------------------------- Success ------------------------- */
  if (isSuccess) {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <InviteSuccess
          invite={invite}
          firstName={values.firstName || role.label}
          variant="created"
        />
      </InviteLayout>
    );
  }

  /* -------------------------- Form -------------------------- */
  return (
    <InviteLayout invite={invite}>
      <div>
        {/* Back + role badge */}
        <div className="mb-5 flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Invitation
            </button>
          ) : (
            <Link
              href={`${basePath}?token=${encodeURIComponent(token)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Invitation
            </Link>
          )}
          <Badge tone={role.tone} dot>
            {role.label}
          </Badge>
        </div>

        <h1 className="font-display text-2xl font-extrabold text-slate-900">
          Set up your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Step 2 of 2 — create your credentials to join {invite.school.name}.
        </p>

        {assignedClassName && inviteRole === 'teacher' && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-3.5 py-2 text-xs text-indigo-900 border border-indigo-100">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>
                Assigned as <strong>Form Teacher</strong> for <strong>{assignedClassName}</strong>
              </span>
              {classDepartment && (
                <Badge
                  tone={
                    DEPARTMENT_TONES[classDepartment as keyof typeof DEPARTMENT_TONES] ||
                    'purple'
                  }
                  className="text-[10px] px-1.5 py-0.5"
                >
                  {classDepartment}
                </Badge>
              )}
            </span>
          </div>
        )}

        {assignedClassName && inviteRole === 'student' && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-3.5 py-2 text-xs text-indigo-900 border border-indigo-100">
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>
                Class placement: <strong>{assignedClassName}</strong>
              </span>
              {classDepartment && (
                <Badge
                  tone={
                    DEPARTMENT_TONES[classDepartment as keyof typeof DEPARTMENT_TONES] ||
                    'purple'
                  }
                  className="text-[10px] px-1.5 py-0.5"
                >
                  {classDepartment}
                </Badge>
              )}
            </span>
          </div>
        )}

        <Progress
          value={100}
          tone="purple"
          size="sm"
          className="mt-4"
          label="Setup progress"
        />

        {/* Submitting notice */}
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
            className="mt-5 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4"
          >
            <svg
              className="h-4 w-4 shrink-0 animate-spin text-purple-600"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-purple-900">
                Creating your account…
              </p>
              <p className="text-sm text-purple-700">
                Setting up your profile at {invite.school.name}. Please don&rsquo;t
                close this page.
              </p>
            </div>
          </motion.div>
        )}

        {/* Server submit error */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                We couldn&rsquo;t create your account
              </p>
              <p className="mt-0.5 text-sm text-red-600">
                {submitError instanceof Error
                  ? submitError.message
                  : 'Something went wrong on our end. Your details were not saved — please try again.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                leftIcon={<RefreshCwIcon className="h-4 w-4" />}
                onClick={() => resetMutation()}
              >
                Try again
              </Button>
            </div>
          </motion.div>
        )}

        {/* Validation summary banner */}
        {showErrors && hasErrors && !isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              Please fix {errorCount} field{errorCount === 1 ? '' : 's'} below to
              continue.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
          {/* Required account info */}
          <fieldset disabled={isSubmitting} className="space-y-4">
            <legend className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <LockKeyholeIcon className="h-3.5 w-3.5" />
              Account information
              <span className="font-semibold normal-case tracking-normal text-slate-400">
                · required
              </span>
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <InviteInput
                label="First name"
                value={values.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                onBlur={() => blurField('firstName')}
                error={errorFor('firstName')}
                leftIcon={<UserIcon className="h-4 w-4" />}
                placeholder="First name"
                autoComplete="given-name"
              />

              <InviteInput
                label="Last name"
                value={values.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                onBlur={() => blurField('lastName')}
                error={errorFor('lastName')}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>

            {/* Pre-filled, read-only email */}
            <div>
              <label
                htmlFor="invite-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="invite-email"
                  type="email"
                  value={invite.invitee.email}
                  readOnly
                  disabled
                  aria-describedby="invite-email-hint"
                  className="h-11 w-full cursor-not-allowed truncate rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-20 text-sm font-medium text-slate-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge tone="slate">Locked</Badge>
                </span>
              </div>
              <p id="invite-email-hint" className="mt-1.5 text-xs text-slate-400">
                Set by your invitation and can&rsquo;t be changed.
              </p>
            </div>

            <InviteInput
              label="Phone number"
              type="tel"
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              onBlur={() => blurField('phone')}
              error={errorFor('phone')}
              leftIcon={<PhoneIcon className="h-4 w-4" />}
              placeholder={PHONE_PLACEHOLDER}
              autoComplete="tel"
              hint="Used for account recovery and school notifications."
            />

            <div>
              <div className="relative">
                <InviteInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={(e) => setField('password', e.target.value)}
                  onBlur={() => blurField('password')}
                  error={errorFor('password')}
                  leftIcon={<LockIcon className="h-4 w-4" />}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-10 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordChecklist password={values.password} />
            </div>

            <div>
              <InviteInput
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                onBlur={() => blurField('confirmPassword')}
                error={errorFor('confirmPassword')}
                leftIcon={<LockIcon className="h-4 w-4" />}
                placeholder="••••••••"
                autoComplete="new-password"
              />

              {!errorFor('confirmPassword') &&
                values.confirmPassword.length > 0 &&
                values.confirmPassword === values.password && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                    Passwords match
                  </p>
                )}
            </div>
          </fieldset>

          {/* Optional profile details accordion */}
          <fieldset disabled={isSubmitting}>
            <button
              type="button"
              onClick={() => setShowOptional((s) => !s)}
              aria-expanded={showOptional}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">
                  Profile details
                </span>
                <span className="block text-xs text-slate-400">
                  Optional — you can add these later in Settings.
                </span>
              </span>
              <ChevronDownIcon
                className={cn(
                  'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
                  showOptional && 'rotate-180'
                )}
              />
            </button>

            {showOptional && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid gap-4 pt-4 sm:grid-cols-2">
                  <InviteInput
                    label="Age"
                    type="number"
                    min={1}
                    max={120}
                    value={optional.age}
                    onChange={(e) =>
                      setOptional((o) => ({ ...o, age: e.target.value }))
                    }
                    placeholder="34"
                  />

                  <InviteSelect
                    label="Gender"
                    value={optional.gender}
                    onChange={(e) =>
                      setOptional((o) => ({ ...o, gender: e.target.value }))
                    }
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </InviteSelect>

                  <InviteInput
                    label="City"
                    value={optional.city}
                    onChange={(e) =>
                      setOptional((o) => ({ ...o, city: e.target.value }))
                    }
                    placeholder="Lagos"
                  />

                  <InviteSelect
                    label="Preferred language"
                    value={optional.language}
                    onChange={(e) =>
                      setOptional((o) => ({ ...o, language: e.target.value }))
                    }
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </InviteSelect>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="invite-note"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      {invite.role === 'teacher'
                        ? 'Qualifications'
                        : invite.role === 'parent'
                        ? 'Relationship to student'
                        : 'About you'}
                    </label>
                    <textarea
                      id="invite-note"
                      rows={3}
                      value={optional.note}
                      onChange={(e) =>
                        setOptional((o) => ({ ...o, note: e.target.value }))
                      }
                      placeholder={
                        invite.role === 'teacher'
                          ? 'B.Ed Mathematics, 8 years teaching experience'
                          : invite.role === 'parent'
                          ? 'Father · primary contact'
                          : 'A short introduction'
                      }
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </fieldset>

          <div>
            <Button
              type="submit"
              size="xl"
              className="w-full"
              loading={isSubmitting}
              rightIcon={
                isSubmitting ? undefined : <ArrowRightIcon className="h-4 w-4" />
              }
            >
              {isSubmitting ? 'Creating your account…' : 'Create account'}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                href={`${basePath}/login?token=${encodeURIComponent(token)}`}
                className="font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Sign in to accept
              </Link>
            </p>
          </div>
        </form>
      </div>
    </InviteLayout>
  );
}
