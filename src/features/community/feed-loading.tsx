import { AnimalLoader } from '@/components/shared/animal-loader'
import {
  PostCardSkeleton,
  PetCardSkeleton,
} from '@/components/shared/item-skeleton'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CommunityLayout } from './community-layout'

export function FeedLoading({
  count = 3,
  label = 'Loading community stories…',
}: {
  count?: number
  label?: string
}) {
  return (
    <div
      className="grid gap-4"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
        aria-hidden="true"
      >
        <AnimalLoader compact />
        {label}
      </div>
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} media={index % 2 === 0} />
      ))}
    </div>
  )
}

export function CommunityPageSkeleton() {
  return (
    <CommunityLayout
      loading
      rail={
        <div className="grid gap-6" aria-hidden="true">
          <Card className="gap-0 overflow-hidden py-0 shadow-none">
            <Skeleton className="aspect-[2.05] w-full rounded-none bg-muted" />
            <div className="grid gap-3 p-5">
              <Skeleton className="h-6 w-4/5 bg-muted" />
              <Skeleton className="h-3 w-full bg-muted" />
              <Skeleton className="h-3 w-3/4 bg-muted" />
              <Skeleton className="mt-2 h-10 w-full bg-muted" />
            </div>
          </Card>
          <div className="grid gap-3">
            <Skeleton className="mb-1 h-5 w-3/4 bg-muted" />
            {Array.from({ length: 4 }, (_, index) => (
              <PetCardSkeleton key={index} />
            ))}
          </div>
        </div>
      }
    >
      <div className="mb-4 grid gap-2" aria-hidden="true">
        <Skeleton className="h-8 w-44 bg-muted" />
        <Skeleton className="h-3.5 w-56 max-w-full bg-muted" />
      </div>
      <Card className="mb-4 flex-row gap-2 p-2 shadow-none" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9 flex-1 bg-muted" />
        ))}
      </Card>
      <Card
        className="mb-5 flex-row items-center gap-3 p-4 shadow-none"
        aria-hidden="true"
      >
        <Skeleton className="size-10 shrink-0 rounded-full bg-muted" />
        <Skeleton className="h-10 flex-1 rounded-full bg-muted" />
      </Card>
      <FeedLoading />
    </CommunityLayout>
  )
}
