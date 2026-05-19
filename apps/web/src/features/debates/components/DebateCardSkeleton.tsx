export function DebateCardSkeleton() {
  return (
    <div className="rounded-2xl border border-hair bg-surface px-6 pt-5 pb-6">
      <div className="h-1 w-full rounded-full bg-surface-mut" />
      <div className="mt-5 flex items-baseline justify-between">
        <span className="h-3 w-20 animate-pulse rounded bg-surface-mut" />
        <span className="h-3 w-12 animate-pulse rounded bg-surface-mut" />
      </div>
      <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-surface-mut" />
      <div className="mt-2 h-6 w-1/2 animate-pulse rounded bg-surface-mut" />
      <div className="mt-8 flex items-center justify-between">
        <div className="flex">
          {Array.from({ length: 3 }).map((_, idx) => (
            <span
              key={idx}
              className="h-8 w-8 rounded-full bg-surface-mut ring-2 ring-surface"
              style={{ marginLeft: idx === 0 ? 0 : -10 }}
            />
          ))}
        </div>
        <span className="h-5 w-24 animate-pulse rounded-full bg-surface-mut" />
      </div>
    </div>
  );
}
