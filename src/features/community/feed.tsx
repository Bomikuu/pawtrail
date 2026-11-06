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
    <div className="community-layout">
      <div className="community-journal">
        <header className="community-intro">
          <div>
            <h1>Community</h1>
            <p>Your daily dose of paws & people.</p>
          </div>
          <Link href="/explore" className="feed-location">
            <MapPin size={16} aria-hidden="true" />
            Explore nearby
          </Link>
        </header>
        <nav aria-label="Community feeds" className="feed-tabs">
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
                !saved && tab === value ? 'feed-tab-current' : undefined
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
            className={saved ? 'feed-tab-current' : undefined}
            onClick={() => setSaved(!saved)}
          >
            Saved
          </Button>
        </nav>
        <PostComposer options={options} compact />
        <p className="feed-explanation" aria-live="polite">
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
            className="community-choice-row"
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
      <aside className="community-rail" aria-label="Animals to know">
        <section className="community-welcome">
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
        <section className="rail-neighbors">
          <div className="rail-heading">
            <h2>Looking for a home</h2>
            <Link href="/adopt" aria-label="See all adoptable animals">
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {animals.length ? (
            animals.slice(0, 4).map((animal) => (
              <Link
                key={animal.id}
                className="rail-animal"
                href={'/pets/' + encodeURIComponent(animal.slug)}
              >
                <AnimalImage image={animal.photo} compact />
                <span>
                  <strong>{animal.name}</strong>
                  <small>{animal.location.neighborhood}</small>
                  <span className="rail-animal-status">
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
            <p className="rail-sample-note">Illustrative community profiles</p>
          )}
        </section>
        <section className="rail-help">
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
        <footer className="community-rail-footer">
          <Link href="/shelters">Shelters</Link>
          <Link href="/events">Events</Link>
          <Link href="/dashboard/settings">Privacy settings</Link>
          <span>PawTrail · Every Paw Has a Story.</span>
        </footer>
      </aside>
    </div>
  )
}
