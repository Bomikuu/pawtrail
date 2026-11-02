import Link from 'next/link'
import type { Sighting } from '@/features/sightings/types'
import type { Post } from '@/features/community/types'
import { READY_ROUTES } from '@/components/layout/navigation'
import { isRouteReady } from '@/lib/route-readiness'
export const profileDate = (value: string) =>
  new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
export function ActivityTimeline({ posts }: { posts: Post[] }) {
  return (
    <section className="profile-section" aria-labelledby="activity-heading">
      <h2 id="activity-heading">From the community journal</h2>
      {posts.length ? (
        <ol className="animal-timeline">
          {posts.map((post) => (
            <li key={post.id}>
              <time dateTime={post.createdAt}>
                {profileDate(post.createdAt)}
              </time>
              <p>{post.text}</p>
              <small>{post.provenance.label}</small>
              {isRouteReady(
                `/community/${encodeURIComponent(post.id)}`,
                READY_ROUTES,
              ) && (
                <Link href={`/community/${encodeURIComponent(post.id)}`}>
                  Read this story
                </Link>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p>No public stories yet.</p>
      )}
    </section>
  )
}
export function SightingHistory({
  sightings,
  slug,
  period,
  nextCursor,
}: {
  sightings: Sighting[]
  slug: string
  period: string
  nextCursor: string | null
}) {
  const path = `/pets/${encodeURIComponent(slug)}`
  return (
    <section
      id="sightings"
      className="profile-section"
      aria-labelledby="sightings-heading"
    >
      <h2 id="sightings-heading">Where the story has been</h2>
      <p>
        Published sightings show approximate areas. The history remains
        available when the map cannot load.
      </p>
      <nav aria-label="Sighting time range" className="profile-filter-row">
        {[
          ['week', 'Past week'],
          ['month', 'Past month'],
          ['all', 'All time'],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`${path}?tab=location&period=${value}#sightings`}
            aria-current={period === value ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {sightings.length ? (
        <ol className="animal-timeline">
          {sightings.map((sighting) => (
            <li key={sighting.id}>
              <time dateTime={sighting.observedAt}>
                {profileDate(sighting.observedAt)}
              </time>
              <h3>{sighting.location.neighborhood}</h3>
              <p>{sighting.observation}</p>
              <small>{sighting.provenance.label}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>No public sightings in this time range. Try All time.</p>
      )}
      {nextCursor && (
        <Link
          href={`${path}?tab=location&period=${period}&sightingCursor=${encodeURIComponent(nextCursor)}#sightings`}
        >
          Older sightings
        </Link>
      )}
    </section>
  )
}
