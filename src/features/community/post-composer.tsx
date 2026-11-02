'use client'
import Link from 'next/link'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/sonner'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { postInputSchema } from './schemas'
import { LinkedEntityPicker, type LinkedOption } from './linked-entity-picker'
import { invalidateCommunity, stagePost } from './mutations'
import type { Post, PostInput } from './types'
export const postTypes: Record<PostInput['type'], string> = {
  story: 'Story',
  photo: 'Photo',
  sighting: 'Sighting',
  feeding: 'Feeding',
  rescue: 'Rescue',
  adoption: 'Adoption',
  help: 'Help request',
}
export function PostComposer({
  options,
  post,
  onComplete,
  onCancel,
  initialRefs = [],
  initialType = 'story',
}: {
  options: LinkedOption[]
  post?: Post
  initialRefs?: PostInput['refs']
  initialType?: PostInput['type']
  onComplete?(post: Post): void
  onCancel?(): void
}) {
  const { session, pending: changing } = useSession()
  const id = useId()
  const [text, setText] = useState(post?.text ?? '')
  const [type, setType] = useState<PostInput['type']>(post?.type ?? initialType)
  const [refs, setRefs] = useState(
    post?.refs.filter((ref) =>
      ['animal', 'horde', 'fundraiser', 'mission'].includes(ref.kind),
    ) ?? initialRefs,
  )
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [retained, setRetained] = useState([
    ...(post?.media ?? []),
    ...(post?.ownerMedia ?? []),
  ])
  const [expanded, setExpanded] = useState(!!post || initialType === 'photo')
  const [uploadsReady, setUploadsReady] = useState(true)
  const [completed, setCompleted] = useState<Post>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const retry = useRef({ input: '', key: '' })
  const client = useQueryClient()
  if (!session.actor)
    return (
      <section className="post-composer">
        <h2>Every paw has a story.</h2>
        <p>Share a photograph, a small update, or a way to help.</p>
        <ButtonLink href={loginPath('/community/create')}>
          Sign in to post
        </ButtonLink>
      </section>
    )
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current || !uploadsReady) return
    const result = postInputSchema.safeParse({
      text,
      type,
      refs,
      mediaIds: [
        ...retained.map((asset) => asset.id),
        ...assets.map((asset) => asset.id),
      ],
      ...(post ? { expectedVersion: post.version } : {}),
    })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }
    const fingerprint = JSON.stringify(result.data)
    if (retry.current.input !== fingerprint)
      retry.current = { input: fingerprint, key: crypto.randomUUID() }
    busy.current = true
    setPending(true)
    setError('')
    try {
      const api = getBrowserApi().community
      const operation = () =>
        post
          ? api.update(post.id, result.data, {
              idempotencyKey: retry.current.key,
            })
          : api.create(result.data, { idempotencyKey: retry.current.key })
      const optimistic: Post = {
        id: `pending:${retry.current.key}`,
        createdAt: new Date().toISOString(),
        provenance: { kind: 'demo', label: 'Submitting demo post' },
        authorId: session.actor!.id,
        author: { displayName: session.actor!.displayName, username: null },
        text: result.data.text,
        type,
        refs,
        linkedEntities: options.filter((option) =>
          refs.some(
            (ref) => ref.id === option.ref.id && ref.kind === option.ref.kind,
          ),
        ),
        media: [],
        moderation: 'pending',
        reactionCount: 0,
        commentCount: 0,
        version: 1,
        viewerReacted: false,
        viewerSaved: false,
        viewerOwns: false,
      }
      const created = post
        ? await operation()
        : await stagePost(client, session.cacheScope, optimistic)(operation)
      setCompleted(created)
      setText('')
      setAssets([])
      setRetained([])
      setRefs([])
      retry.current = { input: '', key: '' }
      await invalidateCommunity(client, session.cacheScope)
      toast.success(
        'Submitted for review. Only you and reviewers can see this post.',
      )
      onComplete?.(created)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Couldn’t submit. Your draft is still here; try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} className="post-composer" aria-busy={pending}>
      <h2>
        {post ? 'Edit your story' : 'What’s happening in your care circle?'}
      </h2>
      <label htmlFor={id}>Your update</label>
      <Textarea
        id={id}
        value={text}
        maxLength={2000}
        rows={3}
        disabled={pending || changing}
        onChange={(event) => setText(event.target.value)}
        placeholder="A familiar face, a little progress, a moment worth sharing…"
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`} className="composer-help">
        {text.length}/2,000 · New and edited posts go through review.
      </p>
      <div className="community-choice-row">
        <Button
          type="button"
          variant="outline"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          disabled={pending}
        >
          Photos & story details
        </Button>
        <Button
          type="submit"
          disabled={pending || changing || !uploadsReady || !text.trim()}
        >
          {pending ? 'Submitting…' : 'Submit for review'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel editing
          </Button>
        )}
      </div>
      <fieldset
        hidden={!expanded}
        disabled={pending || changing}
        className="composer-details"
      >
        <legend>Story details</legend>
        <div
          className="community-choice-row"
          role="group"
          aria-label="Story type"
        >
          {Object.entries(postTypes).map(([value, label]) => (
            <Button
              type="button"
              variant="outline"
              key={value}
              aria-pressed={type === value}
              onClick={() => setType(value as PostInput['type'])}
            >
              {label}
            </Button>
          ))}
        </div>
        {!!retained.length && (
          <ul>
            {retained.map((asset) => (
              <li key={asset.id}>
                {asset.alt}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setRetained(retained.filter((item) => item.id !== asset.id))
                  }
                >
                  Detach {asset.alt}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <UploadField
          value={assets}
          onChange={setAssets}
          disabled={pending}
          maxAttachments={6 - retained.length}
          onReadyChange={setUploadsReady}
        />
        <LinkedEntityPicker
          options={options}
          value={refs}
          onChange={setRefs}
          disabled={pending}
        />
      </fieldset>
      {!uploadsReady && (
        <p role="status">
          Upload or remove your selected photos before submitting.
        </p>
      )}
      {completed && (
        <p role="status">
          Your story is pending review.{' '}
          <Link href={`/community/${encodeURIComponent(completed.id)}`}>
            View your story
          </Link>
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </form>
  )
}
