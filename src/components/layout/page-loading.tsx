import { AnimalLoader } from '@/components/shared/animal-loader'
import { CommunityPageSkeleton } from '@/features/community/feed-loading'

/** One visual state, shared by immediate navigation and streamed route fallbacks. */
export function PageLoading({ pathname }: { pathname?: string } = {}) {
  if (pathname === '/community') return <CommunityPageSkeleton />
  return (
    <div
      className="page-loading grid min-h-[45dvh] place-items-center p-8"
      data-page-loading
    >
      <AnimalLoader label="Following the pawprints…" />
    </div>
  )
}
