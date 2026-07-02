/**
 * Global error boundary — catches unhandled errors in the React tree.
 * Must be a Client Component (uses useEffect + browser APIs).
 */

'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // TODO Phase 7: pipe to Sentry / error tracking
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 text-2xl">
        ⚠
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {error.message || 'An unexpected error occurred. Our team has been notified.'}
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-xl bg-indigo-800 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-indigo-900"
      >
        Try again
      </button>
    </div>
  );
}
