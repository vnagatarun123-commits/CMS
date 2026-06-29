export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="h-3.5 w-64 rounded-md bg-muted" />
        </div>
        <div className="h-9 w-28 rounded-md bg-muted" />
      </div>
      <div className="h-10 w-full rounded-md bg-muted" />
      <div className="rounded-lg border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 flex-1 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
