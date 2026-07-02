export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-border px-4 py-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => <Skeleton key={j} className="h-3 w-3/4" />)}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
