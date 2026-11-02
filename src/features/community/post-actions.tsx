'use client'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, Bookmark, Share2 } from 'lucide-react'
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
      <div className="community-choice-row">
        {session.actor ? (
          <>
            <Button
              variant="ghost"
              aria-pressed={post.viewerReacted}
              disabled={working || post.moderation !== 'published'}
              onClick={() => void toggle('reaction')}
            >
              <Heart size={18} aria-hidden="true" />
              {post.viewerReacted ? 'Reacted' : 'React'} · {post.reactionCount}
            </Button>
            <Button
              variant="ghost"
              aria-pressed={post.viewerSaved}
              disabled={working}
              onClick={() => void toggle('saved')}
            >
              <Bookmark size={18} aria-hidden="true" />
              {post.viewerSaved ? 'Saved' : 'Save'}
            </Button>
          </>
        ) : (
          <ButtonLink
            variant="ghost"
            href={loginPath(`/community/${encodeURIComponent(post.id)}`)}
          >
            Sign in to react or save
          </ButtonLink>
        )}
        <Button
          variant="ghost"
          onClick={() => void share()}
          disabled={post.moderation !== 'published'}
        >
          <Share2 size={18} aria-hidden="true" />
          Share
        </Button>
        {post.moderation === 'published' && (
          <ReportDialog
            target={{ kind: 'post', id: post.id }}
            returnTo={`/community/${encodeURIComponent(post.id)}`}
          />
        )}
        {post.viewerOwns && (
          <>
            <Button variant="ghost" disabled={working} onClick={onEdit}>
              Edit
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" disabled={working}>
                  Delete
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
