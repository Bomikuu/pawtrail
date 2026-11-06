import { QueryTabLink } from '@/components/layout/query-tab-link'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
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
    <section
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
      aria-labelledby="activity-heading"
    >
      <h2 id="activity-heading">From the community journal</h2>
      {posts.length ? (
        <ol
          className={
            'animal-timeline [&_small]:text-sm [&_small]:text-muted-foreground [&_small]:mt-2 list-none p-0 [&_li]:py-5 [&_li]:[border-bottom:1px_solid_var(--border)] [&_time]:text-sm [&_time]:text-muted-foreground [&_p]:max-w-[70ch] [&_p]:mt-2 [&_p]:[white-space:pre-line] [&_p]:[overflow-wrap:anywhere]'
          }
        >
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
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
      aria-labelledby="sightings-heading"
    >
      <h2 id="sightings-heading">Where the story has been</h2>
      <p>
        Published sightings show approximate areas. The history remains
        available when the map cannot load.
      </p>
      <nav
        aria-label="Sighting time range"
        className={
          'profile-filter-row flex flex-wrap gap-4 my-4 [&_a]:inline-flex [&_a]:items-center [&_a]:min-h-11 [&_a[aria-current]]:font-bold [&_a[aria-current]]:[text-decoration-thickness:2px] [.dark_.app-shell_&_a[aria-current=page]]:bg-[#193a2c] [.dark_.app-shell_&_a[aria-current=page]]:text-[#b6f0d5] [.dark_.app-shell_&_a[aria-current=page]]:border-[#3e8261]'
        }
      >
        {[
          ['week', 'Past week'],
          ['month', 'Past month'],
          ['all', 'All time'],
        ].map(([value, label]) => (
          <QueryTabLink
            queryParam="period"
            value={value}
            defaultValue="all"
            selected={period === value}
            key={value}
            href={`${path}?tab=location&period=${value}#sightings`}
          >
            {label}
          </QueryTabLink>
        ))}
      </nav>
      {sightings.length ? (
        <ol
          className={
            'animal-timeline [&_small]:text-sm [&_small]:text-muted-foreground [&_small]:mt-2 list-none p-0 [&_li]:py-5 [&_li]:[border-bottom:1px_solid_var(--border)] [&_time]:text-sm [&_time]:text-muted-foreground [&_p]:max-w-[70ch] [&_p]:mt-2 [&_p]:[white-space:pre-line] [&_p]:[overflow-wrap:anywhere]'
          }
        >
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
