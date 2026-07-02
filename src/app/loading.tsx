/**
 * Global loading skeleton — shown during root-level Suspense.
 * Pages should define their own loading.tsx for granular skeletons.
 */

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-800" />
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    </div>
  );
}
