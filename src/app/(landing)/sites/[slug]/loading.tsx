import { Skeleton } from '@/components/ui/skeleton'
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading organization website"
      className="mx-auto max-w-6xl space-y-8 p-8"
    >
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-16 w-4/5" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-40" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  )
}
