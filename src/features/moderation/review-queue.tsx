'use client'
import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/shared/data-state'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ModerationFilters } from './types'
import { ReviewPanel } from './review-panel'
export function ReviewQueue() {
  const { session, pending } = useSession()
  const [kind, setKind] = useState<'publication' | 'verification'>(
    'publication',
  )
  const [state, setState] = useState<ModerationFilters['state']>('pending')
  const [selected, setSelected] = useState<string>()
  const allowed = session.roles.includes('moderator')
  const query = useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('moderation', { kind, state }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().moderation.queue(
        { kind, state, cursor: pageParam, limit: 12 },
        { signal },
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: allowed && !pending,
  })
  if (!allowed)
    return (
      <DataState
        state="error"
        errorMessage="This review queue is restricted to authorized moderators."
      />
    )
  const rows = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) ?? []).map((i) => [i.id, i]),
    ).values(),
  ]
  const current = rows.find((i) => i.id === selected)
  return (
    <div className="moderation-workspace">
      <div className="community-choice-row" aria-label="Review type">
        {(['publication', 'verification'] as const).map((value) => (
          <Button
            key={value}
            variant="outline"
            aria-pressed={kind === value}
            onClick={() => {
              setKind(value)
              setState(value === 'publication' ? 'pending' : 'published')
              setSelected(undefined)
            }}
          >
            {value === 'publication'
              ? 'Publication review'
              : 'Verification review'}
          </Button>
        ))}
      </div>
      <div className="community-choice-row" aria-label="Review state">
        {(['pending', 'published', 'rejected', 'removed'] as const).map(
          (value) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={state === value}
              onClick={() => {
                setState(value)
                setSelected(undefined)
              }}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ),
        )}
      </div>
      {current ? (
        <>
          <Button variant="ghost" onClick={() => setSelected(undefined)}>
            Back to queue
          </Button>
          <ReviewPanel
            key={`${current.id}:${current.version}`}
            item={current}
            onReviewed={() => {
              setSelected(undefined)
              void query.refetch()
            }}
          />
        </>
      ) : (
        <>
          <DataState
            state={
              query.isPending
                ? 'loading'
                : query.isError
                  ? 'error'
                  : rows.length
                    ? 'ready'
                    : 'empty'
            }
            retry={() => void query.refetch()}
            emptyTitle="No records in this queue"
            emptyDescription="Choose another review type or state to inspect existing records."
            errorMessage="The queue couldn’t load. Try again to get the latest records."
          >
            <ul className="review-list">
              {rows.map((item) => (
                <li key={item.id}>
                  <div>
                    <h2>{item.title}</h2>
                    <p>
                      {item.commentId ? 'Comment' : item.ref.kind} ·{' '}
                      {item.state} · {item.reportCount} reported concerns
                    </p>
                    <p className="review-excerpt">{item.text}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelected(item.id)}
                  >
                    Review {item.commentId ? 'comment' : item.ref.kind}
                  </Button>
                </li>
              ))}
            </ul>
          </DataState>
          {query.hasNextPage && (
            <Button
              variant="outline"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? 'Loading…' : 'Load more reviews'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
