export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between px-0.5">
        <div className="space-y-1.5">
          <div className="h-6 w-52 rounded-md bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted" />
      </div>

      {/* Stats strip — mirrors grid-cols-2 sm:3 lg:4 xl:6 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card px-3 py-3 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-4 w-10 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent content table */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="h-3 w-28 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex gap-8">
            {['w-6', 'w-40', 'w-16', 'w-24', 'w-12', 'w-20', 'w-20'].map((w, i) => (
              <div key={i} className={`h-2.5 ${w} rounded bg-muted`} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3 border-b border-border last:border-0">
              <div className="h-3 w-6 rounded bg-muted shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-2.5 w-1/4 rounded bg-muted" />
              </div>
              <div className="h-5 w-14 rounded-full bg-muted shrink-0" />
              <div className="h-5 w-20 rounded-full bg-muted shrink-0" />
              <div className="h-5 w-10 rounded-full bg-muted shrink-0" />
              <div className="h-3 w-16 rounded bg-muted shrink-0" />
              <div className="h-3 w-16 rounded bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
