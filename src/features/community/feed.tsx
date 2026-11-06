'use client'
import { useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowUpRight, MapPin, ArrowRight, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { AnimalImage } from '@/components/shared/animal-image'
import { DataState } from '@/components/shared/data-state'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import type { Page } from '@/types/common'
import type { GeoArea } from '@/features/discovery/types'
import type { AnimalSummary } from '@/features/animals/types'
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
    <div
      className={
        'community-layout grid gap-8 items-start min-[80rem]:grid-cols-[minmax(0,_1fr)_14rem] [.platform-shell_&]:grid-cols-[minmax(0,_1fr)_minmax(17rem,_22%)] [.platform-shell_&]:gap-7 max-[76rem]:[.platform-shell_&]:grid-cols-1'
      }
    >
      <div className={'community-journal min-w-0'}>
        <header
          className={
            'community-intro mb-6 [&_h1]:mb-2 [&_p]:text-muted-foreground [.platform-shell_&]:flex [.platform-shell_&]:items-center [.platform-shell_&]:justify-between [.platform-shell_&]:gap-4 [.platform-shell_&]:[margin:0_0_1rem] [.platform-shell_&_h1]:font-[800] [.platform-shell_&_h1]:text-[length:1.625rem] [.platform-shell_&_h1]:leading-[1.25] [.platform-shell_&_h1]:font-heading [.platform-shell_&_h1]:[margin:0_0_0.25rem] [.platform-shell_&_p]:text-[0.8125rem] [.platform-shell_&_p]:m-0 [.platform-shell_&_p]:text-muted-foreground max-[48rem]:[.platform-shell_&]:[margin:0.125rem_0.125rem_0.875rem] max-[48rem]:[.platform-shell_&]:gap-2 max-[48rem]:[.platform-shell_&_h1]:text-[length:1.375rem] max-[48rem]:[.platform-shell_&_p]:text-xs'
          }
        >
          <div>
            <h1>Community</h1>
            <p>Your daily dose of paws & people.</p>
          </div>
          <Link
            href="/explore"
            className={
              'feed-location inline-flex items-center gap-[0.35rem] no-underline text-[0.8125rem] text-muted-foreground whitespace-nowrap [&:hover]:text-[color:var(--teal)] max-[48rem]:text-[0.6875rem] max-[48rem]:gap-0.5'
            }
          >
            <MapPin size={16} aria-hidden="true" />
            Explore nearby
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
              {posts.map((post) => (
                <PostCard key={post.id} post={post} options={options} />
              ))}
            </DataState>
            {query.isError && !!posts.length && (
              <p role="alert">
                More stories couldn’t load. Your current stories are still here.
              </p>
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
      </div>
      <aside
        className={
          'community-rail [&_p]:text-muted-foreground hidden min-[80rem]:block min-[80rem]:[&_h2]:text-lg min-[80rem]:[&_h2]:mb-3 min-[80rem]:[&_p]:text-sm min-[80rem]:[&_section]:mt-6 min-[80rem]:[&_section]:pt-6 min-[80rem]:[&_section]:[border-top:1px_solid_var(--border)] min-[80rem]:[&_img]:w-full min-[80rem]:[&_img]:h-auto min-[80rem]:[&_img]:[aspect-ratio:4/3] min-[80rem]:[&_img]:object-cover min-[80rem]:[&_img]:mb-3 min-[80rem]:[&_h3]:text-base [.platform-shell_&]:block [.platform-shell_&]:sticky [.platform-shell_&]:top-22 [.platform-shell_&]:min-w-0 [.platform-shell_&_section]:p-0 [.platform-shell_&_section]:[margin:0_0_1.25rem] [.platform-shell_&_section]:[border:0] [.platform-shell_&_h2]:text-[length:1.0625rem] [.platform-shell_&_h2]:[margin:0_0_0.5rem] [.platform-shell_&_p]:text-[0.8125rem] [.platform-shell_&_p]:[line-height:1.55] [.platform-shell_&_p]:text-muted-foreground [.platform-shell_&_p]:[margin:0_0_0.875rem] max-[76rem]:[.platform-shell_&]:hidden'
        }
        aria-label="Animals to know"
      >
        <section
          className={
            'community-welcome overflow-hidden rounded-xl bg-[#fff7ec] [.platform-shell_&_>_img]:block [.platform-shell_&_>_img]:w-full [.platform-shell_&_>_img]:[aspect-ratio:2.05] [.platform-shell_&_>_img]:object-cover [.platform-shell_&_>_img]:m-0 [&_>_div]:[padding:1rem_1.125rem_1.125rem] [.platform-shell_&_h2]:text-xl [&_[data-slot=button]]:bg-[transparent] [&_[data-slot=button]]:border-[#d6bfa7] [&_[data-slot=button]]:text-[0.8125rem] [&_[data-slot=button]]:w-full [&_[data-slot=button]]:min-h-10 [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
          }
        >
          <img
            src="/images/pawtrail/care-circle.webp"
            width={504}
            height={245}
            alt=""
            loading="lazy"
          />
          <div>
            <h2>Every paw has a story.</h2>
            <p>Find your people. Meet their pets. Make a little difference.</p>
            <ButtonLink href="/adopt" variant="outline">
              Find a companion <ArrowUpRight size={17} aria-hidden="true" />
            </ButtonLink>
          </div>
        </section>
        <section
          className={
            'rail-neighbors [.platform-shell_.community-rail_&]:[padding:0.25rem_0.25rem_1rem] [.platform-shell_.community-rail_&]:[border-bottom:1px_solid_var(--social-line)]'
          }
        >
          <div
            className={
              'rail-heading flex justify-between gap-2 items-center mb-3.5 [&_h2]:m-0 [&_>_a]:flex [&_>_a]:w-8 [&_>_a]:min-h-11 [&_>_a]:items-center [&_>_a]:justify-center'
            }
          >
            <h2>Looking for a home</h2>
            <Link href="/adopt" aria-label="See all adoptable animals">
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {animals.length ? (
            animals.slice(0, 4).map((animal) => (
              <Link
                key={animal.id}
                className={
                  'rail-animal flex gap-3 items-center no-underline text-foreground [padding:0.625rem_0] [&:hover_strong]:text-[color:var(--teal)] [&:hover_strong]:underline [.platform-shell_&_>_img]:w-15 [.platform-shell_&_>_img]:h-15 [.platform-shell_&_>_img]:rounded-[0.625rem] [.platform-shell_&_>_img]:object-cover [.platform-shell_&_>_img]:[flex:0_0_3.75rem] [.platform-shell_&_>_img]:m-0 [.platform-shell_&_>_img]:p-0 [&_strong]:block [&_strong]:text-sm [&_small]:block [&_small]:text-[0.6875rem] [&_small]:text-muted-foreground'
                }
                href={'/pets/' + encodeURIComponent(animal.slug)}
              >
                <AnimalImage image={animal.photo} compact />
                <span>
                  <strong>{animal.name}</strong>
                  <small>{animal.location.neighborhood}</small>
                  <span
                    className={
                      'rail-animal-status inline-flex items-center gap-1 text-[color:var(--teal)] text-[0.6875rem]'
                    }
                  >
                    Meet {animal.name}{' '}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <p>No public adoption profiles right now. Check back soon.</p>
          )}
          {session.demo && (
            <p
              className={
                'rail-sample-note [.platform-shell_.community-rail_&]:text-[0.6875rem] [.platform-shell_.community-rail_&]:[margin:0.625rem_0_0]'
              }
            >
              Illustrative community profiles
            </p>
          )}
        </section>
        <section
          className={
            'rail-help [.platform-shell_.community-rail_&]:[padding:0_0.25rem_1.125rem] [.platform-shell_.community-rail_&]:[border-bottom:1px_solid_var(--social-line)] [&_>_svg]:text-[#c94c09] [&_>_svg]:mb-2.5 [&_>_a]:text-[0.8125rem] [&_>_a]:no-underline [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:gap-2'
          }
        >
          <PawPrint size={22} aria-hidden="true" />
          <h2>A small act. A happier paw.</h2>
          <p>
            A meal, a short walk, a helping hand. There’s a way for you to get
            involved.
          </p>
          <Link href="/missions">
            Explore missions <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
        <footer
          className={
            'community-rail-footer flex flex-wrap [gap:0.5rem_0.75rem] [padding:0_0.25rem] text-[0.6875rem] text-muted-foreground [&_a]:text-[inherit] [&_a]:no-underline [&_a:hover]:underline [&_>_span]:[flex-basis:100%] [&_>_span]:mt-1'
          }
        >
          <Link href="/shelters">Shelters</Link>
          <Link href="/events">Events</Link>
          <Link href="/dashboard/settings">Privacy settings</Link>
          <span>PawTrail · Every Paw Has a Story.</span>
        </footer>
      </aside>
    </div>
  )
}
