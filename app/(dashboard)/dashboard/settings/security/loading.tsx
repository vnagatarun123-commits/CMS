import { Skeleton } from '@/components/ui/skeleton'

export default function SecurityLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="flex justify-end pt-2">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  )
}
