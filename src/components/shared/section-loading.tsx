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
      className={`section-loading section-loading-${variant}`}
      role="status"
      aria-label={label}
    >
      <p className="section-loading-label">
        <PawPrint size={16} aria-hidden="true" />
        {label}
      </p>
      <div className="section-loading-shapes" aria-hidden="true">
        {variant === 'photos' ? (
          Array.from({ length: 6 }, (_, i) => (
            <Skeleton className="section-skeleton-photo" key={i} />
          ))
        ) : variant === 'about' ? (
          <>
            <Skeleton className="section-skeleton-heading" />
            <Skeleton className="section-skeleton-line" />
            <Skeleton className="section-skeleton-line" />
            <Skeleton className="section-skeleton-short" />
            <Skeleton className="section-skeleton-details" />
          </>
        ) : variant === 'location' ? (
          <>
            <Skeleton className="section-skeleton-map" />
            <Skeleton className="section-skeleton-line" />
            <Skeleton className="section-skeleton-short" />
          </>
        ) : (
          [0, 1].map((i) => (
            <div className="section-skeleton-story" key={i}>
              <div className="section-skeleton-byline">
                <Skeleton className="section-skeleton-avatar" />
                <div>
                  <Skeleton className="section-skeleton-heading" />
                  <Skeleton className="section-skeleton-short" />
                </div>
              </div>
              <Skeleton className="section-skeleton-line" />
              <Skeleton className="section-skeleton-short" />
              <Skeleton className="section-skeleton-photo" />
            </div>
          ))
        )}
      </div>
    </section>
  )
}
