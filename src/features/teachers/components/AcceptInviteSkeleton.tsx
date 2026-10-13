'use client';

import { Logo } from '@/components/Logo';

export function AcceptInviteSkeleton() {
  return (
    <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
      <div className="w-full max-w-md animate-pulse">
        {/* Logo — mobile only */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        {/* Header skeleton */}
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-100" />

        {/* Invitation card skeleton */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-28 rounded-full bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-11 w-full rounded-xl bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-11 w-full rounded-xl bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-11 w-full rounded-xl bg-slate-100" />
          </div>
          <div className="mt-6 h-12 w-full rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
