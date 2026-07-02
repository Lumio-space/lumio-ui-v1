/**
 * Onboarding Page — /onboarding
 *
 * Phase 1: Scaffold. Preserves the multi-step layout structure.
 * Phase 2: Replace with the full OnboardingForm (5 steps, React Hook Form + Zod).
 */

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Set up your workspace' };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lumio_logo_text_only.png" alt="Lumio" className="mx-auto h-7 w-auto" />

        <div className="mt-10 rounded-3xl border border-dashed border-indigo-200 bg-white p-12 text-center shadow-card">
          <p className="font-display text-xl font-extrabold text-slate-900">
            Onboarding wizard coming in Phase 2
          </p>
          <p className="mt-2 text-sm text-slate-500">
            5-step school setup: details → type → branding → academics → administrators
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex items-center rounded-xl bg-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
          >
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
