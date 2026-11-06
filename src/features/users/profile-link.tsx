'use client'
import type Link from 'next/link'
import { NavigationLink } from '@/components/layout/navigation-link'
import { useId, useState, type ComponentProps } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, PawPrint, Crown, ArrowUpRight } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { AnimalLoader } from '@/components/shared/animal-loader'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { useSession } from '@/features/auth/session-provider'
import { ProfileBanner } from './profile-banner'
import { findBadge } from '@/features/achievements/catalog'

export function ProfileLink({
  username,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'href'> & { username: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const { session, pending } = useSession()
  const profile = useQuery({
    queryKey: [
      ...queryKeys(session.cacheScope).all('users'),
      'preview',
      username,
    ],
    queryFn: ({ signal }) =>
      getBrowserApi().users.preview(username, { signal }),
    enabled: open && !pending,
    staleTime: 30_000,
    gcTime: 120_000,
    retry: false,
  })
  const person = profile.data
  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={280}
      closeDelay={140}
    >
      <HoverCardTrigger asChild>
        <NavigationLink
          {...props}
          prefetch={false}
          title={undefined}
          onNavigate={(event) => {
            props.onNavigate?.(event)
            setOpen(false)
          }}
          href={`/users/${encodeURIComponent(username)}`}
          className={`profile-preview-trigger ${props.className ?? ''}`}
          aria-describedby={open ? id : props['aria-describedby']}
        >
          {children}
        </NavigationLink>
      </HoverCardTrigger>
      <HoverCardContent
        className="profile-preview"
        id={id}
        role="tooltip"
        onEscapeKeyDown={() => setOpen(false)}
      >
        {pending || profile.isPending ? (
          <AnimalLoader label="Getting to know this PawPal…" />
        ) : profile.isError || !person ? (
          <div className="profile-preview-unavailable">
            <PawPrint size={28} aria-hidden="true" />
            <strong>Profile preview unavailable</strong>
            <p>Select the name to open the profile and try again.</p>
          </div>
        ) : (
          <>
            <div className="profile-preview-cover">
              <ProfileBanner id={person.bannerId} preview />
            </div>
            <div className="profile-preview-body">
              <CommunityAvatar
                name={person.displayName}
                image={person.avatar}
                userId={person.id}
                large
              />
              <div className="profile-preview-name">
                <strong>{person.displayName}</strong>
                {person.leaderboardRank && (
                  <span
                    className="profile-preview-rank"
                    aria-label={`All-time Top 10 PawPal, rank ${person.leaderboardRank}`}
                  >
                    <Crown size={14} aria-hidden="true" />#
                    {person.leaderboardRank}
                  </span>
                )}
              </div>
              <span className="profile-preview-handle">
                @{person.username}
                {person.level !== null && ` · Level ${person.level}`}
              </span>
              <p className="profile-preview-bio">
                {person.bio || 'This PawPal hasn’t added a bio yet.'}
              </p>
              {person.location && (
                <p className="profile-preview-location">
                  <MapPin size={14} aria-hidden="true" />
                  {person.location.neighborhood}
                </p>
              )}
              {person.summary ? (
                <dl className="profile-preview-stats">
                  <div>
                    <dt>Sightings</dt>
                    <dd>{person.summary.sightings.toLocaleString('en-PH')}</dd>
                  </div>
                  <div>
                    <dt>Approved help</dt>
                    <dd>{person.summary.missions.toLocaleString('en-PH')}</dd>
                  </div>
                  <div>
                    <dt>Stories</dt>
                    <dd>{person.summary.stories.toLocaleString('en-PH')}</dd>
                  </div>
                </dl>
              ) : (
                <p className="profile-preview-private">
                  Contribution details aren’t shared.
                </p>
              )}
              {!!person.badges.length && (
                <div
                  className="profile-preview-badges"
                  aria-label="Showcased achievements"
                >
                  {person.badges.slice(0, 4).map((badge) => {
                    const definition = findBadge(badge.id)
                    return definition ? (
                      <img
                        key={badge.id}
                        src={definition.image}
                        width={32}
                        height={32}
                        alt={definition.title}
                      />
                    ) : null
                  })}
                </div>
              )}
              {person.provenance.kind !== 'real' && (
                <small className="profile-preview-sample">
                  Illustrative sample profile
                </small>
              )}
              <span className="profile-preview-footnote">
                Select the name to view the full profile{' '}
                <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
