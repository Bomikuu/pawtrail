'use client'
import { useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { DataState } from '@/components/shared/data-state'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import type { Page } from '@/types/common'
import type { GeoArea } from '@/features/discovery/types'
import type { AnimalSummary } from '@/features/animals/types'
import { CommunityLayout } from './community-layout'
import { CommunityRail } from './community-rail'
import { FeedLoading } from './feed-loading'
import { PostCard } from './post-card'
import { PostComposer } from './post-composer'
import { deduplicatePosts, useFeed } from './queries'
import type { LinkedOption } from './linked-entity-picker'
import type { Post, PostFilters } from './types'
export function Feed({
  initial,
  scope,
  options,
  areas,
  animals,
}: {
  initial: Page<Post>
  scope: string
  options: LinkedOption[]
  areas: GeoArea[]
  animals: AnimalSummary[]
}) {
  const { session } = useSession()
  const [tab, setTab] = useState<NonNullable<PostFilters['tab']>>('for_you')
  const [areaId, setAreaId] = useState<string>()
  const [saved, setSaved] = useState(false)
  const needsLogin = (tab === 'following' || saved) && !session.actor
  const needsArea = tab === 'nearby' && !areaId
  const filters: PostFilters = {
    tab,
    ...(saved ? { saved: true } : {}),
    ...(tab === 'nearby' && areaId ? { areaId } : {}),
  }
  const query = useFeed(
    filters,
    tab === 'for_you' && !saved ? { page: initial, scope } : undefined,
    !needsLogin && !needsArea,
  )
  const posts = deduplicatePosts(query.data?.pages ?? [])
  return (
    <CommunityLayout
      rail={
        <CommunityRail
          animals={animals}
          signedIn={!!session.actor}
          sample={session.demo}
        />
      }
    >
      <header
        className={
          'community-intro mb-6 [&_h1]:mb-2 [&_p]:text-muted-foreground [.platform-shell_&]:flex [.platform-shell_&]:items-center [.platform-shell_&]:justify-between [.platform-shell_&]:gap-4 [.platform-shell_&]:[margin:0_0_1rem] [.platform-shell_&_h1]:font-[800] [.platform-shell_&_h1]:text-[length:1.625rem] [.platform-shell_&_h1]:leading-[1.25] [.platform-shell_&_h1]:font-heading [.platform-shell_&_h1]:[margin:0_0_0.25rem] [.platform-shell_&_p]:text-[0.8125rem] [.platform-shell_&_p]:m-0 [.platform-shell_&_p]:text-muted-foreground max-[48rem]:[.platform-shell_&]:[margin:0.125rem_0.125rem_0.875rem] max-[48rem]:[.platform-shell_&]:gap-2 max-[48rem]:[.platform-shell_&_h1]:text-[length:1.375rem] max-[48rem]:[.platform-shell_&_p]:text-xs'
        }
      >
        <div>
          <h1>Community feed</h1>
          <p>Your daily dose of paws & people.</p>
        </div>
        <Link
          href="/explore"
          className={
            'feed-location inline-flex items-center gap-[0.35rem] no-underline text-[0.8125rem] text-muted-foreground whitespace-nowrap [&:hover]:text-[color:var(--teal)] max-[48rem]:text-[0.6875rem] max-[48rem]:gap-0.5'
          }
        >
          <MapPin size={16} aria-hidden="true" />
          Find animals
        </Link>
      </header>
      <nav
        aria-label="Community feeds"
        className={
          'feed-tabs [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card flex flex-wrap gap-1 [border-bottom:1px_solid_var(--border)] pb-3 [.platform-shell_&]:gap-0 [.platform-shell_&]:p-0 [.platform-shell_&]:mb-4 [.platform-shell_&]:[border:1px_solid_var(--social-line)] [.platform-shell_&]:rounded-xl [.platform-shell_&]:bg-card [.platform-shell_&]:overflow-hidden [.platform-shell_&]:flex-nowrap [.platform-shell_&_[data-slot=button]]:[flex:1] [.platform-shell_&_[data-slot=button]]:[border:0] [.platform-shell_&_[data-slot=button]]:rounded-[0] [.platform-shell_&_[data-slot=button]]:min-h-12.5 [.platform-shell_&_[data-slot=button]]:[padding:0.75rem_0.5rem] [.platform-shell_&_[data-slot=button]]:text-sm [.platform-shell_&_[data-slot=button]]:text-muted-foreground [.platform-shell_&_[data-slot=button]]:bg-[transparent] [.platform-shell_&_[data-slot=button]]:relative [.platform-shell_&_[data-slot=button]:hover]:bg-[#faf6f1] [.platform-shell_&_[data-slot=button]:hover]:text-foreground max-[48rem]:[.platform-shell_&_[data-slot=button]]:text-[0.8125rem] max-[48rem]:[.platform-shell_&_[data-slot=button]]:min-h-11.5 [.dark_.app-shell_&_a[aria-current=page]]:bg-[#2b1c12] [.dark_.app-shell_&_a[aria-current=page]]:text-[#ffad70] [.dark_.app-shell_&_a[aria-current=page]]:border-[#a85721]'
        }
      >
        {(['for_you', 'following', 'nearby'] as const).map((value) => (
          <Button
            key={value}
            variant="ghost"
            aria-pressed={!saved && tab === value}
            onClick={() => {
              setTab(value)
              setSaved(false)
            }}
            className={
              !saved && tab === value
                ? "feed-tab-current [.platform-shell_.feed-tabs_&]:text-[#a7430d] [.platform-shell_.feed-tabs_&]:font-bold [.platform-shell_.feed-tabs_&::after]:[content:''] [.platform-shell_.feed-tabs_&::after]:absolute [.platform-shell_.feed-tabs_&::after]:bottom-0 [.platform-shell_.feed-tabs_&::after]:left-[20%] [.platform-shell_.feed-tabs_&::after]:right-[20%] [.platform-shell_.feed-tabs_&::after]:h-[3px] [.platform-shell_.feed-tabs_&::after]:rounded-[3px_3px_0_0] [.platform-shell_.feed-tabs_&::after]:bg-[var(--primary)] [@media(forced-colors:_active)]:[.platform-shell_.feed-tabs_&]:[outline:1px_solid_Highlight] [@media(forced-colors:_active)]:[.platform-shell_.feed-tabs_&]:[outline-offset:-2px]"
                : undefined
            }
          >
            {value === 'for_you'
              ? 'For you'
              : value === 'following'
                ? 'Following'
                : 'Nearby'}
          </Button>
        ))}
        <Button
          variant="ghost"
          aria-pressed={saved}
          className={
            saved
              ? "feed-tab-current [.platform-shell_.feed-tabs_&]:text-[#a7430d] [.platform-shell_.feed-tabs_&]:font-bold [.platform-shell_.feed-tabs_&::after]:[content:''] [.platform-shell_.feed-tabs_&::after]:absolute [.platform-shell_.feed-tabs_&::after]:bottom-0 [.platform-shell_.feed-tabs_&::after]:left-[20%] [.platform-shell_.feed-tabs_&::after]:right-[20%] [.platform-shell_.feed-tabs_&::after]:h-[3px] [.platform-shell_.feed-tabs_&::after]:rounded-[3px_3px_0_0] [.platform-shell_.feed-tabs_&::after]:bg-[var(--primary)] [@media(forced-colors:_active)]:[.platform-shell_.feed-tabs_&]:[outline:1px_solid_Highlight] [@media(forced-colors:_active)]:[.platform-shell_.feed-tabs_&]:[outline-offset:-2px]"
              : undefined
          }
          onClick={() => setSaved(!saved)}
        >
          Saved
        </Button>
      </nav>
      <PostComposer options={options} compact />
      <p
        className={
          'feed-explanation text-muted-foreground text-sm [margin:0.75rem_0_1.5rem] [.platform-shell_&]:[margin:1.25rem_0_0.625rem_0.125rem] [.platform-shell_&]:text-xs [.platform-shell_&]:font-semibold [.platform-shell_&]:text-muted-foreground'
        }
        aria-live="polite"
      >
        {saved
          ? 'Your saved stories, newest first.'
          : tab === 'for_you'
            ? 'Latest from the community'
            : tab === 'following'
              ? 'From the people and pets you follow'
              : 'Choose a public neighborhood. Your current location is never requested.'}
      </p>
      {tab === 'nearby' && (
        <div
          className={
            'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
          }
          role="group"
          aria-label="Choose a neighborhood"
        >
          {areas.map((area) => (
            <Button
              variant="outline"
              key={area.id}
              aria-pressed={area.id === areaId}
              onClick={() => setAreaId(area.id)}
            >
              {area.name}
            </Button>
          ))}
          {areaId && (
            <Button variant="ghost" onClick={() => setAreaId(undefined)}>
              Clear area
            </Button>
          )}
        </div>
      )}
      {needsLogin ? (
        <DataState
          state="empty"
          emptyTitle="Keep your care circle close"
          emptyDescription="Sign in to see your following feed and saved stories."
          emptyAction={
            <ButtonLink href={loginPath('/community')}>Sign in</ButtonLink>
          }
        />
      ) : needsArea ? (
        <DataState
          state="empty"
          emptyTitle="Which neighborhood?"
          emptyDescription="Select an area above to see stories linked to animals and care efforts there."
        />
      ) : (
        <>
          <DataState
            state={
              query.isPending
                ? 'loading'
                : query.isError && !posts.length
                  ? 'error'
                  : !posts.length
                    ? 'empty'
                    : 'ready'
            }
            loadingContent={<FeedLoading />}
            retry={() => void query.refetch()}
            emptyTitle={
              saved ? 'No saved stories yet' : 'Your next story starts here'
            }
            emptyDescription={
              saved
                ? 'Save a post to return to it here.'
                : tab === 'following'
                  ? 'This feed will fill when you follow people and animals.'
                  : 'Share a moment or try another feed.'
            }
            emptyIllustration="caught-up"
          >
            <div
              key={`${tab}-${saved}-${areaId ?? ''}`}
              className="motion-safe:animate-[page-arrival_180ms_var(--motion-ease)]"
            >
              {posts.map((post) => (
                <PostCard key={post.id} post={post} options={options} />
              ))}
            </div>
          </DataState>
          {query.isError && !!posts.length && (
            <p role="alert">
              More stories couldn’t load. Your current stories are still here.
            </p>
          )}
          {query.isFetchingNextPage && (
            <FeedLoading count={1} label="Loading more stories…" />
          )}
          {query.hasNextPage && (
            <Button
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage
                ? 'Loading stories…'
                : 'Load more stories'}
            </Button>
          )}
          {query.isError && !!posts.length && (
            <Button variant="outline" onClick={() => void query.refetch()}>
              Retry stories
            </Button>
          )}
        </>
      )}
    </CommunityLayout>
  )
}
