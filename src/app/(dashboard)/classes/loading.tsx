export default function ClassesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <div className="h-24 animate-pulse bg-indigo-900/30" />
            <div className="space-y-3 bg-white p-5">
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
