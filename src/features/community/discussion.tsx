'use client'
import { EarnedBadges } from '@/components/shared/social-card'
import { RankCrown } from '@/features/kibble/rank-crown'
import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/shared/data-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ResourceRef } from '@/types/common'
import { CommentForm } from './comment-form'
import { PostComposer } from './post-composer'
import type { LinkedOption } from './linked-entity-picker'
export function Discussion({
  target,
  returnTo,
  photoContext = [],
  composerFirst = false,
  allowPhotos = true,
}: {
  target: ResourceRef
  returnTo: string
  photoContext?: LinkedOption[]
  composerFirst?: boolean
  allowPhotos?: boolean
}) {
  const { session, pending } = useSession()
  const [photo, setPhoto] = useState(false)
  const query = useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('discussions', target),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().community.comments(
        target,
        { cursor: pageParam, limit: 12 },
        { signal },
      ),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !pending,
  })
  const comments = [
    ...new Map(
      (query.data?.pages.flatMap((p) => p.items) ?? []).map((c) => [c.id, c]),
    ).values(),
  ]
  return (
    <div className="discussion">
      {composerFirst && <CommentForm target={target} returnTo={returnTo} />}
      <DataState
        state={
          query.isPending
            ? 'loading'
            : query.isError
              ? 'error'
              : comments.length
                ? 'ready'
                : 'empty'
        }
        retry={() => void query.refetch()}
        emptyTitle="Start the conversation"
        emptyDescription="Share a thoughtful observation or a useful update."
        errorMessage="Comments couldn’t load. Try loading this discussion again."
      >
        <ol className="discussion-list">
          {comments.map((comment) => (
            <li key={comment.id}>
              <div className="discussion-byline">
                <CommunityAvatar
                  name={comment.author.displayName}
                  image={comment.author.avatar}
                  userId={comment.authorId}
                  small
                />
                <strong className="recognized-author-name">
                  {comment.author.displayName}
                  {comment.author.username && (
                    <RankCrown rank={comment.author.leaderboardRank} />
                  )}
                  {comment.author.username && (
                    <EarnedBadges
                      badges={comment.author.badges}
                      username={comment.author.username}
                    />
                  )}
                </strong>
                <time dateTime={comment.createdAt}>
                  {new Intl.DateTimeFormat('en-PH', {
                    dateStyle: 'medium',
                    timeZone: 'Asia/Manila',
                  }).format(new Date(comment.createdAt))}
                </time>
              </div>
              <p className="post-text">{comment.text}</p>
              {comment.moderation !== 'published' && (
                <StatusBadge tone="warning">
                  {comment.moderation === 'pending'
                    ? 'Pending review · only you can see this comment'
                    : 'Rejected · not public'}
                </StatusBadge>
              )}
            </li>
          ))}
        </ol>
      </DataState>
      {query.hasNextPage && (
        <Button
          variant="outline"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load older comments'}
        </Button>
      )}
      {!composerFirst && <CommentForm target={target} returnTo={returnTo} />}
      {allowPhotos && session.actor && (
        <div className="discussion-photo">
          <p>Have a photograph to add to the story?</p>
          {photo ? (
            <PostComposer
              options={photoContext}
              initialRefs={photoContext
                .filter((option) =>
                  ['animal', 'horde', 'fundraiser', 'mission'].includes(
                    option.ref.kind,
                  ),
                )
                .map((option) => option.ref)}
              initialType="photo"
              onCancel={() => setPhoto(false)}
              onComplete={() => setPhoto(false)}
            />
          ) : (
            <Button variant="outline" onClick={() => setPhoto(true)}>
              Share a photo update
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
