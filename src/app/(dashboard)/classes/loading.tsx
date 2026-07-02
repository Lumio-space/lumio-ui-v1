export default function ClassesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
