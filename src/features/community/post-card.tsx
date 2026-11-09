'use client'
import { Card } from '@/components/ui/card'
import { EarnedBadges, ParticipantFaces } from '@/components/shared/social-card'
import { RankCrown } from '@/features/kibble/rank-crown'
import { FollowButton } from '@/features/users/follow-button'
import { useId, useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
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
import { ProfileLink } from '@/features/users/profile-link'
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
    <Card
      role="article"
      className={
        'post-card bg-card [border:1px_solid_var(--border)] p-5 mb-6 rounded-xl max-[48rem]:p-4 [.app-shell_&]:border-border [.app-shell_&]:rounded-xl [.app-shell_&]:[padding:1rem_1.125rem] [.app-shell_&]:[margin:0_0_1rem] max-[48rem]:[.app-shell_&]:p-3.5 [.resource-story-feed_&]:m-0 [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:[border:1px_solid_#e8ddcf] [.pet-social-profile_&]:rounded-2xl [.pet-social-profile_&]:bg-card [.pet-social-profile_&]:overflow-hidden gap-0'
      }
      aria-label={`${postTypes[post.type]} by ${post.author.displayName}`}
    >
      <header
        className={
          'post-heading [&_p]:text-muted-foreground [&_p]:text-[0.8125rem] [&_p]:mt-1 flex justify-between gap-4 items-start max-[48rem]:flex-wrap max-[48rem]:gap-2 [.app-shell_&]:gap-2.5 [.app-shell_&]:items-start [.app-shell_&]:flex-nowrap [.app-shell_&_p]:[margin:0.125rem_0_0] [.app-shell_&_p]:text-xs [.app-shell_&_p]:[line-height:1.5] [.app-shell_&_p]:text-muted-foreground max-[48rem]:[.app-shell_&]:gap-2 [.pet-social-profile_&]:p-4'
        }
      >
        {post.author.username ? (
          <ProfileLink
            username={post.author.username}
            aria-label={`View ${post.author.displayName}’s profile`}
          >
            <CommunityAvatar
              name={post.author.displayName}
              image={post.author.avatar}
              userId={post.authorId}
            />
          </ProfileLink>
        ) : (
          <CommunityAvatar
            name={post.author.displayName}
            image={post.author.avatar}
            userId={post.authorId}
          />
        )}
        <div
          className={
            'post-author min-w-0 [flex:1] [&_strong]:text-[length:0.9375rem] [&_strong]:[line-height:1.4] [&_strong]:block [&_strong_a]:text-foreground [&_strong_a]:no-underline [&_strong_a:hover]:underline [.app-shell_&]:min-w-0'
          }
        >
          <strong
            className={
              'recognized-author-name [.post-author_&]:flex [.post-author_&]:flex-wrap [.post-author_&]:items-center [.post-author_&]:gap-1.5 [.discussion-byline_&]:flex [.discussion-byline_&]:flex-wrap [.discussion-byline_&]:items-center [.discussion-byline_&]:gap-1.5 [.post-author_&_>_a:not(.rank-crown)]:[overflow-wrap:anywhere] max-[48rem]:[.discussion-byline_&]:min-w-0 [.app-shell_&]:flex [.app-shell_&]:flex-wrap [.app-shell_&]:items-center [.app-shell_&]:[gap:0.25rem_0.375rem] max-[48rem]:[.app-shell_.post-heading_&]:text-sm'
            }
          >
            {post.author.username &&
            userHref &&
            isRouteReady(userHref, READY_ROUTES) ? (
              <ProfileLink username={post.author.username}>
                {post.author.displayName}
              </ProfileLink>
            ) : (
              post.author.displayName
            )}
            {post.author.username && (
              <RankCrown rank={post.author.leaderboardRank} />
            )}
          </strong>
          <div
            className={
              'post-author-meta flex flex-wrap items-center gap-x-2 [.app-shell_.post-heading_&_p]:m-0 max-[48rem]:gap-x-0.5'
            }
          >
            <p>
              {post.author.username && (
                <span
                  className={
                    'post-handle max-[48rem]:[.app-shell_.post-heading_&]:hidden'
                  }
                >
                  @{post.author.username} <span aria-hidden="true">· </span>
                </span>
              )}
              <time dateTime={post.createdAt}>
                {post.id.startsWith('pending:') ? (
                  createdLabel
                ) : (
                  <Link
                    className={
                      'post-time-link text-[inherit] no-underline [&:hover]:underline'
                    }
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
        <p className={'post-review mt-4 text-sm'}>
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
        className={`post-text whitespace-pre-wrap [overflow-wrap:anywhere] [line-height:1.65] [margin:1rem_0] [.app-shell_&]:[margin:0.875rem_0] [.app-shell_&]:text-[length:0.9375rem] [.app-shell_&]:max-w-[78ch] max-[48rem]:[.app-shell_&]:text-sm [.pet-social-profile_&]:px-4 [.event-community_&]:[margin:0.875rem_0_0]${!detail && !textExpanded && post.text.length > 160 ? ' post-text-preview [.app-shell_&]:[display:-webkit-box] [.app-shell_&]:[-webkit-box-orient:vertical] [.app-shell_&]:[-webkit-line-clamp:4] [.app-shell_&]:overflow-hidden max-[48rem]:[.app-shell_&]:[-webkit-line-clamp:3]' : ''}`}
      >
        {post.text}
      </p>
      {!detail && post.text.length > 160 && (
        <Button
          className={
            'post-text-toggle [.app-shell_&]:text-[color:var(--teal)] [.app-shell_&]:[padding:0_0.25rem] [.app-shell_&]:mt-[-0.5rem] [.app-shell_&]:text-[0.8125rem]'
          }
          variant="ghost"
          aria-expanded={textExpanded}
          aria-controls={textId}
          onClick={() => setTextExpanded(!textExpanded)}
        >
          {textExpanded ? 'Show less' : 'Read more'}
        </Button>
      )}
      {!!post.linkedEntities.length && (
        <ul
          className={
            'post-identities list-none p-0 flex flex-wrap gap-3 mb-4 text-sm [&_a]:text-[color:var(--teal)] [&_a]:font-semibold [&_a]:[text-underline-offset:4px] [&_small]:text-muted-foreground [.app-shell_&]:gap-1.5 [.app-shell_&]:[margin:0.75rem_0] [.app-shell_&]:items-center [.app-shell_&]:my-1.5 [.app-shell_&_a]:inline-flex [.app-shell_&_a]:items-center [.app-shell_&_a]:gap-1 [.app-shell_&_a]:rounded-[0.375rem] [.app-shell_&_a]:[padding:0.1875rem_0.5rem] [.app-shell_&_a]:bg-muted [.app-shell_&_a]:no-underline [.app-shell_&_a]:text-xs [.app-shell_&_a]:min-h-11 [.app-shell_&_a:hover]:bg-accent'
          }
          aria-label="Connected stories"
        >
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
                className={
                  'post-tags-toggle [.app-shell_&]:text-[color:var(--teal)] [.app-shell_&]:text-xs [.app-shell_&]:[padding:0.25rem_0.5rem]'
                }
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
            'post-photos grid gap-3 [margin:1rem_-1.25rem] [&_img]:w-full [&_img]:h-auto [&_img]:max-h-136 [&_img]:object-cover [&_figcaption]:[padding:0.5rem_1.25rem] [&_figcaption]:text-sm [&_>_p]:[padding:0.5rem_1.25rem] [&_>_p]:text-sm max-[48rem]:ml-[-1rem] max-[48rem]:mr-[-1rem] [.app-shell_&]:[margin:0.875rem_-1.125rem_0.5rem] [.app-shell_&]:gap-1 [.app-shell_&]:bg-[#f0f1f2] [.app-shell_&_img]:block [.app-shell_&_img]:w-full [.app-shell_&_img]:h-auto [.app-shell_&_img]:max-h-104 [.app-shell_&_img]:object-contain max-[48rem]:[.app-shell_&]:mx-[-0.875rem] max-[48rem]:[.app-shell_&_img]:max-h-80 [.pet-social-profile_&]:px-4 [.pet-social-profile_&]:mb-4 [.pet-social-profile_&_>_img]:rounded-xl' +
            (post.media.length > 1
              ? ' post-photos-multiple [.app-shell_&]:grid-cols-2 [.app-shell_&_img]:[aspect-ratio:1] [.app-shell_&_img]:h-full [.app-shell_&_img]:object-cover [.app-shell_&_img]:max-h-80 [.app-shell_&_img:first-child:nth-last-child(3)]:[grid-column:1_/_-1] [.app-shell_&_img:first-child:nth-last-child(3)]:[aspect-ratio:16/9]'
              : '')
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
          <div
            className={
              'post-photos grid gap-3 [margin:1rem_-1.25rem] [&_img]:w-full [&_img]:h-auto [&_img]:max-h-136 [&_img]:object-cover [&_figcaption]:[padding:0.5rem_1.25rem] [&_figcaption]:text-sm [&_>_p]:[padding:0.5rem_1.25rem] [&_>_p]:text-sm max-[48rem]:ml-[-1rem] max-[48rem]:mr-[-1rem] [.app-shell_&]:[margin:0.875rem_-1.125rem_0.5rem] [.app-shell_&]:gap-1 [.app-shell_&]:bg-[#f0f1f2] [.app-shell_&_img]:block [.app-shell_&_img]:w-full [.app-shell_&_img]:h-auto [.app-shell_&_img]:max-h-104 [.app-shell_&_img]:object-contain max-[48rem]:[.app-shell_&]:mx-[-0.875rem] max-[48rem]:[.app-shell_&_img]:max-h-80 [.pet-social-profile_&]:px-4 [.pet-social-profile_&]:mb-4 [.pet-social-profile_&_>_img]:rounded-xl'
            }
          >
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
      {post.moderation === 'published' && (
        <ParticipantFaces
          people={post.participants ?? []}
          count={post.participantCount}
          href={`/community/${encodeURIComponent(post.id)}#discussion`}
        />
      )}
      <footer
        className={
          'post-footer text-muted-foreground flex justify-between flex-wrap gap-3 text-[0.8125rem] mt-3 [.app-shell_&]:mt-1 [.app-shell_&]:text-[0.6875rem] [.app-shell_&]:text-muted-foreground [.app-shell_&_a]:text-muted-foreground [.app-shell_&_a]:no-underline [.app-shell_&_a:hover]:text-[color:var(--teal)] [.app-shell_&_a:hover]:underline'
        }
      >
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
        <section
          id="discussion"
          className={
            'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
          }
        >
          <h2>Join the conversation</h2>
          <Discussion
            target={{ kind: 'post', id: post.id }}
            returnTo={`/community/${encodeURIComponent(post.id)}`}
            photoContext={post.linkedEntities}
          />
        </section>
      )}
    </Card>
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
