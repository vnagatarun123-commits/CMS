import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-5 w-24 mt-2" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
