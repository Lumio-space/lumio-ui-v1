/**
 * Global 404 — shown for any unmatched route.
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-display text-8xl font-extrabold text-indigo-100">404</p>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center rounded-xl bg-indigo-800 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-indigo-900"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
