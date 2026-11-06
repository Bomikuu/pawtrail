import { ProfileLink } from '@/features/users/profile-link'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowUpRight, HandHeart, Heart, MapPin } from 'lucide-react'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { AnimalImage } from '@/components/shared/animal-image'
import { RankCrown } from '@/features/kibble/rank-crown'
import { AnimalTaggedPost } from './tagged-post'
import { ButtonLink } from '@/components/ui/button-link'
import { profileDate } from './activity-timeline'
import type { AnimalProfile } from './types'
import type {
  AnimalActivityPage,
  AnimalActivityFilters,
} from './activity-schemas'
export function AnimalActivityFeed({
  animal,
  page,
  filters,
  scope,
}: {
  animal: AnimalProfile
  page: AnimalActivityPage
  filters: AnimalActivityFilters
  scope: string
}) {
  const path = '/pets/' + encodeURIComponent(animal.slug)
  const link = (kind: string, sort: string, cursor?: string | null) =>
    path +
    '?' +
    new URLSearchParams({
      tab: 'activity',
      kind,
      sort,
      ...(cursor ? { cursor } : {}),
    }).toString() +
    '#pet-activity'
  const kind = filters.kind ?? 'all',
    sort = filters.sort ?? 'priority'
  const option = {
    ref: { kind: 'animal' as const, id: animal.id },
    title: animal.name,
    href: path,
  }
  return (
    <section aria-labelledby="pet-feed-heading" className="pet-feed">
      <div className="pet-feed-heading">
        <div>
          <h2 id="pet-feed-heading">Around {animal.name}</h2>
          <p>Updates from people caring for and tagging {animal.name}.</p>
        </div>
        <details className="pet-feed-policy">
          <summary>How this feed works</summary>
          <p>
            Pets don’t post. This timeline brings together published sightings,
            help missions, fundraisers and stories people tag with {animal.name}
            . Care first places open help requests before sightings and care
            stories, then other tagged posts. Newest orders everything by date.
            Every story retains its human author.
          </p>
        </details>
      </div>
      <div className="pet-feed-controls">
        <nav aria-label="Animal activity type">
          {[
            ['all', 'All activity'],
            ['sightings', 'Sightings'],
            ['help', 'Help'],
            ['tagged', 'Tagged stories'],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={link(value, sort)}
              aria-current={kind === value ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Animal activity order">
          <Link
            href={link(kind, 'priority')}
            aria-current={sort === 'priority' ? 'page' : undefined}
          >
            Care first
          </Link>
          <Link
            href={link(kind, 'newest')}
            aria-current={sort === 'newest' ? 'page' : undefined}
          >
            Newest
          </Link>
        </nav>
      </div>
      {page.items.length ? (
        <ol className="pet-activity-list">
          {page.items.map((entry) => (
            <li key={entry.id}>
              {entry.post ? (
                <div className="pet-tagged-story">
                  <p className="pet-context-label">
                    <PawPrintTag />
                    {entry.priority === 1
                      ? 'Care story about '
                      : 'Tagged in a story about '}
                    <Link href={path}>{animal.name}</Link>
                  </p>
                  <AnimalTaggedPost
                    post={entry.post}
                    scope={scope}
                    options={[option]}
                  />
                </div>
              ) : (
                <article className="pet-activity-card">
                  <header>
                    <CommunityAvatar
                      name={entry.author.displayName}
                      image={entry.author.avatar}
                      userId={entry.author.userId}
                    />
                    <div>
                      <div className="pet-activity-author">
                        {entry.author.username ? (
                          <ProfileLink username={entry.author.username}>
                            {entry.author.displayName}
                          </ProfileLink>
                        ) : (
                          <strong>{entry.author.displayName}</strong>
                        )}
                        <RankCrown rank={entry.author.leaderboardRank} />
                      </div>
                      <p>
                        <time dateTime={entry.createdAt}>
                          {profileDate(entry.createdAt)}
                        </time>
                        <span aria-hidden="true"> · </span>
                        {entry.label}
                      </p>
                    </div>
                    <span className={'pet-activity-type type-' + entry.kind}>
                      {entry.kind === 'sighting' ? (
                        <MapPin size={18} aria-hidden="true" />
                      ) : entry.kind === 'mission' || entry.kind === 'care' ? (
                        <HandHeart size={18} aria-hidden="true" />
                      ) : (
                        <Heart size={18} aria-hidden="true" />
                      )}
                      <span className="sr-only">{entry.kind}</span>
                    </span>
                  </header>
                  <p className="pet-context-label">
                    About <Link href={path}>{animal.name}</Link>
                  </p>
                  <h3>{entry.title}</h3>
                  <p className="pet-activity-text">
                    {entry.text.length > 800
                      ? entry.text.slice(0, 800) + '…'
                      : entry.text}
                  </p>
                  {entry.media.length > 0 && (
                    <div
                      className={
                        'pet-activity-photos' +
                        (entry.media.length > 1 ? ' has-many' : '')
                      }
                    >
                      {entry.media.map((image) => (
                        <AnimalImage key={image.id} image={image} />
                      ))}
                    </div>
                  )}
                  {entry.location && (
                    <p className="pet-activity-location">
                      <MapPin size={15} aria-hidden="true" />
                      {entry.location.neighborhood}
                      <span>Approximate area</span>
                    </p>
                  )}
                  <footer>
                    <Link href={entry.href}>
                      {entry.kind === 'sighting'
                        ? 'View sighting history'
                        : entry.kind === 'mission' || entry.kind === 'care'
                          ? 'View help mission'
                          : 'View fundraiser'}{' '}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </Link>
                    <small>{entry.provenance.label}</small>
                  </footer>
                </article>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className="pet-activity-empty">
          <HandHeart size={30} aria-hidden="true" />
          <h3>
            No{' '}
            {kind === 'all'
              ? 'public activity'
              : kind === 'tagged'
                ? 'tagged stories'
                : kind}{' '}
            yet
          </h3>
          <p>
            Neighbors can add a sighting or tag {animal.name} in a community
            story.
          </p>
          <ButtonLink
            href={'/sightings/create?animalId=' + encodeURIComponent(animal.id)}
            variant="outline"
          >
            Add a sighting
          </ButtonLink>
        </div>
      )}
      {page.nextCursor && (
        <ButtonLink
          className="pet-feed-next"
          href={link(kind, sort, page.nextCursor)}
          variant="outline"
        >
          Older activity
        </ButtonLink>
      )}
      {filters.cursor && (
        <Link className="pet-feed-reset" href={link(kind, sort)}>
          Back to latest activity
        </Link>
      )}
    </section>
  )
}
function PawPrintTag() {
  return <MapPin size={14} aria-hidden="true" />
}
