'use client'
import { useState } from 'react'
import Link from 'next/link'
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
          <h1>The community journal</h1>
          <p>Little moments. Familiar faces. More ways to care.</p>
        </header>
        <PostComposer options={options} />
        <nav aria-label="Community feeds" className="feed-tabs">
          {(['for_you', 'following', 'nearby'] as const).map((value) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
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
            onClick={() => setSaved(!saved)}
          >
            Saved posts
          </Button>
        </nav>
        <p className="feed-explanation">
          {saved
            ? 'Your saved stories, newest first.'
            : tab === 'for_you'
              ? 'For you is a chronological feed — the newest stories come first.'
              : tab === 'following'
                ? 'Stories from the people and animals you follow. Follow them from profiles or story cards.'
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
        <h2>A familiar face to care for</h2>
        <p>
          Sample animals connected to the community. Learn their needs before
          taking the next step.
        </p>
        {animals.slice(0, 2).map((animal) => (
          <section key={animal.id}>
            <AnimalImage image={animal.photo} />
            <h3>
              <Link href={`/pets/${encodeURIComponent(animal.slug)}`}>
                {animal.name}
              </Link>
            </h3>
            <p>
              {animal.location.neighborhood} ·{' '}
              {animal.adoptable
                ? 'Open to adoption enquiries'
                : 'Meet their care circle'}
            </p>
            <Link href={`/pets/${encodeURIComponent(animal.slug)}#help`}>
              See ways to help {animal.name}
            </Link>
          </section>
        ))}
      </aside>
    </div>
  )
}
