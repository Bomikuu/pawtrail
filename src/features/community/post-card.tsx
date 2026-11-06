'use client'
import { EarnedBadges, ParticipantFaces } from '@/components/shared/social-card'
import { RankCrown } from '@/features/kibble/rank-crown'
import { FollowButton } from '@/features/users/follow-button'
import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimalImage } from '@/components/shared/animal-image'
import { StatusBadge } from '@/components/shared/status-badge'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/shared/data-state'
import { READY_ROUTES } from '@/components/layout/navigation'
import { isRouteReady } from '@/lib/route-readiness'
import { Discussion } from './discussion'
import { PostActions } from './post-actions'
import { PostComposer, postTypes } from './post-composer'
import type { LinkedOption } from './linked-entity-picker'
import { usePost } from './queries'
import type { Post } from './types'
function PrivatePhoto({
  image,
}: {
  image: NonNullable<Post['ownerMedia']>[number]
}) {
  const [revealed, setRevealed] = useState(!image.sensitive)
  const [failed, setFailed] = useState(false)
  if (failed)
    return <p>Private photograph unavailable. Refresh to try again.</p>
  if (!revealed)
    return (
      <div>
        <p>This private photograph may show an animal in distress.</p>
        <Button variant="outline" onClick={() => setRevealed(true)}>
          Show private photograph
        </Button>
      </div>
    )
  return (
    <figure>
      <img
        src={image.url}
        alt={image.alt}
        width={640}
        height={480}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <figcaption>Private author preview</figcaption>
    </figure>
  )
}
export function PostCard({
  post,
  options,
  detail = false,
}: {
  post: Post
  options: LinkedOption[]
  detail?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [textExpanded, setTextExpanded] = useState(false)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const textId = useId()
  const router = useRouter()
  if (deleted) return <p role="status">Story deleted.</p>
  if (editing)
    return (
      <PostComposer
        post={post}
        options={options}
        onComplete={() => {
          setEditing(false)
          router.refresh()
        }}
        onCancel={() => setEditing(false)}
      />
    )
  const userHref = post.author.username
    ? `/users/${encodeURIComponent(post.author.username)}`
    : null
  const createdLabel = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(post.createdAt))
  return (
    <article
      className="post-card"
      aria-label={`${postTypes[post.type]} by ${post.author.displayName}`}
    >
      <header className="post-heading">
        <CommunityAvatar
          name={post.author.displayName}
          image={post.author.avatar}
          userId={post.authorId}
        />
        <div className="post-author">
          <strong className="recognized-author-name">
            {userHref && isRouteReady(userHref, READY_ROUTES) ? (
              <Link href={userHref}>{post.author.displayName}</Link>
            ) : (
              post.author.displayName
            )}
            {post.author.username && (
              <RankCrown rank={post.author.leaderboardRank} />
            )}
          </strong>
          <div className="post-author-meta">
            <p>
              {post.author.username && (
                <span className="post-handle">
                  @{post.author.username} <span aria-hidden="true">· </span>
                </span>
              )}
              <time dateTime={post.createdAt}>
                {post.id.startsWith('pending:') ? (
                  createdLabel
                ) : (
                  <Link
                    className="post-time-link"
                    href={'/community/' + encodeURIComponent(post.id)}
                  >
                    {createdLabel}
                  </Link>
                )}
              </time>{' '}
              · {postTypes[post.type]}
            </p>
            {post.author.username && (
              <EarnedBadges
                badges={post.author.badges}
                username={post.author.username}
              />
            )}
          </div>
        </div>
        {post.authorId && (
          <FollowButton
            target={{ kind: 'user', id: post.authorId }}
            name={post.author.displayName}
            returnTo={`/community/${encodeURIComponent(post.id)}`}
            compact
          />
        )}
      </header>
      {post.moderation !== 'published' && (
        <p className="post-review">
          <StatusBadge tone="warning">
            {post.moderation === 'pending'
              ? 'Pending review'
              : 'Rejected · not published'}
          </StatusBadge>{' '}
          Visible only to the author and reviewers.
        </p>
      )}
      <p
        id={textId}
        className={`post-text${!detail && !textExpanded && post.text.length > 160 ? ' post-text-preview' : ''}`}
      >
        {post.text}
      </p>
      {!detail && post.text.length > 160 && (
        <Button
          className="post-text-toggle"
          variant="ghost"
          aria-expanded={textExpanded}
          aria-controls={textId}
          onClick={() => setTextExpanded(!textExpanded)}
        >
          {textExpanded ? 'Show less' : 'Read more'}
        </Button>
      )}
      {!!post.linkedEntities.length && (
        <ul className="post-identities" aria-label="Connected stories">
          {(detail || tagsExpanded
            ? post.linkedEntities
            : post.linkedEntities.slice(0, 2)
          ).map((entity) => (
            <li key={`${entity.ref.kind}:${entity.ref.id}`}>
              {isRouteReady(entity.href, READY_ROUTES) ? (
                <Link href={entity.href}>
                  <PawPrint size={14} aria-hidden="true" />
                  {entity.title}
                </Link>
              ) : (
                <span>
                  {entity.title}{' '}
                  <small>· {entity.ref.kind}, page coming soon</small>
                </span>
              )}
            </li>
          ))}
          {!detail && post.linkedEntities.length > 2 && (
            <li>
              <Button
                variant="ghost"
                className="post-tags-toggle"
                aria-expanded={tagsExpanded}
                onClick={() => setTagsExpanded(!tagsExpanded)}
              >
                {tagsExpanded
                  ? 'Fewer tags'
                  : `+${post.linkedEntities.length - 2} more`}
              </Button>
            </li>
          )}
        </ul>
      )}
      {!!post.media.length && (
        <div
          className={
            'post-photos' +
            (post.media.length > 1 ? ' post-photos-multiple' : '')
          }
        >
          {post.media.map((image) => (
            <AnimalImage key={image.id} image={image} />
          ))}
        </div>
      )}
      {post.ownerMedia &&
        ['pending', 'rejected'].includes(post.moderation) &&
        post.viewerOwns && (
          <div className="post-photos">
            {post.ownerMedia.map((image) => (
              <PrivatePhoto key={image.id} image={image} />
            ))}
          </div>
        )}
      <PostActions
        post={post}
        onEdit={() => setEditing(true)}
        onDeleted={() => {
          setDeleted(true)
          if (detail) router.push('/community')
        }}
      />
      <ParticipantFaces
        people={post.participants ?? []}
        count={post.participantCount}
        href={`/community/${encodeURIComponent(post.id)}#discussion`}
      />
      <footer className="post-footer">
        {!detail && !post.id.startsWith('pending:') && (
          <Link href={`/community/${encodeURIComponent(post.id)}`}>
            View conversation
          </Link>
        )}
        <span title={post.provenance.label}>
          {post.provenance.kind === 'demo'
            ? 'Sample post'
            : post.provenance.label}
        </span>
      </footer>
      {detail && post.moderation === 'published' && (
        <section id="discussion" className="profile-section">
          <h2>Join the conversation</h2>
          <Discussion
            target={{ kind: 'post', id: post.id }}
            returnTo={`/community/${encodeURIComponent(post.id)}`}
            photoContext={post.linkedEntities}
          />
        </section>
      )}
    </article>
  )
}
export function PostDetail({
  initial,
  scope,
  options,
  detail = true,
}: {
  initial: Post
  scope: string
  options: LinkedOption[]
  detail?: boolean
}) {
  const query = usePost(initial.id, { post: initial, scope })
  return (
    <DataState
      state={query.isPending ? 'loading' : query.isError ? 'error' : 'ready'}
      retry={() => void query.refetch()}
    >
      {query.data && (
        <PostCard post={query.data} options={options} detail={detail} />
      )}
    </DataState>
  )
}
