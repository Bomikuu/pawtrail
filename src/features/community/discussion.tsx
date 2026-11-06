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
import { ProfileLink } from '@/features/users/profile-link'
export function Discussion({
  target,
  returnTo,
  photoContext = [],
  composerFirst = false,
  allowPhotos = true,
  subject,
}: {
  target: ResourceRef
  returnTo: string
  photoContext?: LinkedOption[]
  composerFirst?: boolean
  allowPhotos?: boolean
  subject?: string
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
    <div
      className={
        'discussion grid gap-6 min-w-0 [.app-shell_.profile-section_>_&]:min-w-0 [.app-shell_&]:pt-3'
      }
    >
      {composerFirst && (
        <CommentForm target={target} returnTo={returnTo} subject={subject} />
      )}
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
        <ol
          className={
            'discussion-list list-none p-0 m-0 [&_>_li]:py-5 [&_>_li]:[border-bottom:1px_solid_var(--border)] [.app-shell_&]:grid [.app-shell_&]:gap-3.5 [.app-shell_&_>_li]:p-4.5 [.app-shell_&_>_li]:[border:1px_solid_var(--social-line)] [.app-shell_&_>_li]:rounded-[0.875rem] [.app-shell_&_>_li]:bg-card [.dark_.app-shell_&_>_li]:bg-card [.dark_.app-shell_&_>_li]:text-foreground [.dark_.app-shell_&_>_li]:border-border [.dark_.app-shell_&_>_li]:[box-shadow:none] [.event-community_&]:grid [.event-community_&]:gap-4 [.event-community_&_>_li]:bg-card [.event-community_&_>_li]:p-5 [.event-community_&_>_li]:[border:1px_solid_var(--border)] [.event-community_&_>_li]:rounded-2xl max-[40rem]:[.event-community_&_>_li]:p-4'
          }
        >
          {comments.map((comment) => (
            <li key={comment.id}>
              <div
                className={
                  'discussion-byline flex items-center justify-between gap-2 flex-wrap [&_time]:text-sm [&_time]:text-muted-foreground [.app-shell_&]:justify-start [.app-shell_&]:items-center [.app-shell_&]:gap-2.5 [.app-shell_&_time]:ml-auto [.app-shell_&_time]:text-xs max-[48rem]:[.app-shell_&_time]:w-full max-[48rem]:[.app-shell_&_time]:ml-0 [.event-community_&]:justify-start [.event-community_&]:items-center [.event-community_&]:gap-2.5 [.event-community_&_time]:ml-auto [.event-community_&_time]:text-xs max-[40rem]:[.event-community_&_time]:w-full max-[40rem]:[.event-community_&_time]:ml-0'
                }
              >
                {comment.author.username ? (
                  <ProfileLink
                    username={comment.author.username}
                    aria-label={`View ${comment.author.displayName}’s profile`}
                  >
                    <CommunityAvatar
                      name={comment.author.displayName}
                      image={comment.author.avatar}
                      userId={comment.authorId}
                      small
                    />
                  </ProfileLink>
                ) : (
                  <CommunityAvatar
                    name={comment.author.displayName}
                    image={comment.author.avatar}
                    userId={comment.authorId}
                    small
                  />
                )}
                <strong
                  className={
                    'recognized-author-name [.post-author_&]:flex [.post-author_&]:flex-wrap [.post-author_&]:items-center [.post-author_&]:gap-1.5 [.discussion-byline_&]:flex [.discussion-byline_&]:flex-wrap [.discussion-byline_&]:items-center [.discussion-byline_&]:gap-1.5 [.post-author_&_>_a:not(.rank-crown)]:[overflow-wrap:anywhere] max-[48rem]:[.discussion-byline_&]:min-w-0 [.app-shell_&]:flex [.app-shell_&]:flex-wrap [.app-shell_&]:items-center [.app-shell_&]:[gap:0.25rem_0.375rem] max-[48rem]:[.app-shell_.post-heading_&]:text-sm'
                  }
                >
                  {comment.author.username ? (
                    <ProfileLink username={comment.author.username}>
                      {comment.author.displayName}
                    </ProfileLink>
                  ) : (
                    comment.author.displayName
                  )}
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
              <p
                className={
                  'post-text whitespace-pre-wrap [overflow-wrap:anywhere] [line-height:1.65] [margin:1rem_0] [.app-shell_&]:[margin:0.875rem_0] [.app-shell_&]:text-[length:0.9375rem] [.app-shell_&]:max-w-[78ch] max-[48rem]:[.app-shell_&]:text-sm [.pet-social-profile_&]:px-4 [.event-community_&]:[margin:0.875rem_0_0]'
                }
              >
                {comment.text}
              </p>
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
      {!composerFirst && (
        <CommentForm target={target} returnTo={returnTo} subject={subject} />
      )}
      {allowPhotos && session.actor && (
        <div
          className={
            'discussion-photo [border-top:1px_solid_var(--border)] pt-6'
          }
        >
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
