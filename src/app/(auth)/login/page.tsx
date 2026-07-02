/**
 * Login Page — /login
 *
 * Phase 1: Scaffold only — renders a placeholder that preserves
 * the split-panel layout structure from the original.
 *
 * Phase 2: Replace with the full LoginForm (React Hook Form + Zod)
 * from features/auth/components/LoginForm.tsx.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-900 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lumio_logo_text_only.png" alt="Lumio" className="h-6 w-auto" />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white">
            The operating system for modern schools.
          </h1>
          <p className="mt-4 text-lg text-indigo-200">
            Run admissions, attendance, academics and communication from a single premium platform.
          </p>
        </div>
        <p className="relative z-10 text-sm text-indigo-400">
          Trusted by 2,400+ schools across 38 countries.
        </p>
      </div>

      {/* Right form panel — full LoginForm wired in Phase 2 */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lumio_logo_text_only.png" alt="Lumio" className="h-7 w-auto" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your Lumio workspace to continue.</p>

          {/* TODO Phase 2: swap for <LoginForm /> */}
          <div className="mt-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 p-8 text-center">
            <p className="text-sm font-semibold text-indigo-700">LoginForm coming in Phase 2</p>
            <p className="mt-1 text-xs text-indigo-400">
              React Hook Form + Zod + next-auth
            </p>
            <a
              href="/dashboard"
              className="mt-4 inline-flex items-center rounded-xl bg-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-900"
            >
              Go to dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
