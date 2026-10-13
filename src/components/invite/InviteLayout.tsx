'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Avatar } from '@/components/shared/Avatar';
import { ROLE_META, type InvitePayload } from './inviteTypes';
import { cn } from '@/lib/utils';

interface InviteLayoutProps {
  invite: InvitePayload;
  /** Hide the invitation context on the brand panel (used for error states). */
  showContext?: boolean;
  children: React.ReactNode;
}

const chipTones = {
  purple: 'bg-purple-500/20 text-purple-200 ring-purple-400/30',
  indigo: 'bg-indigo-500/20 text-indigo-100 ring-indigo-400/30',
  gold: 'bg-gold-400/20 text-gold-200 ring-gold-300/30',
};

export function InviteLayout({
  invite,
  showContext = true,
  children,
}: InviteLayoutProps) {
  const role = ROLE_META[invite.role] || ROLE_META.teacher;
  const schoolName = invite.school.name || '';
  const schoolInitials =
    invite.school.initials ||
    (schoolName
      ? schoolName
          .split(' ')
          .filter(Boolean)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '');

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 max-w-xl flex-col justify-between overflow-hidden bg-indigo-900 p-10 lg:flex xl:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        <Logo variant="light" />

        <div className="relative">
          {/* School identity */}
          <div className="flex items-center gap-3">
            {invite.school.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invite.school.logo}
                alt={schoolName}
                className="h-12 w-12 rounded-xl object-contain bg-white p-1"
              />
            ) : schoolInitials ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400 font-display text-base font-extrabold text-indigo-900">
                {schoolInitials}
              </div>
            ) : null}
            <div>
              {schoolName ? (
                <p className="font-display text-lg font-bold text-white">
                  {schoolName}
                </p>
              ) : null}
              {invite.school.location ? (
                <p className="text-sm text-indigo-300">{invite.school.location}</p>
              ) : null}
            </div>
          </div>

          {showContext && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span
                  className={cn(
                    'mt-8 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset',
                    chipTones[role.tone]
                  )}
                >
                  {role.label} invitation
                </span>
                <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-white xl:text-4xl">
                  {schoolName
                    ? `You’re invited to join ${schoolName}.`
                    : 'You’re invited to join.'}
                </h1>
                <p className="mt-3 text-lg text-indigo-200">{role.blurb}</p>
              </motion.div>

              {/* Inviter */}
              {invite.inviter?.name ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 }}
                  className="mt-8 flex items-center gap-3 rounded-2xl bg-indigo-800/60 p-4 ring-1 ring-inset ring-indigo-700/50"
                >
                  <Avatar
                    name={invite.inviter.name}
                    src={invite.inviter.avatar}
                    size="md"
                  />

                  <div className="min-w-0">
                    <p className="text-xs text-indigo-300">Invited by</p>
                    <p className="truncate text-sm font-semibold text-white">
                      {invite.inviter.name}
                    </p>
                    {invite.inviter.title ? (
                      <p className="truncate text-xs text-indigo-300">
                        {invite.inviter.title}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </>
          )}
        </div>

        <p className="relative flex items-center gap-2 text-sm text-indigo-400">
          <ShieldCheckIcon className="h-4 w-4" />
          Secure invitation · Lumio for Schools
        </p>
      </div>

      {/* Content panel */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2 lg:flex-1">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
