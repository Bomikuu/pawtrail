import { NavigationScope } from '@/components/layout/navigation-scope'
import { NavigationRegion } from '@/components/layout/navigation-region'
import { QueryTabLink } from '@/components/layout/query-tab-link'
import { SectionLoading } from '@/components/shared/section-loading'
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
    <NavigationScope pathname={path} region={path + ':feed'}>
      <section
        aria-labelledby="pet-feed-heading"
        className={'pet-feed grid gap-4'}
      >
        <div
          className={
            'pet-feed-heading flex flex-wrap items-start justify-between [gap:0.5rem_1rem] [&_h2]:font-[850] [&_h2]:text-xl [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_0.375rem] [&_>_div_>_p]:m-0 [&_>_div_>_p]:text-xs [&_>_div_>_p]:text-muted-foreground [&_>_div_>_p]:max-w-[65ch]'
          }
        >
          <div>
            <h2 id="pet-feed-heading">Around {animal.name}</h2>
            <p>Updates from people caring for and tagging {animal.name}.</p>
          </div>
          <details
            className={
              'pet-feed-policy max-w-[65ch] text-xs text-muted-foreground [&_summary]:min-h-11 [&_summary]:py-2 [&_summary]:text-[color:var(--teal)] [&_summary]:cursor-pointer [&_summary]:[font-weight:650] [&_p]:[margin:0.25rem_0_0]'
            }
          >
            <summary>How this feed works</summary>
            <p>
              Pets don’t post. This timeline brings together published
              sightings, help missions, fundraisers and stories people tag with{' '}
              {animal.name}. Care first places open help requests before
              sightings and care stories, then other tagged posts. Newest orders
              everything by date. Every story retains its human author.
            </p>
          </details>
        </div>
        <div
          className={
            'pet-feed-controls [.dark_.app-shell_&_a[aria-current=page]]:bg-[#193a2c] [.dark_.app-shell_&_a[aria-current=page]]:text-[#b6f0d5] [.dark_.app-shell_&_a[aria-current=page]]:border-[#3e8261] [.dark_.app-shell_&_a:hover]:bg-[#242424] [.dark_.app-shell_&_a:hover]:text-[#ffb27d] [.dark_&_a]:border-[#333333] flex items-center justify-between flex-wrap gap-2.5 [&_nav]:flex [&_nav]:items-center [&_nav]:gap-1.5 [&_nav]:flex-wrap [&_a]:min-h-11 [&_a]:[padding:0.5rem_0.625rem] [&_a]:rounded-lg [&_a]:no-underline [&_a]:text-muted-foreground [&_a]:inline-flex [&_a]:items-center [&_a]:text-[0.6875rem] [&_a]:font-semibold [&_a]:[border:1px_solid_#e5dacb] [&_a:hover]:bg-[#f3ebdc] [&_a:hover]:text-foreground [&_a[aria-current=page]]:bg-[var(--teal)] [&_a[aria-current=page]]:text-[white] [&_a[aria-current=page]]:border-[color:var(--teal)] [&_nav:last-child_a[aria-current=page]]:text-[#81420b] [&_nav:last-child_a[aria-current=page]]:bg-[#ffebce] [&_nav:last-child_a[aria-current=page]]:border-[#d9b484] max-[48rem]:items-start max-[48rem]:[&_nav]:gap-1 max-[48rem]:[&_a]:text-[0.625rem] max-[48rem]:[&_a]:px-2 [@media(forced-colors:_active)]:[&_a[aria-current=page]]:[outline:2px_solid_Highlight]'
          }
        >
          <nav aria-label="Animal activity type">
            {[
              ['all', 'All activity'],
              ['sightings', 'Sightings'],
              ['help', 'Help'],
              ['tagged', 'Tagged stories'],
            ].map(([value, label]) => (
              <QueryTabLink
                retainParams={['kind', 'sort']}
                queryParam="kind"
                value={value}
                defaultValue="all"
                selected={kind === value}
                key={value}
                href={link(value, sort)}
              >
                {label}
              </QueryTabLink>
            ))}
          </nav>
          <nav aria-label="Animal activity order">
            <QueryTabLink
              retainParams={['kind', 'sort']}
              queryParam="sort"
              value="priority"
              defaultValue="priority"
              selected={sort === 'priority'}
              href={link(kind, 'priority')}
            >
              Care first
            </QueryTabLink>
            <QueryTabLink
              retainParams={['kind', 'sort']}
              queryParam="sort"
              value="newest"
              defaultValue="priority"
              selected={sort === 'newest'}
              href={link(kind, 'newest')}
            >
              Newest
            </QueryTabLink>
          </nav>
        </div>
        <NavigationRegion
          region={path + ':feed'}
          fallback={<SectionLoading label="Loading activity…" />}
        >
          {page.items.length ? (
            <ol className={'pet-activity-list list-none m-0 p-0 grid gap-5'}>
              {page.items.map((entry) => (
                <li key={entry.id}>
                  {entry.post ? (
                    <div className="pet-tagged-story">
                      <p
                        className={
                          'pet-context-label flex items-center flex-wrap gap-1 text-muted-foreground text-[0.6875rem] [margin:0.875rem_0_0.625rem] [&_a]:text-[color:var(--teal)] [&_a]:no-underline [&_a]:[font-weight:650] [&_a:hover]:underline [.pet-tagged-story_>_&]:[margin:0_0_0.5rem] [.pet-tagged-story_>_&]:px-1'
                        }
                      >
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
                    <article
                      className={
                        'pet-activity-card [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [border:1px_solid_#e8ddcf] rounded-2xl p-4 bg-card min-w-0 [&_>_header]:flex [&_>_header]:items-start [&_>_header]:gap-2.5 [&_>_header_>_div]:[flex:1] [&_>_header_>_div]:min-w-0 [&_>_header_p]:text-[0.6875rem] [&_>_header_p]:[margin:0.25rem_0_0] [&_>_header_p]:text-muted-foreground [&_h3]:font-[850] [&_h3]:text-lg [&_h3]:leading-[1.35] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3]:[overflow-wrap:anywhere] [&_>_footer]:flex [&_>_footer]:items-center [&_>_footer]:flex-wrap [&_>_footer]:justify-between [&_>_footer]:[gap:0.375rem_1rem] [&_>_footer]:[border-top:1px_solid_#eee5d8] [&_>_footer]:mt-3.5 [&_>_footer]:pt-2 [&_>_footer_a]:inline-flex [&_>_footer_a]:items-center [&_>_footer_a]:gap-1.5 [&_>_footer_a]:min-h-11 [&_>_footer_a]:text-[color:var(--teal)] [&_>_footer_a]:no-underline [&_>_footer_a]:[font-weight:650] [&_>_footer_a]:text-xs [&_>_footer_small]:text-[0.625rem] [&_>_footer_small]:text-muted-foreground [&_>_footer_small]:max-w-[42ch] max-[48rem]:p-3.5 max-[48rem]:[&_>_header_p]:text-[0.625rem]'
                      }
                    >
                      <header>
                        <CommunityAvatar
                          name={entry.author.displayName}
                          image={entry.author.avatar}
                          userId={entry.author.userId}
                        />
                        <div>
                          <div
                            className={
                              'pet-activity-author flex items-center gap-1.5 flex-wrap [&_>_a:not(.rank-crown)]:font-[850] [&_>_a:not(.rank-crown)]:text-[length:0.9375rem] [&_>_a:not(.rank-crown)]:leading-[1.35] [&_>_a:not(.rank-crown)]:font-heading [&_>_a:not(.rank-crown)]:text-foreground [&_>_a:not(.rank-crown)]:no-underline [&_>_a:not(.rank-crown)]:[overflow-wrap:anywhere] [&_>_strong]:font-[850] [&_>_strong]:text-[length:0.9375rem] [&_>_strong]:leading-[1.35] [&_>_strong]:font-heading [&_>_strong]:text-foreground [&_>_strong]:no-underline [&_>_strong]:[overflow-wrap:anywhere] [&_>_a:not(.rank-crown):hover]:underline [&_>_a:not(.rank-crown):hover]:[text-underline-offset:0.2em] max-[48rem]:[&_>_a:not(.rank-crown)]:text-sm max-[48rem]:[&_>_strong]:text-sm'
                            }
                          >
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
                        <span
                          className={
                            'pet-activity-type [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border w-8.5 h-8.5 inline-flex items-center justify-center rounded-full bg-[#ffe9c9] text-[#a34e0d] shrink-0 [&.type-care]:bg-[#dceddf] [&.type-care]:text-[#1b674d] [&.type-mission]:bg-[#dceddf] [&.type-mission]:text-[#1b674d] [&.type-fundraiser]:bg-[#ffe1d6] [&.type-fundraiser]:text-[#943e2c] type-' +
                            entry.kind
                          }
                        >
                          {entry.kind === 'sighting' ? (
                            <MapPin size={18} aria-hidden="true" />
                          ) : entry.kind === 'mission' ||
                            entry.kind === 'care' ? (
                            <HandHeart size={18} aria-hidden="true" />
                          ) : (
                            <Heart size={18} aria-hidden="true" />
                          )}
                          <span className="sr-only">{entry.kind}</span>
                        </span>
                      </header>
                      <p
                        className={
                          'pet-context-label flex items-center flex-wrap gap-1 text-muted-foreground text-[0.6875rem] [margin:0.875rem_0_0.625rem] [&_a]:text-[color:var(--teal)] [&_a]:no-underline [&_a]:[font-weight:650] [&_a:hover]:underline [.pet-tagged-story_>_&]:[margin:0_0_0.5rem] [.pet-tagged-story_>_&]:px-1'
                        }
                      >
                        About <Link href={path}>{animal.name}</Link>
                      </p>
                      <h3>{entry.title}</h3>
                      <p
                        className={
                          'pet-activity-text [margin:0_0_0.875rem] text-sm whitespace-pre-wrap [overflow-wrap:anywhere] max-w-[75ch] max-[48rem]:text-[0.8125rem]'
                        }
                      >
                        {entry.text.length > 800
                          ? entry.text.slice(0, 800) + '…'
                          : entry.text}
                      </p>
                      {entry.media.length > 0 && (
                        <div
                          className={
                            'pet-activity-photos grid grid-cols-1 gap-1.5 [&_>_img]:w-full [&_>_img]:h-auto [&_>_img]:max-h-104 [&_>_img]:[aspect-ratio:4_/_3] [&_>_img]:object-cover [&_>_img]:rounded-xl' +
                            (entry.media.length > 1
                              ? ' has-many [.pet-activity-photos&]:grid-cols-2 max-[48rem]:[.pet-activity-photos&]:grid-cols-1'
                              : '')
                          }
                        >
                          {entry.media.map((image) => (
                            <AnimalImage key={image.id} image={image} />
                          ))}
                        </div>
                      )}
                      {entry.location && (
                        <p
                          className={
                            'pet-activity-location flex flex-wrap items-center gap-1.5 [margin:0.875rem_0_0] text-muted-foreground text-xs [&_span]:text-[0.625rem]'
                          }
                        >
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
            <div
              className={
                'pet-activity-empty [border:1px_solid_#e8ddcf] rounded-2xl [padding:2rem_1rem] text-center [&_>_svg]:text-[color:var(--teal)] [&_h3]:font-[850] [&_h3]:text-xl [&_h3]:leading-[1.3] [&_h3]:font-heading [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:max-w-[55ch] [&_p]:mx-auto'
              }
            >
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
                href={
                  '/sightings/create?animalId=' + encodeURIComponent(animal.id)
                }
                variant="outline"
              >
                Add a sighting
              </ButtonLink>
            </div>
          )}
          {page.nextCursor && (
            <ButtonLink
              className={'pet-feed-next [justify-self:center]'}
              href={link(kind, sort, page.nextCursor)}
              variant="outline"
            >
              Older activity
            </ButtonLink>
          )}
          {filters.cursor && (
            <Link
              className={
                'pet-feed-reset text-[0.8125rem] text-[color:var(--teal)] min-h-11 inline-flex items-center justify-center'
              }
              href={link(kind, sort)}
            >
              Back to latest activity
            </Link>
          )}
        </NavigationRegion>
      </section>
    </NavigationScope>
  )
}
function PawPrintTag() {
  return <MapPin size={14} aria-hidden="true" />
}
