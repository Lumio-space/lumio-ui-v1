'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon,
  ClockIcon,
  LinkIcon,
  CheckCircle2Icon,
  MailIcon,
  CalendarIcon,
  ShieldCheckIcon,
  XCircleIcon,
  UserCheckIcon,
  LogInIcon,
  QuoteIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  MegaphoneIcon,
  TrendingUpIcon,
  RefreshCwIcon,
  SchoolIcon,
} from 'lucide-react';

import { InviteLayout } from '@/components/invite/InviteLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { Avatar } from '@/components/shared/Avatar';
import { Modal } from '@/components/shared/Modal';
import { ROLE_META, type InvitePayload, type InviteState, type InviteRole } from '@/components/invite/inviteTypes';
import { useClasses } from '@/features/classes/hooks';
import {
  GRADE_LEVEL_LABELS,
  composeClassName,
  DEPARTMENT_TONES,
} from '@/features/classes/constants';
import type { ClassRecord } from '@/features/classes/types';
import { useValidateInvitation, useDeclineInvitation } from '../hooks/useAcceptInvitation';
import { AcceptInviteSkeleton } from './AcceptInviteSkeleton';
import { cn } from '@/lib/utils';

type LocalState = InviteState | 'declined';

const HIGHLIGHT_ICONS = {
  calendar: CalendarDaysIcon,
  results: ClipboardListIcon,
  chat: MessageSquareIcon,
  megaphone: MegaphoneIcon,
  chart: TrendingUpIcon,
};

/** Shared shell for the non-actionable outcomes (expired / invalid / used / declined). */
function OutcomeCard({
  icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  tone: 'gold' | 'red' | 'green' | 'slate';
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const tones = {
    gold: 'bg-gold-50 text-gold-500',
    red: 'bg-red-50 text-red-500',
    green: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
      role="alert"
    >
      <div
        className={cn(
          'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl',
          tones[tone]
        )}
      >
        {icon}
      </div>
      <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="mt-7 space-y-3">{children}</div>
    </motion.div>
  );
}

/** School + inviter context reused across the outcome states. */
function SchoolContext({
  school,
  inviter,
  email,
}: {
  school: { name: string; initials?: string; location?: string };
  inviter?: { name?: string; title?: string; avatar?: string };
  email?: string;
}) {
  const initials = school.initials || '';
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-soft">
      <div className="flex items-center gap-3">
        {initials ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400 font-display text-sm font-extrabold text-indigo-900">
            {initials}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {school.name}
          </p>
          {school.location ? (
            <p className="truncate text-xs text-slate-400">{school.location}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-slate-50 pt-3 text-xs">
        {inviter?.name ? (
          <p className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Invited by</span>
            <span className="truncate font-semibold text-slate-700">
              {inviter.name}
            </span>
          </p>
        ) : null}
        {email && (
          <p className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Sent to</span>
            <span className="truncate font-semibold text-slate-700">{email}</span>
          </p>
        )}
      </div>
    </div>
  );
}

interface InviteDetailsViewProps {
  token?: string;
  onAccept?: (isExistingAccount: boolean) => void;
  onDecline?: () => void;
}

export function InviteDetailsView({
  token: propToken,
  onAccept,
  onDecline,
}: InviteDetailsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const token = propToken ?? searchParams.get('token') ?? '';

  const {
    data: inviteData,
    isLoading,
    isError,
    error: validateError,
    refetch,
  } = useValidateInvitation(token);

  const declineMutation = useDeclineInvitation();

  const [localState, setLocalState] = useState<LocalState | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Determine base path for sub-routes (/invite or /accept-invite)
  const basePath = pathname.startsWith('/accept-invite') ? '/accept-invite' : '/invite';

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

  function formatDate(dateStr?: string) {
    if (!dateStr) return '7 days';
    try {
      return format(new Date(dateStr), 'd MMMM yyyy');
    } catch {
      return dateStr;
    }
  }

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

  const inviteeName = inviteData?.inviteeName || undefined;
  const schoolName = inviteData?.schoolName || '';
  const inviterName = inviteData?.inviterName || undefined;

  const inviteRole: InviteRole = (inviteData?.role?.toLowerCase() as InviteRole) || 'teacher';
  const role = ROLE_META[inviteRole as keyof typeof ROLE_META] || ROLE_META.teacher;

  // Construct invite object matching InvitePayload
  const invite: InvitePayload = {
    token,
    role: inviteRole,
    state: 'valid',
    existingAccount: Boolean(inviteData?.isExistingUser),
    invitee: {
      firstName: inviteeName,
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

  // Determine current effective state
  let currentState: LocalState = localState ?? 'valid';
  if (isError) {
    const errorMsg = validateError instanceof Error ? validateError.message.toLowerCase() : '';
    if (errorMsg.includes('already') || errorMsg.includes('accepted')) {
      currentState = localState ?? 'used';
    } else if (errorMsg.includes('revoked') || errorMsg.includes('decline')) {
      currentState = localState ?? 'declined';
    } else if (errorMsg.includes('expired') && !errorMsg.includes('invalid')) {
      currentState = localState ?? 'expired';
    } else {
      currentState = localState ?? 'invalid';
    }
  } else if (inviteData) {
    if (inviteData.status === 'revoked') {
      currentState = localState ?? 'declined';
    } else if (inviteData.status === 'expired') {
      currentState = localState ?? 'expired';
    } else if (inviteData.status === 'accepted') {
      currentState = localState ?? 'used';
    }
  }

  function handleAccept() {
    setAccepting(true);
    if (onAccept) {
      onAccept(invite.existingAccount);
      return;
    }
    const target = invite.existingAccount
      ? `${basePath}/login?token=${encodeURIComponent(token)}`
      : `${basePath}/setup?token=${encodeURIComponent(token)}`;
    router.push(target);
  }

  const [declineError, setDeclineError] = useState<string | null>(null);

  async function handleConfirmDecline() {
    if (token) {
      try {
        setDeclineError(null);
        await declineMutation.mutateAsync({ token });
        setDeclineOpen(false);
        setLocalState('declined');
        onDecline?.();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to decline invitation';
        setDeclineError(msg);
      }
    } else {
      setDeclineOpen(false);
      setLocalState('declined');
      onDecline?.();
    }
  }

  /* --------------------- No token in URL --------------------- */
  if (!token) {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<LinkIcon className="h-8 w-8" />}
          tone="red"
          title="Missing Invitation Link"
          description="No invitation token was found in your URL. Please click the full link provided in your invitation email."
        >
          <Link href="/login" className="block">
            <Button size="xl" className="w-full" rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
              Go to sign in
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Loading ------------------------- */
  if (isLoading) {
    return <AcceptInviteSkeleton />;
  }

  /* --------------------- Network Error --------------------- */
  const errorMessage = validateError instanceof Error ? validateError.message : '';
  const isNetworkError =
    isError &&
    (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('failed to fetch') ||
      errorMessage.toLowerCase().includes('connect'));

  if (isNetworkError) {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<RefreshCwIcon className="h-8 w-8" />}
          tone="gold"
          title="Unable to verify invitation"
          description="We could not reach the server to verify your invitation. Please check your internet connection and try again."
        >
          <Button
            size="xl"
            className="w-full"
            onClick={() => refetch()}
            leftIcon={<RefreshCwIcon className="h-4 w-4" />}
          >
            Retry verification
          </Button>
          <Link href="/login" className="block">
            <Button variant="ghost" size="xl" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Expired ------------------------- */
  if (currentState === 'expired') {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<ClockIcon className="h-8 w-8" />}
          tone="gold"
          title="This invitation has expired"
          description={`Invitation links stay valid for 7 days. This one expired${
            invite.expiresOn ? ` on ${formatDate(invite.expiresOn)}` : ''
          }, so it can no longer be used to join.`}
        >
          <SchoolContext
            school={invite.school}
            inviter={invite.inviter}
            email={invite.invitee.email}
          />
          <p className="text-sm text-slate-500">
            Nothing is wrong with your account — you simply need a fresh link.
          </p>
          <Button size="xl" className="w-full">
            Contact school administrator
          </Button>
          <Link href="/login" className="block">
            <Button variant="ghost" size="xl" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Invalid ------------------------- */
  if (currentState === 'invalid') {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<LinkIcon className="h-8 w-8" />}
          tone="red"
          title="This invitation link isn't valid"
          description="The link may be incomplete, mistyped, or it may have been revoked. Open the most recent invitation email and tap the link again."
        >
          <div className="rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-500">
            <p className="font-semibold text-slate-700">Things to check</p>
            <ul className="mt-2 space-y-1.5">
              <li>· Copy the full link, including everything after the slash</li>
              <li>· Make sure you opened the newest invitation email</li>
              <li>· Ask your school to reissue the invitation</li>
            </ul>
          </div>
          <Link href="/login" className="block">
            <Button size="xl" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Already Used ------------------------- */
  if (currentState === 'used') {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<CheckCircle2Icon className="h-8 w-8" />}
          tone="green"
          title="This invitation has already been used"
          description={`Good news — an account for ${invite.invitee.email} already exists at ${invite.school.name}. Just sign in to continue.`}
        >
          <SchoolContext school={invite.school} inviter={invite.inviter} />
          <Link href="/login" className="block">
            <Button
              size="xl"
              className="w-full"
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Sign in to Lumio
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="ghost" size="xl" className="w-full">
              Forgot your password?
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Declined ------------------------- */
  if (currentState === 'declined') {
    return (
      <InviteLayout invite={invite} showContext={false}>
        <OutcomeCard
          icon={<XCircleIcon className="h-8 w-8" />}
          tone="slate"
          title="Invitation declined"
          description={
            invite.inviter?.name
              ? `We've let ${invite.inviter.name} know that you won't be joining ${invite.school.name} for now. You can still accept while the link is valid.`
              : `You've declined the invitation to join ${invite.school.name}. You can still accept while the link is valid.`
          }
        >
          <Button
            size="xl"
            variant="outline"
            className="w-full"
            onClick={() => setLocalState('valid')}
          >
            Change my mind
          </Button>
          <Link href="/login" className="block">
            <Button variant="ghost" size="xl" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </OutcomeCard>
      </InviteLayout>
    );
  }

  /* ------------------------- Valid State ------------------------- */
  return (
    <InviteLayout invite={invite}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Badge tone={role.tone} dot>
          {role.label} invitation
        </Badge>
        <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-slate-900">
          {invite.invitee.firstName
            ? `Hi ${invite.invitee.firstName}, you’ve been invited to ${invite.school.name}`
            : invite.inviter?.name
            ? `You’ve been invited by ${invite.inviter.name} to join ${invite.school.name}`
            : `You’ve been invited to join ${invite.school.name}`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Join Lumio as a{' '}
          <span className="font-semibold text-slate-700">
            {role.label.toLowerCase()}
          </span>{' '}
          at {invite.school.name}. {role.blurb}
        </p>

        {/* Existing account notice */}
        {invite.existingAccount && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <UserCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                You already have a Lumio account
              </p>
              <p className="mt-0.5 text-sm text-indigo-700">
                No need to create another one. Sign in and {invite.school.name} will
                be added to your account.
              </p>
            </div>
          </div>
        )}

        {/* Inviter — visible on mobile where the brand panel is hidden */}
        {invite.inviter?.name ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft lg:hidden">
            <Avatar
              name={invite.inviter.name}
              src={invite.inviter.avatar}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Invited by</p>
              <p className="truncate text-sm font-semibold text-slate-800">
                {invite.inviter.name}
              </p>
              {invite.inviter.title ? (
                <p className="truncate text-xs text-slate-400">
                  {invite.inviter.title}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Invitation message */}
        {invite.message && (
          <blockquote className="mt-5 flex gap-3 rounded-2xl bg-slate-50 p-4">
            <QuoteIcon className="h-4 w-4 shrink-0 text-slate-300" />
            <p className="text-sm italic leading-relaxed text-slate-600">
              {invite.message}
            </p>
          </blockquote>
        )}

        {/* Role Highlights */}
        <ul className="mt-5 space-y-2">
          {role.highlights.map((h) => {
            const Icon = HIGHLIGHT_ICONS[h.icon as keyof typeof HIGHLIGHT_ICONS];
            return (
              <li key={h.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {h.label}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Class Assignment / Placement Card */}
        {assignedClassName && inviteRole !== 'parent' && (
          <div className="mt-5 rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <SchoolIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-indigo-600">
                  {inviteRole === 'teacher' ? 'Assigned Role & Class' : 'Class Placement'}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-indigo-950 truncate">
                    {inviteRole === 'teacher'
                      ? `Form Teacher · ${assignedClassName}`
                      : assignedClassName}
                  </p>
                  {classDepartment && (
                    <Badge
                      tone={
                        DEPARTMENT_TONES[classDepartment as keyof typeof DEPARTMENT_TONES] ||
                        'purple'
                      }
                    >
                      {classDepartment}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invitation details dl */}
        <dl className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-soft">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">School</dt>
            <dd className="text-sm font-semibold text-slate-800">
              {invite.school.name}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-slate-500">Role</dt>
            <dd>
              <Badge tone={role.tone}>{role.label}</Badge>
            </dd>
          </div>
          {assignedClassName && inviteRole !== 'parent' && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate-500">
                {inviteRole === 'teacher' ? 'Assigned Class' : 'Class Placement'}
              </dt>
              <dd className="flex items-center gap-2 font-semibold text-slate-800">
                <span>{assignedClassName}</span>
                {classDepartment && (
                  <Badge
                    tone={
                      DEPARTMENT_TONES[classDepartment as keyof typeof DEPARTMENT_TONES] ||
                      'purple'
                    }
                  >
                    {classDepartment}
                  </Badge>
                )}
              </dd>
            </div>
          )}
          {invite.inviter?.name ? (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-slate-500">Invited by</dt>
              <dd className="truncate text-sm font-semibold text-slate-800">
                {invite.inviter.name}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-sm text-slate-500">
              <MailIcon className="h-4 w-4 text-slate-400" />
              Email
            </dt>
            <dd className="truncate text-sm font-semibold text-slate-800">
              {invite.invitee.email}
            </dd>
          </div>
        </dl>

        {/* Expiry notice */}
        {invite.expiresOn && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700">
            <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This invitation expires on{' '}
              <span className="font-bold">{formatDate(invite.expiresOn)}</span>.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            size="xl"
            className="w-full"
            loading={accepting}
            onClick={handleAccept}
            leftIcon={
              !accepting && invite.existingAccount ? (
                <LogInIcon className="h-4 w-4" />
              ) : undefined
            }
            rightIcon={
              accepting || invite.existingAccount ? undefined : (
                <ArrowRightIcon className="h-4 w-4" />
              )
            }
          >
            {accepting
              ? 'Just a moment…'
              : invite.existingAccount
              ? 'Sign in to accept'
              : 'Accept invitation'}
          </Button>
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            onClick={() => setDeclineOpen(true)}
          >
            Decline
          </Button>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
          By accepting you agree to Lumio&rsquo;s Terms and Privacy Policy.
        </p>
      </motion.div>

      {/* Decline confirmation modal */}
      <Modal
        open={declineOpen}
        onClose={() => {
          setDeclineOpen(false);
          setDeclineError(null);
        }}
        title="Decline this invitation?"
        description={
          invite.inviter?.name
            ? `${invite.inviter.name} will be notified that you declined. You can still accept it later while the link is valid.`
            : `Your school administrator will be notified that you declined. You can still accept it later while the link is valid.`
        }
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeclineOpen(false);
                setDeclineError(null);
              }}
            >
              Keep invitation
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDecline}
              loading={declineMutation.isPending}
            >
              Decline invitation
            </Button>
          </>
        }
      >
        {declineError && (
          <div
            role="alert"
            className="mb-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700"
          >
            {declineError}
          </div>
        )}
        <p className="text-sm text-slate-500">
          You were invited to join{' '}
          <span className="font-semibold text-slate-700">
            {invite.school.name}
          </span>{' '}
          as a {role.label.toLowerCase()}.
        </p>
      </Modal>
    </InviteLayout>
  );
}
