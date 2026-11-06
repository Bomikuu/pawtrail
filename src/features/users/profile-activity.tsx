import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  CalendarDays,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  ArrowUpRight,
} from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { RankCrown } from '@/features/kibble/rank-crown'
import type { PublicProfile } from './types'
export type ProfileTab =
  'overview' | 'stories' | 'sightings' | 'missions' | 'contributions'
export function profileDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}
export function ProfileStories({
  profile,
  preview = false,
}: {
  profile: PublicProfile
  preview?: boolean
}) {
  const stories = preview ? profile.stories.slice(0, 3) : profile.stories
  return (
    <section
      className={
        'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem] profile-stories-section'
      }
      aria-labelledby="user-stories-heading"
    >
      <div
        className={
          'profile-section-title flex flex-wrap items-center justify-between [gap:0.5rem_1rem] pb-2.5 [border-bottom:1px_solid_#ece2d3] mb-3 [&_h2]:m-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:gap-1 [&_>_a]:text-xs [&_>_a]:min-h-11 [&_>_a]:[font-weight:650] [&_>_a]:text-[color:var(--teal)] [&_>_a]:no-underline [&_>_a:hover]:underline [&_>_a:hover]:[text-underline-offset:0.2em]'
        }
      >
        <h2 id="user-stories-heading">
          <PawPrint size={21} aria-hidden="true" /> Stories{' '}
          <span>({profile.summary?.stories ?? 0})</span>
        </h2>
        {preview && stories.length > 0 && (
          <Link href={`?tab=stories#profile-activity`}>
            View all <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
      {stories.length ? (
        <ul
          className={
            'profile-story-list list-none m-0 p-0 [&_>_li]:flex [&_>_li]:gap-3.5 [&_>_li]:[padding:0.875rem_0] [&_>_li_+_li]:[border-top:1px_solid_#ece2d3] [&_>_li:last-child]:pb-0 [&_article]:[flex:1] [&_article]:min-w-0 [&_h3]:font-[800] [&_h3]:text-[length:0.9375rem] [&_h3]:leading-[1.45] [&_h3]:font-heading [&_h3]:[margin:0.375rem_0] [&_h3]:[overflow-wrap:anywhere] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:underline max-[48rem]:[&_>_li]:flex-col max-[48rem]:[&_>_li]:gap-2'
          }
        >
          {stories.map((post) => (
            <li key={post.id}>
              {post.media[0] && (
                <AnimalImage
                  image={post.media[0]}
                  className={
                    'profile-story-photo [.profile-story-list_>_li_>_&]:w-32 [.profile-story-list_>_li_>_&]:h-23 [.profile-story-list_>_li_>_&]:object-cover [.profile-story-list_>_li_>_&]:rounded-[0.625rem] [.profile-story-list_>_li_>_&]:shrink-0 max-[48rem]:[.profile-story-list_>_li_>_&]:w-full max-[48rem]:[.profile-story-list_>_li_>_&]:h-36'
                  }
                />
              )}
              <article>
                <div
                  className={
                    'profile-story-meta flex items-center flex-wrap [gap:0.375rem_0.5rem] text-muted-foreground text-[0.6875rem] [&_>_span]:font-semibold [&_time]:ml-auto'
                  }
                >
                  <span>{post.author.displayName}</span>
                  <RankCrown rank={post.author.leaderboardRank} />
                  <time dateTime={post.createdAt}>
                    {profileDate(post.createdAt)}
                  </time>
                </div>
                <h3>
                  <Link
                    className={
                      'story-summary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] overflow-hidden'
                    }
                    href={'/community/' + encodeURIComponent(post.id)}
                  >
                    {post.text}
                  </Link>
                </h3>
                <div
                  className={
                    'profile-story-footer flex items-center justify-between gap-2 flex-wrap text-xs [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:text-[color:var(--teal)] [&_a]:no-underline [&_a]:min-h-11 [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-1.5 [&_>_span]:text-muted-foreground [&_>_span]:tabular-nums [&_>_span_>_svg:first-child]:text-[#ae3e2d] [&_>_span_>_svg:nth-of-type(2)]:ml-2'
                  }
                >
                  <Link href={'/community/' + encodeURIComponent(post.id)}>
                    Read story <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                  <span>
                    <Heart size={16} aria-hidden="true" />
                    {post.reactionCount}
                    <span className="sr-only"> reactions</span>
                    <MessageCircle size={16} aria-hidden="true" />
                    {post.commentCount}
                    <span className="sr-only"> comments</span>
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={
            'profile-empty-copy text-muted-foreground text-[0.8125rem] [margin:0.5rem_0]'
          }
        >
          No public stories shared yet.
        </p>
      )}
    </section>
  )
}
export function ProfileActivity({
  profile,
  tab,
}: {
  profile: PublicProfile
  tab: Exclude<ProfileTab, 'overview' | 'stories'>
}) {
  const kind =
    tab === 'sightings' ? 'sighting' : tab === 'missions' ? 'mission' : null
  const entries = (profile.activities ?? []).filter(
    (entry) => !kind || entry.kind === kind,
  )
  const title =
    tab === 'sightings'
      ? 'Published sightings'
      : tab === 'missions'
        ? 'Approved missions'
        : 'Recorded contributions'
  return (
    <section
      className={
        'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem]'
      }
      aria-labelledby="profile-activity-heading"
    >
      <div
        className={
          'profile-section-title flex flex-wrap items-center justify-between [gap:0.5rem_1rem] pb-2.5 [border-bottom:1px_solid_#ece2d3] mb-3 [&_h2]:m-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:gap-1 [&_>_a]:text-xs [&_>_a]:min-h-11 [&_>_a]:[font-weight:650] [&_>_a]:text-[color:var(--teal)] [&_>_a]:no-underline [&_>_a:hover]:underline [&_>_a:hover]:[text-underline-offset:0.2em]'
        }
      >
        <h2 id="profile-activity-heading">
          {tab === 'sightings' ? (
            <MapPin size={21} aria-hidden="true" />
          ) : tab === 'missions' ? (
            <Check size={21} aria-hidden="true" />
          ) : (
            <Heart size={21} aria-hidden="true" />
          )}
          {title}
        </h2>
      </div>
      {tab === 'contributions' && (
        <p
          className={
            'profile-activity-explanation text-xs text-muted-foreground max-w-[70ch]'
          }
        >
          Public sightings, independently approved missions and distinct
          fundraisers supported. Stories have their own tab.
        </p>
      )}
      {entries.length ? (
        <ol
          className={
            'profile-activity-list list-none m-0 p-0 [&_>_li]:grid [&_>_li]:grid-cols-[2.5rem_minmax(0,_1fr)_auto] [&_>_li]:items-start [&_>_li]:gap-3 [&_>_li]:[padding:1rem_0] [&_>_li_+_li]:[border-top:1px_solid_#ece2d3] [&_h3]:font-[800] [&_h3]:text-[length:0.9375rem] [&_h3]:leading-[1.4] [&_h3]:font-heading [&_h3]:[margin:0.25rem_0] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:underline [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere] [&_p]:max-w-[70ch] [&_p]:m-0 [&_p]:text-muted-foreground [&_p]:text-[0.8125rem] [&_time]:flex [&_time]:items-center [&_time]:gap-1 [&_time]:text-muted-foreground [&_time]:text-[0.6875rem] [&_time]:pt-1 [&_time]:whitespace-nowrap max-[76rem]:[&_>_li]:grid-cols-[2.5rem_minmax(0,_1fr)] max-[76rem]:[&_time]:[grid-column:2]'
          }
        >
          {entries.map((entry) => (
            <li key={entry.kind + ':' + entry.id}>
              <span
                className={
                  'profile-activity-icon grid [place-items:center] w-10 h-10 rounded-full bg-[#ffedd1] text-[#a84e0b] [&.activity-mission]:bg-[#daeee4] [&.activity-mission]:text-[#165f4a] [&.activity-fundraiser]:bg-[#ffe0d6] [&.activity-fundraiser]:text-[#9c3e2c] activity-' +
                  entry.kind
                }
              >
                {entry.kind === 'sighting' ? (
                  <MapPin size={20} aria-hidden="true" />
                ) : entry.kind === 'mission' ? (
                  <Check size={20} aria-hidden="true" />
                ) : (
                  <Heart size={20} aria-hidden="true" />
                )}
              </span>
              <div>
                <span
                  className={
                    'profile-activity-kind text-[0.6875rem] [font-weight:650] text-muted-foreground'
                  }
                >
                  {entry.kind === 'sighting'
                    ? 'Published sighting'
                    : entry.kind === 'mission'
                      ? 'Approved mission'
                      : 'Fundraiser supported'}
                </span>
                <h3>
                  <Link href={entry.href}>{entry.title}</Link>
                </h3>
                <p>{entry.description}</p>
              </div>
              <time dateTime={entry.createdAt}>
                <CalendarDays size={14} aria-hidden="true" />
                {profileDate(entry.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p
          className={
            'profile-empty-copy text-muted-foreground text-[0.8125rem] [margin:0.5rem_0]'
          }
        >
          {profile.activities === null
            ? 'Activity details are currently unavailable.'
            : 'No ' + title.toLowerCase() + ' to show yet.'}
        </p>
      )}
    </section>
  )
}
