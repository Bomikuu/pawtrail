import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, PawPrint } from 'lucide-react'
import { AnimalImage } from './animal-image'
import { CommunityAvatar } from './community-avatar'
import { RankCrown } from '@/features/kibble/rank-crown'
import { findBadge } from '@/features/achievements/catalog'

export function EarnedBadges({
  badges = [],
}: {
  badges?: { id: string; label: string }[]
}) {
  const known = badges
    .flatMap((badge) => {
      const definition = findBadge(badge.id)
      return definition ? [definition] : []
    })
    .slice(0, 3)
  if (!known.length) return null
  return (
    <span className="byline-badges" aria-label="Showcased achievements">
      {known.map((badge) => (
        <Link
          key={badge.id}
          href="/dashboard/achievements"
          title={badge.title}
          aria-label={`Achievement: ${badge.title}`}
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
          <Link
            key={person.id}
            href={`/users/${encodeURIComponent(person.username)}`}
            title={person.displayName}
            aria-label={`View ${person.displayName}’s profile`}
          >
            <CommunityAvatar
              name={person.displayName}
              image={person.avatar}
              userId={person.id}
              small
            />
          </Link>
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
      <Link
        href={`/users/${encodeURIComponent(person.username)}`}
        aria-label={`View ${person.displayName}’s profile`}
      >
        <CommunityAvatar
          name={person.displayName}
          image={person.avatar}
          userId={person.id}
          small
        />
      </Link>
      <div>
        <span className="recognized-author-name">
          <Link href={`/users/${encodeURIComponent(person.username)}`}>
            {person.displayName}
          </Link>
          <RankCrown rank={person.leaderboardRank ?? null} />
          <EarnedBadges badges={person.badges} />
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
