import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowRight, PawPrint } from 'lucide-react'
import { AnimalImage } from './animal-image'
import { CommunityAvatar } from './community-avatar'
import { RankCrown } from '@/features/kibble/rank-crown'
import { findBadge } from '@/features/achievements/catalog'
import { ProfileLink } from '@/features/users/profile-link'

export function EarnedBadges({
  badges = [],
  username,
}: {
  badges?: { id: string; label: string }[]
  username?: string | null
}) {
  const known = badges
    .flatMap((badge) => {
      const definition = findBadge(badge.id)
      return definition ? [definition] : []
    })
    .slice(0, 3)
  if (!known.length || !username) return null
  return (
    <span
      className={
        'byline-badges inline-flex items-center gap-[0.0625rem] [vertical-align:middle] [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:w-9 [&_a]:min-h-11 [&_a]:rounded-full [&_img]:block [&_img]:w-6 [&_img]:h-6 [&_img]:object-contain [&_a:hover]:bg-[#fff0df] [.post-author-meta_&]:gap-0 [.management-shell_.workflow-panel_&]:hidden [.management-shell_.social-activity-card_&]:hidden max-[48rem]:[.post-author-meta_&_a]:w-8 max-[48rem]:[.post-author-meta_&_img]:w-5.5 max-[48rem]:[.post-author-meta_&_img]:h-5.5'
      }
      aria-label="Showcased achievements"
    >
      {known.map((badge) => (
        <Link
          key={badge.id}
          href={`/users/${encodeURIComponent(username)}?badge=${encodeURIComponent(badge.id)}#badge-${encodeURIComponent(badge.id)}`}
          title={badge.title}
          aria-label={`Showcased achievement: ${badge.title}. View how it is earned.`}
        >
          <img src={badge.image} alt="" width={30} height={30} loading="lazy" />
        </Link>
      ))}
    </span>
  )
}

export type SocialPerson = {
  id: string
  displayName: string
  username: string
  avatar?: { url: string; alt: string; sensitive?: boolean } | null
}
export function ParticipantFaces({
  people,
  count = people.length,
  href,
  label = 'In this conversation',
}: {
  people: SocialPerson[]
  count?: number
  href: string
  label?: string
}) {
  const unique = [...new Map(people.map((p) => [p.id, p])).values()].slice(0, 4)
  if (!unique.length) return null
  return (
    <div
      className={
        'participant-line flex items-center flex-wrap [gap:0.5rem_0.75rem] [padding:0.625rem_0] min-w-0'
      }
    >
      <div
        className={
          'participant-faces flex items-center pl-1 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:w-11 [&_a]:h-11 [&_a]:ml-[-0.25rem] [&_a]:rounded-full [&_a]:bg-card [&_a:focus-visible]:relative [&_a:focus-visible]:[z-index:2]'
        }
        aria-label={label}
      >
        {unique.map((person) => (
          <ProfileLink
            key={person.id}
            username={person.username}
            title={person.displayName}
            aria-label={`View ${person.displayName}’s profile`}
          >
            <CommunityAvatar
              name={person.displayName}
              image={person.avatar}
              userId={person.id}
              small
            />
          </ProfileLink>
        ))}
      </div>
      <Link
        className={
          'participant-caption inline-flex items-center gap-1.5 text-xs text-[color:var(--teal)] min-h-11'
        }
        href={href}
      >
        {count > unique.length ? `+${count - unique.length} · ` : ''}
        {label}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

export function PersonByline({
  person,
  meta,
}: {
  person: SocialPerson & {
    leaderboardRank?: number | null
    badges?: { id: string; label: string }[]
  }
  meta?: string
}) {
  return (
    <div
      className={
        'social-byline [.journal-card-body_>_&]:pt-4 [.journal-card-body_>_&]:mt-2 [.journal-card-body_>_&]:[border-top:1px_solid_var(--social-line)] [.journal-card-body_>_&]:w-full flex items-center gap-3 min-w-0 [&_>_a]:shrink-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:justify-center [&_>_a]:min-w-11 [&_>_a]:min-h-11 [&_>_a]:rounded-full [&_>_div:last-child]:min-w-0 [&_strong]:text-[length:0.9375rem] [&_strong]:[line-height:1.35] [&_strong]:text-foreground [&_a]:text-[inherit] [&_a]:[text-underline-offset:0.2em] [&_small]:block [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:mt-1 [.app-shell_.journal-card-body_>_&]:pt-2.5 [.app-shell_.journal-card-body_>_&]:mt-1 [.management-shell_.workflow-panel_&]:mb-2.5 [.care-spotlights_&_a]:no-underline'
      }
    >
      <ProfileLink
        username={person.username}
        aria-label={`View ${person.displayName}’s profile`}
      >
        <CommunityAvatar
          name={person.displayName}
          image={person.avatar}
          userId={person.id}
          small
        />
      </ProfileLink>
      <div>
        <span
          className={
            'recognized-author-name [.post-author_&]:flex [.post-author_&]:flex-wrap [.post-author_&]:items-center [.post-author_&]:gap-1.5 [.discussion-byline_&]:flex [.discussion-byline_&]:flex-wrap [.discussion-byline_&]:items-center [.discussion-byline_&]:gap-1.5 [.post-author_&_>_a:not(.rank-crown)]:[overflow-wrap:anywhere] max-[48rem]:[.discussion-byline_&]:min-w-0 [.app-shell_&]:flex [.app-shell_&]:flex-wrap [.app-shell_&]:items-center [.app-shell_&]:[gap:0.25rem_0.375rem] max-[48rem]:[.app-shell_.post-heading_&]:text-sm'
          }
        >
          <ProfileLink username={person.username}>
            {person.displayName}
          </ProfileLink>
          <RankCrown rank={person.leaderboardRank ?? null} />
          <EarnedBadges badges={person.badges} username={person.username} />
        </span>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  )
}

export function ActivityCard({
  title,
  href,
  meta,
  identity,
  image,
  children,
  actions,
}: {
  title: string
  href?: string
  meta?: string
  identity?: ReactNode
  image?: { url: string; alt: string; sensitive?: boolean } | null
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Card
      role="article"
      className={
        'social-activity-card gap-0 shadow-none [.app-shell_&]:min-w-0 [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:[overflow-wrap:anywhere] [.app-shell_&]:p-5 [.app-shell_&]:[margin:0_0_1rem] max-[48rem]:[.app-shell_&]:p-4 [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none]'
      }
    >
      {identity ?? (
        <div
          className={
            'social-byline [.journal-card-body_>_&]:pt-4 [.journal-card-body_>_&]:mt-2 [.journal-card-body_>_&]:[border-top:1px_solid_var(--social-line)] [.journal-card-body_>_&]:w-full flex items-center gap-3 min-w-0 [&_>_a]:shrink-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:justify-center [&_>_a]:min-w-11 [&_>_a]:min-h-11 [&_>_a]:rounded-full [&_>_div:last-child]:min-w-0 [&_strong]:text-[length:0.9375rem] [&_strong]:[line-height:1.35] [&_strong]:text-foreground [&_a]:text-[inherit] [&_a]:[text-underline-offset:0.2em] [&_small]:block [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:mt-1 [.app-shell_.journal-card-body_>_&]:pt-2.5 [.app-shell_.journal-card-body_>_&]:mt-1 [.management-shell_.workflow-panel_&]:mb-2.5 [.care-spotlights_&_a]:no-underline'
          }
        >
          <AnimalImage
            image={image}
            compact
            className={
              'resource-avatar [flex:0_0_2.75rem] w-11 h-11 rounded-full object-cover bg-[#fff0df] text-[#96501f] [.animal-image-fallback&]:grid [.animal-image-fallback&]:[place-items:center] [.resource-hero_&]:w-15 [.resource-hero_&]:h-15 [.resource-hero_&]:[flex-basis:3.75rem] max-[48rem]:[.resource-hero_&]:w-11 max-[48rem]:[.resource-hero_&]:h-11 max-[48rem]:[.resource-hero_&]:[flex-basis:2.75rem]'
            }
          />
          <div>
            <strong>{href ? <Link href={href}>{title}</Link> : title}</strong>
            {meta && <small>{meta}</small>}
          </div>
        </div>
      )}
      {identity && (
        <h3
          className={
            'activity-title [.social-activity-card_&]:font-[800] [.social-activity-card_&]:text-lg [.social-activity-card_&]:leading-[1.35] [.social-activity-card_&]:font-heading [.social-activity-card_&]:[margin:1rem_0_0.5rem] [@media(hover:_hover)]:[&_a:hover]:underline [@media(hover:_hover)]:[&_a:hover]:[text-underline-offset:0.2em]'
          }
        >
          {href ? <Link href={href}>{title}</Link> : title}
        </h3>
      )}
      {identity && meta && (
        <p
          className={
            'activity-card-meta [margin:0.5rem_0_0] text-[0.8125rem] text-muted-foreground'
          }
        >
          {meta}
        </p>
      )}
      <div
        className={
          'activity-content mt-3.5 min-w-0 [&_>_p]:[margin:0.625rem_0] [&_>_p]:max-w-[75ch] [&:empty]:hidden'
        }
      >
        {children}
      </div>
      {actions && (
        <footer
          className={
            'activity-actions flex flex-wrap items-center gap-3 pt-4 mt-4 [border-top:1px_solid_var(--social-line)]'
          }
        >
          {actions}
        </footer>
      )}
    </Card>
  )
}

export function UnavailableIdentity({
  label = 'Community activity',
  meta,
}: {
  label?: string
  meta?: string
}) {
  return (
    <div
      className={
        'social-byline [.journal-card-body_>_&]:pt-4 [.journal-card-body_>_&]:mt-2 [.journal-card-body_>_&]:[border-top:1px_solid_var(--social-line)] [.journal-card-body_>_&]:w-full flex items-center gap-3 min-w-0 [&_>_a]:shrink-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:justify-center [&_>_a]:min-w-11 [&_>_a]:min-h-11 [&_>_a]:rounded-full [&_>_div:last-child]:min-w-0 [&_strong]:text-[length:0.9375rem] [&_strong]:[line-height:1.35] [&_strong]:text-foreground [&_a]:text-[inherit] [&_a]:[text-underline-offset:0.2em] [&_small]:block [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:mt-1 [.app-shell_.journal-card-body_>_&]:pt-2.5 [.app-shell_.journal-card-body_>_&]:mt-1 [.management-shell_.workflow-panel_&]:mb-2.5 [.care-spotlights_&_a]:no-underline'
      }
    >
      <span
        className={
          'resource-mark [flex:0_0_2.75rem] w-11 h-11 rounded-full object-cover bg-[#fff0df] text-[#96501f] grid [place-items:center]'
        }
      >
        <PawPrint size={20} aria-hidden="true" />
      </span>
      <div>
        <strong>{label}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  )
}
