// Route-level loading UI (App Router streaming fallback).
export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="card h-40 skeleton" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-24 skeleton" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card h-64 skeleton lg:col-span-3" />
        <div className="card h-64 skeleton lg:col-span-2" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
