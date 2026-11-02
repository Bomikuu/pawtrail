'use client'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { optimisticPostChange, invalidateCommunity } from './mutations'
import { ReportDialog } from './report-dialog'
import type { Post } from './types'
export function PostActions({
  post,
  onEdit,
  onDeleted,
}: {
  post: Post
  onEdit(): void
  onDeleted(): void
}) {
  const { session, pending: changing } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const busy = useRef(false)
  const client = useQueryClient()
  async function toggle(kind: 'reaction' | 'saved') {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const api = getBrowserApi().community
      await optimisticPostChange<Post | void>(
        client,
        session.cacheScope,
        post.id,
        (current) =>
          kind === 'reaction'
            ? {
                ...current,
                viewerReacted: !post.viewerReacted,
                reactionCount:
                  current.reactionCount + (post.viewerReacted ? -1 : 1),
              }
            : { ...current, viewerSaved: !post.viewerSaved },
        () =>
          kind === 'reaction'
            ? api.setReaction(post.id, !post.viewerReacted)
            : api.setSaved(post.id, !post.viewerSaved),
      )
      await invalidateCommunity(client, session.cacheScope)
    } catch {
      setError(
        'Couldn’t save that change. Your previous state is restored; try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  async function share() {
    const url = new URL(
      `/community/${encodeURIComponent(post.id)}`,
      window.location.origin,
    ).href
    if (navigator.share) {
      try {
        await navigator.share({ title: 'A story on PawTrail', url })
        return
      } catch (reason) {
        if (reason instanceof Error && reason.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Story link copied')
    } catch {
      setShareUrl(url)
    }
  }
  const working = pending || changing || post.id.startsWith('pending:')
  return (
    <div className="post-actions">
      <div className="social-actions-row">
        {session.actor ? (
          <>
            <Button
              variant="ghost"
              aria-pressed={post.viewerReacted}
              aria-label={
                (post.viewerReacted ? 'Unlike post, ' : 'Like post, ') +
                post.reactionCount +
                ' reactions'
              }
              disabled={working || post.moderation !== 'published'}
              onClick={() => void toggle('reaction')}
            >
              <Heart
                size={19}
                aria-hidden="true"
                fill={post.viewerReacted ? 'currentColor' : 'none'}
              />
              <span className="social-action-label">
                {post.viewerReacted ? 'Liked' : 'Like'}
              </span>
              <span>{post.reactionCount}</span>
            </Button>
          </>
        ) : (
          <ButtonLink
            variant="ghost"
            aria-label="Sign in to like this post"
            href={loginPath(`/community/${encodeURIComponent(post.id)}`)}
          >
            <Heart size={19} aria-hidden="true" />
            <span className="social-action-label">Like</span>{' '}
            {post.reactionCount}
          </ButtonLink>
        )}
        {!post.id.startsWith('pending:') && (
          <ButtonLink
            variant="ghost"
            href={'/community/' + encodeURIComponent(post.id) + '#discussion'}
            aria-label={post.commentCount + ' comments. Join the conversation'}
          >
            <MessageCircle size={19} aria-hidden="true" />
            <span className="social-action-label">Comment</span>
            {post.commentCount}
          </ButtonLink>
        )}
        <Button
          variant="ghost"
          onClick={() => void share()}
          aria-label="Share post"
          title="Share post"
          disabled={post.moderation !== 'published'}
        >
          <Share2 size={19} aria-hidden="true" />
          <span className="social-action-label">Share</span>
        </Button>
        {session.actor && (
          <Button
            variant="ghost"
            className="social-save"
            aria-label={post.viewerSaved ? 'Unsave post' : 'Save post'}
            title={post.viewerSaved ? 'Unsave post' : 'Save post'}
            aria-pressed={post.viewerSaved}
            disabled={working}
            onClick={() => void toggle('saved')}
          >
            <Bookmark
              size={19}
              aria-hidden="true"
              fill={post.viewerSaved ? 'currentColor' : 'none'}
            />
          </Button>
        )}
        {post.moderation === 'published' && (
          <ReportDialog
            target={{ kind: 'post', id: post.id }}
            returnTo={`/community/${encodeURIComponent(post.id)}`}
            compact
          />
        )}
        {post.viewerOwns && (
          <>
            <Button
              variant="ghost"
              disabled={working}
              onClick={onEdit}
              aria-label="Edit your post"
              title="Edit post"
            >
              <Pencil size={17} aria-hidden="true" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  disabled={working}
                  aria-label="Delete your post"
                  title="Delete post"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </Button>
              }
              title="Delete this story?"
              description="This post will no longer appear in the community. This cannot be undone."
              confirmLabel="Delete story"
              onConfirm={async () => {
                await getBrowserApi().community.remove(post.id)
                await invalidateCommunity(client, session.cacheScope)
                onDeleted()
                toast.success('Story deleted')
              }}
            />
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {shareUrl && (
        <div>
          <label htmlFor={`share-${post.id}`}>Copy this story link</label>
          <Input
            id={`share-${post.id}`}
            value={shareUrl}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </div>
      )}
    </div>
  )
}
