export default function SubjectsLoading() {
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

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-lg bg-slate-50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
