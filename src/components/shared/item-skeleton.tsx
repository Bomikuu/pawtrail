import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PostCardSkeleton({ media = true }: { media?: boolean }) {
  return (
    <Card className="gap-4 p-4 shadow-none sm:p-[1.125rem]" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full bg-muted" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-36 max-w-[70%] bg-muted" />
          <Skeleton className="h-3 w-24 bg-muted" />
        </div>
        <Skeleton className="size-8 rounded-md bg-muted" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-3.5 w-full bg-muted" />
        <Skeleton className="h-3.5 w-4/5 bg-muted" />
      </div>
      {media && (
        <Skeleton className="aspect-[16/9] w-full rounded-xl bg-muted" />
      )}
      <div className="flex items-center gap-5 border-t pt-4">
        <Skeleton className="h-5 w-14 bg-muted" />
        <Skeleton className="h-5 w-16 bg-muted" />
        <Skeleton className="h-5 w-14 bg-muted" />
        <Skeleton className="ms-auto size-5 bg-muted" />
      </div>
    </Card>
  )
}

export function PetCardSkeleton() {
  return (
    <Card
      className="flex-row items-center gap-3 p-3 shadow-none"
      aria-hidden="true"
    >
      <Skeleton className="size-16 shrink-0 rounded-full bg-muted" />
      <div className="grid min-w-0 flex-1 gap-2">
        <Skeleton className="h-4 w-24 max-w-full bg-muted" />
        <Skeleton className="h-3 w-32 max-w-full bg-muted" />
        <Skeleton className="h-3 w-20 bg-muted" />
      </div>
      <Skeleton className="size-4 bg-muted" />
    </Card>
  )
}

export function ResourceCardSkeleton() {
  return (
    <Card className="gap-4 p-5 shadow-none" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full bg-muted" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-4 w-2/5 bg-muted" />
          <Skeleton className="h-3 w-1/3 bg-muted" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4 bg-muted" />
      <Skeleton className="h-3 w-full bg-muted" />
      <Skeleton className="h-3 w-4/5 bg-muted" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-28 bg-muted" />
        <Skeleton className="h-9 w-24 bg-muted" />
      </div>
    </Card>
  )
}
