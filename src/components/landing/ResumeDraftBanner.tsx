'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOnboardingStore, isDraftExpired } from '@/stores/onboarding.store';
import { ArrowRightIcon, SparklesIcon, XIcon } from 'lucide-react';

export function ResumeDraftBanner() {
  const [hasDraft, setHasDraft] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const draftToken = useOnboardingStore((s) => s.draftToken);
  const createdAt = useOnboardingStore((s) => s.createdAt);

  useEffect(() => {
    if (draftToken && !isDraftExpired(createdAt)) {
      setHasDraft(true);
    } else {
      setHasDraft(false);
    }
  }, [draftToken, createdAt]);

  if (!hasDraft || dismissed) return null;

  return (
    <aside aria-label="Resume registration" className="bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 border-b border-amber-500/30 text-amber-100 text-xs sm:text-sm px-4 py-2.5">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            You have an unfinished school registration in progress.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-white underline decoration-amber-400/60 underline-offset-4"
          >
            <span>Resume onboarding</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-amber-300/70 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Dismiss banner"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
