export default function MyClassesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
