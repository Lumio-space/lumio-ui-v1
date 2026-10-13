'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  UserCheckIcon,
  RefreshCwIcon,
} from 'lucide-react';

import { InviteLayout } from '@/components/invite/InviteLayout';
import { InviteSuccess } from '@/components/invite/InviteSuccess';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { InviteInput } from '@/components/invite/InviteInput';
import { ROLE_META, type InvitePayload, type InviteRole } from '@/components/invite/inviteTypes';
import { useAuthStore } from '@/stores/auth.store';
import { clearAuthCookie } from '@/features/auth/hooks/useAuth';
import { loginUser, logoutUser } from '@/features/auth/services/auth.api';
import {
  useValidateInvitation,
  useAcceptExistingTeacher,
} from '../hooks/useAcceptInvitation';
import { AcceptInviteSkeleton } from './AcceptInviteSkeleton';

type Status = 'idle' | 'submitting' | 'error' | 'invalidCredentials';

interface InviteLoginViewProps {
  token?: string;
  onBack?: () => void;
}

export function InviteLoginView({ token: propToken, onBack }: InviteLoginViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = propToken ?? searchParams.get('token') ?? '';

  const basePath = pathname.startsWith('/accept-invite') ? '/accept-invite' : '/invite';

  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  const {
    data: inviteData,
    isLoading,
    isError,
  } = useValidateInvitation(token);

  const {
    mutate: acceptExisting,
    isPending: isAcceptingPending,
    isSuccess: isAcceptSuccess,
    error: acceptError,
    reset: resetAcceptMutation,
  } = useAcceptExistingTeacher();

  const [status, setStatus] = useState<Status>('idle');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

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
  const inviterName = inviteData?.inviterName || undefined;
  const inviteRole: InviteRole = (inviteData?.role?.toLowerCase() as InviteRole) || 'teacher';
  const role = ROLE_META[inviteRole as keyof typeof ROLE_META] || ROLE_META.teacher;

  const invite: InvitePayload = {
    token,
    role: inviteRole,
    state: isError ? 'invalid' : 'valid',
    existingAccount: true,
    invitee: {
      firstName: inviteData?.inviteeName || '',
      lastName: '',
      email: inviteData?.email || '',
    },
    school: {
      name: schoolName,
      initials: inviteData?.schoolInitials || deriveInitials(schoolName),
      location: inviteData?.schoolLocation || undefined,
      logo: inviteData?.schoolLogo,
    },
    inviter: inviterName
      ? {
          name: inviterName,
          title: inviteData?.inviterRole || undefined,
        }
      : undefined,
    message: inviteData?.message,
    sentOn: '',
    expiresOn: inviteData?.expiresAt || '',
  };

  const isSubmitting = status === 'submitting' || isAcceptingPending;
  const passwordError =
    touched && !password ? 'Enter your Lumio password' : undefined;

  async function handleSwitchAccount() {
    clearAuthCookie();
    clearUser();
    setAuthenticated(false);
    try {
      await logoutUser();
    } catch {
      // Ignore network errors during logout
    }
    const callbackUrl = `${basePath}?token=${encodeURIComponent(token)}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  function handleDirectAccept() {
    if (!token) return;
    acceptExisting({ token });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setTouched(true);
    if (!password) return;

    setStatus('submitting');
    try {
      const loginRes = await loginUser({
        email: invite.invitee.email,
        password,
        rememberMe: true,
      });

      if (loginRes?.user) {
        setUser({
          id: loginRes.user.id,
          name: loginRes.user.name || loginRes.user.fullName || invite.invitee.email.split('@')[0],
          email: loginRes.user.email,
          role: loginRes.user.role || inviteRole,
          schoolId: loginRes.user.schoolId,
        });
        setAuthenticated(true);
      }

      acceptExisting({ token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      if (message.includes('credential') || message.includes('password') || message.includes('unauthorized') || message.includes('401')) {
        setStatus('invalidCredentials');
      } else {
        setStatus('error');
      }
    }
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
            We can&rsquo;t accept this invitation
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            This invitation is no longer valid. Ask {invite.school.name} to send a
            fresh invitation.
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

  /* ------------------------- Success ------------------------- */
  if (isAcceptSuccess) {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <InviteSuccess
          invite={invite}
          firstName={invite.invitee.firstName || currentUser?.name?.split(' ')[0] || role.label}
          variant="joined"
        />
      </InviteLayout>
    );
  }

  /* ------------------- Form / Acceptance ------------------- */
  return (
    <InviteLayout invite={invite}>
      <div>
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
          Sign in to accept
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          You already have a Lumio account, so there&rsquo;s nothing new to create.
          Sign in and {invite.school.name} will be added to it.
        </p>

        {/* Recognised account */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <Avatar
            name={currentUser?.name || inviteData?.inviteeName || role.label}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-indigo-900">
              {currentUser?.name || inviteData?.inviteeName || role.label}
            </p>
            <p className="truncate text-xs text-indigo-700">
              {invite.invitee.email}
            </p>
          </div>
          <UserCheckIcon className="h-5 w-5 shrink-0 text-indigo-500" />
        </div>

        {/* What you're joining */}
        <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-soft">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">Joining</dt>
            <dd className="truncate text-sm font-semibold text-slate-800">
              {invite.school.name}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">As</dt>
            <dd>
              <Badge tone={role.tone}>{role.label}</Badge>
            </dd>
          </div>
        </dl>

        {/* Processing banner */}
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
                Accepting invitation…
              </p>
              <p className="text-sm text-purple-700">
                Adding {invite.school.name} to your account.
              </p>
            </div>
          </motion.div>
        )}

        {/* Wrong password */}
        {status === 'invalidCredentials' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Incorrect password
              </p>
              <p className="mt-0.5 text-sm text-red-600">
                Check your password and try again, or reset it below.
              </p>
            </div>
          </motion.div>
        )}

        {/* Server error */}
        {(status === 'error' || acceptError) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-800">
                We couldn&rsquo;t accept the invitation
              </p>
              <p className="mt-0.5 text-sm text-red-600">
                {acceptError instanceof Error
                  ? acceptError.message
                  : 'Something went wrong on our end. Please try again.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                leftIcon={<RefreshCwIcon className="h-4 w-4" />}
                onClick={() => {
                  setStatus('idle');
                  resetAcceptMutation();
                }}
              >
                Try again
              </Button>
            </div>
          </motion.div>
        )}

        {/* Case A: User already signed in */}
        {isAuthenticated && currentUser ? (
          currentUser.email.toLowerCase() === invite.invitee.email.toLowerCase() ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p>
                  You are signed in as{' '}
                  <strong className="text-slate-900">{currentUser.email}</strong>.
                </p>
                <p className="mt-1 text-slate-500 text-xs">
                  Click below to accept this invitation and activate your{' '}
                  {role.label.toLowerCase()} membership at {invite.school.name}.
                </p>
              </div>

              <Button
                type="button"
                size="xl"
                loading={isAcceptingPending}
                disabled={isAcceptingPending}
                onClick={handleDirectAccept}
                className="w-full"
                rightIcon={<ArrowRightIcon className="h-4 w-4" />}
              >
                Accept invitation & continue
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p>
                You are currently signed in as{' '}
                <strong>{currentUser.email}</strong>, but this invitation was sent to{' '}
                <strong>{invite.invitee.email}</strong>.
              </p>
              <p className="text-xs text-amber-700">
                Please switch accounts to sign in with the invited email address
                and accept this invitation.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwitchAccount}
                className="font-semibold text-amber-950 border-amber-300 hover:bg-amber-100"
              >
                Switch account
              </Button>
            </div>
          )
        ) : (
          /* Case B: Unauthenticated user — password entry */
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <fieldset disabled={isSubmitting} className="space-y-4">
              {/* Locked email */}
              <div>
                <label
                  htmlFor="existing-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="existing-email"
                    type="email"
                    value={invite.invitee.email}
                    readOnly
                    disabled
                    className="h-11 w-full cursor-not-allowed truncate rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-20 text-sm font-medium text-slate-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge tone="slate">Locked</Badge>
                  </span>
                </div>
              </div>

              <div className="relative">
                <InviteInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (status === 'invalidCredentials' || status === 'error') {
                      setStatus('idle');
                    }
                  }}
                  onBlur={() => setTouched(true)}
                  error={passwordError}
                  leftIcon={<LockIcon className="h-4 w-4" />}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
            </fieldset>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              loading={isSubmitting}
              rightIcon={
                isSubmitting ? undefined : <ArrowRightIcon className="h-4 w-4" />
              }
            >
              {isSubmitting ? 'Accepting invitation…' : 'Sign in and accept'}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Not {invite.invitee.firstName}?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Use a different account
              </Link>
            </p>
          </form>
        )}
      </div>
    </InviteLayout>
  );
}
