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
    <span className="byline-badges" aria-label="Showcased achievements">
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
    <div className="participant-line">
      <div className="participant-faces" aria-label={label}>
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
      <Link className="participant-caption" href={href}>
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
    <div className="social-byline">
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
        <span className="recognized-author-name">
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
    <article className="social-activity-card">
      {identity ?? (
        <div className="social-byline">
          <AnimalImage image={image} compact className="resource-avatar" />
          <div>
            <strong>{href ? <Link href={href}>{title}</Link> : title}</strong>
            {meta && <small>{meta}</small>}
          </div>
        </div>
      )}
      {identity && (
        <h3 className="activity-title">
          {href ? <Link href={href}>{title}</Link> : title}
        </h3>
      )}
      {identity && meta && <p className="activity-card-meta">{meta}</p>}
      <div className="activity-content">{children}</div>
      {actions && <footer className="activity-actions">{actions}</footer>}
    </article>
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
    <div className="social-byline">
      <span className="resource-mark">
        <PawPrint size={20} aria-hidden="true" />
      </span>
      <div>
        <strong>{label}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  )
}
