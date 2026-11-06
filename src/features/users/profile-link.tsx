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
          className={`profile-preview-trigger [@media(hover:_hover)]:[&:hover]:underline [@media(hover:_hover)]:[&:hover]:[text-underline-offset:0.2em] relative [text-underline-offset:0.2em] [.post-heading_>_&]:inline-flex [.post-heading_>_&]:[flex:0_0_auto] [&:focus-visible]:[outline:2px_solid_var(--teal)] [&:focus-visible]:[outline-offset:3px] [&:focus-visible]:rounded-[0.375rem] ${props.className ?? ''}`}
          aria-describedby={open ? id : props['aria-describedby']}
        >
          {children}
        </NavigationLink>
      </HoverCardTrigger>
      <HoverCardContent
        className={
          'profile-preview [font:400_0.875rem/1.5_var(--font-body,_sans-serif)] w-80 max-w-[calc(100vw-1.5rem)] max-h-[min(34rem,var(--radix-hover-card-content-available-height))] overflow-y-auto'
        }
        id={id}
        role="tooltip"
        onEscapeKeyDown={() => setOpen(false)}
      >
        {pending || profile.isPending ? (
          <AnimalLoader label="Getting to know this PawPal…" />
        ) : profile.isError || !person ? (
          <div
            className={
              'profile-preview-unavailable flex flex-col items-center text-center p-6 gap-2 [&_p]:m-0 [&_p]:text-muted-foreground'
            }
          >
            <PawPrint size={28} aria-hidden="true" />
            <strong>Profile preview unavailable</strong>
            <p>Select the name to open the profile and try again.</p>
          </div>
        ) : (
          <>
            <div
              className={
                'profile-preview-cover h-23 overflow-hidden bg-[#eef3e2] [&_img]:w-full [&_img]:h-full [&_img]:object-cover'
              }
            >
              <ProfileBanner id={person.bannerId} preview />
            </div>
            <div className={'profile-preview-body [padding:0_1rem_1rem]'}>
              <CommunityAvatar
                name={person.displayName}
                image={person.avatar}
                userId={person.id}
                large
              />
              <div
                className={
                  'profile-preview-name flex flex-wrap items-center gap-2 mt-1.5 [&_>_strong]:font-[850] [&_>_strong]:text-xl [&_>_strong]:leading-[1.25] [&_>_strong]:font-heading'
                }
              >
                <strong>{person.displayName}</strong>
                {person.leaderboardRank && (
                  <span
                    className={
                      'profile-preview-rank inline-flex items-center gap-1 [padding:0.25rem_0.375rem] bg-[#fff0ca] rounded-[0.375rem] text-xs font-bold'
                    }
                    aria-label={`All-time Top 10 PawPal, rank ${person.leaderboardRank}`}
                  >
                    <Crown size={14} aria-hidden="true" />#
                    {person.leaderboardRank}
                  </span>
                )}
              </div>
              <span
                className={
                  'profile-preview-handle text-muted-foreground text-xs [.dark_&]:text-muted-foreground'
                }
              >
                @{person.username}
                {person.level !== null && ` · Level ${person.level}`}
              </span>
              <p
                className={
                  'profile-preview-bio [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden [margin:0.75rem_0] [overflow-wrap:anywhere]'
                }
              >
                {person.bio || 'This PawPal hasn’t added a bio yet.'}
              </p>
              {person.location && (
                <p
                  className={
                    'profile-preview-location text-muted-foreground text-xs flex items-center gap-1.5 [.dark_&]:text-muted-foreground'
                  }
                >
                  <MapPin size={14} aria-hidden="true" />
                  {person.location.neighborhood}
                </p>
              )}
              {person.summary ? (
                <dl
                  className={
                    'profile-preview-stats flex gap-4 pt-3 [border-top:1px_solid_var(--social-line)] [margin:0.75rem_0] [&_>_div]:flex [&_>_div]:flex-col-reverse [&_dt]:text-[0.6875rem] [&_dt]:text-muted-foreground [&_dd]:font-[850] [&_dd]:text-lg [&_dd]:leading-[1.3] [&_dd]:font-heading [&_dd]:m-0'
                  }
                >
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
                <p
                  className={
                    'profile-preview-private text-muted-foreground text-xs'
                  }
                >
                  Contribution details aren’t shared.
                </p>
              )}
              {!!person.badges.length && (
                <div
                  className={
                    'profile-preview-badges flex gap-1.5 mb-2 [&_img]:object-contain'
                  }
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
                <small
                  className={
                    'profile-preview-sample text-muted-foreground text-xs block my-2.5'
                  }
                >
                  Illustrative sample profile
                </small>
              )}
              <span
                className={
                  'profile-preview-footnote flex items-center gap-1 text-[0.6875rem] text-[color:var(--teal)]'
                }
              >
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
