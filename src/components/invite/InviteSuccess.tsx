'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  ArrowRightIcon,
  GraduationCapIcon,
  BadgeCheckIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/shared/Badge';
import { ROLE_META, type InvitePayload } from './inviteTypes';
import { useAuthStore } from '@/stores/auth.store';

interface InviteSuccessProps {
  invite: InvitePayload;
  firstName: string;
  variant?: 'created' | 'joined';
}

export function InviteSuccess({
  invite,
  firstName,
  variant = 'created',
}: InviteSuccessProps) {
  const router = useRouter();
  const role = ROLE_META[invite.role] || ROLE_META.teacher;

  function continueToLumio() {
    router.push('/dashboard');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"
      >
        <CheckIcon className="h-9 w-9" strokeWidth={3} />
      </motion.div>

      <h1 className="mt-5 font-display text-2xl font-extrabold text-slate-900">
        {variant === 'created'
          ? `Welcome to Lumio, ${firstName}!`
          : `You've joined ${invite.school.name}`}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {variant === 'created'
          ? 'Your account is ready and you have been added to the school.'
          : `${invite.school.name} has been added to your existing Lumio account.`}
      </p>

      {/* Confirmed school + role */}
      <div className="mt-6 space-y-2.5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400 font-display text-sm font-extrabold text-indigo-900">
            {invite.school.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">School joined</p>
            <p className="truncate text-sm font-bold text-slate-800">
              {invite.school.name}
            </p>
          </div>
          <GraduationCapIcon className="h-4 w-4 shrink-0 text-slate-300" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BadgeCheckIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">Your Lumio role</p>
            <p className="text-sm font-bold text-slate-800">{role.label}</p>
          </div>
          <Badge tone="green" dot>
            Active
          </Badge>
        </div>
      </div>

      {/* What happens next — never class assignments */}
      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          What happens next
        </p>
        <ul className="mt-3 space-y-3">
          {role.whatsNext.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        size="xl"
        className="mt-6 w-full"
        onClick={continueToLumio}
        rightIcon={<ArrowRightIcon className="h-4 w-4" />}
      >
        Continue to Lumio
      </Button>
      <p className="mt-3 text-xs text-slate-400">
        Takes you to your {role.dashboardLabel}.
      </p>
    </motion.div>
  );
}
