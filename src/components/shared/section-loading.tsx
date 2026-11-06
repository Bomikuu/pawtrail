import { PawPrint } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
export type SectionSkeletonVariant =
  'activity' | 'photos' | 'about' | 'location'
export function SectionLoading({
  label = 'Loading section…',
  variant = 'activity',
}: {
  label?: string
  variant?: SectionSkeletonVariant
}) {
  return (
    <section
      className={`section-loading min-w-0 py-1 section-loading-${variant}`}
      role="status"
      aria-label={label}
    >
      <p
        className={
          'section-loading-label flex items-center gap-2 [margin:0_0_1rem] text-[color:var(--teal)] text-[0.8125rem] font-semibold'
        }
      >
        <PawPrint size={16} aria-hidden="true" />
        {label}
      </p>
      <div
        className={
          'section-loading-shapes grid gap-3.5 [.section-loading-photos_&]:grid-cols-2 max-[48rem]:[.section-loading-photos_&]:grid-cols-1'
        }
        aria-hidden="true"
      >
        {variant === 'photos' ? (
          Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              className={
                'section-skeleton-photo [aspect-ratio:4_/_3] w-full [.section-skeleton-story_&]:[aspect-ratio:16_/_7]'
              }
              key={i}
            />
          ))
        ) : variant === 'about' ? (
          <>
            <Skeleton className={'section-skeleton-heading w-[45%] h-4'} />
            <Skeleton className={'section-skeleton-line w-full h-3.5'} />
            <Skeleton className={'section-skeleton-line w-full h-3.5'} />
            <Skeleton className={'section-skeleton-short w-[68%] h-3.5'} />
            <Skeleton className={'section-skeleton-details h-40 mt-4'} />
          </>
        ) : variant === 'location' ? (
          <>
            <Skeleton
              className={'section-skeleton-map [aspect-ratio:16_/_9] w-full'}
            />
            <Skeleton className={'section-skeleton-line w-full h-3.5'} />
            <Skeleton className={'section-skeleton-short w-[68%] h-3.5'} />
          </>
        ) : (
          [0, 1].map((i) => (
            <div
              className={
                'section-skeleton-story grid gap-3.5 p-4 [border:1px_solid_var(--social-line)] rounded-[0.875rem]'
              }
              key={i}
            >
              <div
                className={
                  'section-skeleton-byline flex items-center gap-3 [&_>_div:last-child]:[flex:1] [&_>_div:last-child]:grid [&_>_div:last-child]:gap-2'
                }
              >
                <Skeleton
                  className={
                    'section-skeleton-avatar w-10 h-10 rounded-full shrink-0'
                  }
                />
                <div>
                  <Skeleton
                    className={'section-skeleton-heading w-[45%] h-4'}
                  />
                  <Skeleton
                    className={'section-skeleton-short w-[68%] h-3.5'}
                  />
                </div>
              </div>
              <Skeleton className={'section-skeleton-line w-full h-3.5'} />
              <Skeleton className={'section-skeleton-short w-[68%] h-3.5'} />
              <Skeleton
                className={
                  'section-skeleton-photo [aspect-ratio:4_/_3] w-full [.section-skeleton-story_&]:[aspect-ratio:16_/_7]'
                }
              />
            </div>
          ))
        )}
      </div>
    </section>
  )
}
