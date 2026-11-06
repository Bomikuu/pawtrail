'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { ButtonLink } from '@/components/ui/button-link'
import { Textarea } from '@/components/ui/textarea'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { ImagePlus, PawPrint } from 'lucide-react'
import { toast } from 'sonner'
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
  prompt = 'What’s your pet up to?',
  compact = false,
}: {
  options: LinkedOption[]
  post?: Post
  initialRefs?: PostInput['refs']
  initialType?: PostInput['type']
  prompt?: string
  compact?: boolean
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
  const [writing, setWriting] = useState(
    !compact || !!post || initialType === 'photo',
  )
  const [uploadsReady, setUploadsReady] = useState(true)
  const [completed, setCompleted] = useState<Post>()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const retry = useRef({ input: '', key: '' })
  const client = useQueryClient()
  if (session.actor && compact && !writing && !completed)
    return (
      <section
        className={
          'post-composer bg-card [border:1px_solid_var(--border)] p-5 mb-6 rounded-xl [&_h2]:text-lg [&_h2]:mb-4 [&_label]:block [&_label]:mb-2 max-[48rem]:p-4 [.app-shell_&]:border-border [.app-shell_&]:rounded-xl [.app-shell_&]:[padding:1rem_1.125rem] [.app-shell_&]:[margin:0_0_1rem] [.app-shell_&_[data-slot=textarea]]:bg-background [.app-shell_&_[data-slot=textarea]]:border-[transparent] [.app-shell_&_[data-slot=textarea]]:min-h-16 [.app-shell_&_[data-slot=textarea]]:[resize:none] [.app-shell_&_[data-slot=textarea]]:rounded-xl [.app-shell_&_[data-slot=textarea]]:text-[length:0.9375rem] [.app-shell_&_[data-slot=textarea]]:[line-height:1.5] max-[48rem]:[.app-shell_&]:p-3.5 [.pet-community-composer_&]:[border:0] [.pet-community-composer_&]:rounded-[0] [.pet-community-composer_&]:m-0 composer-collapsed [.app-shell_&]:py-3'
        }
        aria-label="Share an update"
      >
        <div
          className={
            'composer-entry flex items-start gap-3 [.composer-collapsed_&]:items-center [.composer-collapsed_&]:gap-2 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:px-2.5 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:text-[color:var(--teal)]'
          }
        >
          <CommunityAvatar
            name={session.actor.displayName}
            image={session.actor.avatar}
            userId={session.actor.id}
          />
          <Button
            className={
              'composer-prompt [.composer-entry_&]:[flex:1] [.composer-entry_&]:justify-start [.composer-entry_&]:rounded-full [.composer-entry_&]:bg-background [.composer-entry_&]:text-muted-foreground [.composer-entry_&]:font-normal [.composer-entry_&]:text-[length:0.9375rem] [.composer-entry_&:hover]:bg-[#e9ecef] [.composer-collapsed_&]:whitespace-normal [.composer-collapsed_&]:text-left [.composer-collapsed_&]:px-3 [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
            }
            variant="ghost"
            onClick={() => setWriting(true)}
          >
            {prompt}
          </Button>
          <Button
            variant="ghost"
            aria-label="Add photos to your update"
            onClick={() => {
              setWriting(true)
              setExpanded(true)
            }}
          >
            <ImagePlus size={21} aria-hidden="true" />
          </Button>
        </div>
      </section>
    )
  if (!session.actor)
    return (
      <section
        className={`post-composer bg-card [border:1px_solid_var(--border)] p-5 mb-6 rounded-xl [&_h2]:text-lg [&_h2]:mb-4 [&_label]:block [&_label]:mb-2 max-[48rem]:p-4 [.app-shell_&]:border-border [.app-shell_&]:rounded-xl [.app-shell_&]:[padding:1rem_1.125rem] [.app-shell_&]:[margin:0_0_1rem] [.app-shell_&_[data-slot=textarea]]:bg-background [.app-shell_&_[data-slot=textarea]]:border-[transparent] [.app-shell_&_[data-slot=textarea]]:min-h-16 [.app-shell_&_[data-slot=textarea]]:[resize:none] [.app-shell_&_[data-slot=textarea]]:rounded-xl [.app-shell_&_[data-slot=textarea]]:text-[length:0.9375rem] [.app-shell_&_[data-slot=textarea]]:[line-height:1.5] max-[48rem]:[.app-shell_&]:p-3.5 [.pet-community-composer_&]:[border:0] [.pet-community-composer_&]:rounded-[0] [.pet-community-composer_&]:m-0${compact ? ' composer-collapsed [.app-shell_&]:py-3' : ''}`}
      >
        <div
          className={
            'composer-entry flex items-start gap-3 [.composer-collapsed_&]:items-center [.composer-collapsed_&]:gap-2 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:px-2.5 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:text-[color:var(--teal)]'
          }
        >
          <CommunityAvatar name="Your story" />
          <ButtonLink
            className={
              'composer-prompt [.composer-entry_&]:[flex:1] [.composer-entry_&]:justify-start [.composer-entry_&]:rounded-full [.composer-entry_&]:bg-background [.composer-entry_&]:text-muted-foreground [.composer-entry_&]:font-normal [.composer-entry_&]:text-[length:0.9375rem] [.composer-entry_&:hover]:bg-[#e9ecef] [.composer-collapsed_&]:whitespace-normal [.composer-collapsed_&]:text-left [.composer-collapsed_&]:px-3 [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
            }
            variant="ghost"
            href={loginPath('/community/create')}
          >
            {compact ? 'Sign in to share an update' : prompt}
          </ButtonLink>
        </div>
        {!compact && (
          <div
            className={
              'composer-toolbar flex items-center justify-between gap-2 [border-top:1px_solid_var(--social-line)] pt-2.5 [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-2 [&_>_span]:text-muted-foreground [&_>_span]:text-[0.8125rem] [&_[data-slot=button]]:text-[0.8125rem] [&_[data-slot=button]]:min-h-10 [&_[data-slot=button]]:[padding:0.5rem_0.75rem] [&_.ui-button-ghost]:text-muted-foreground [&_.ui-button-ghost_svg]:text-[color:var(--teal)] [&_.ui-button-primary]:min-w-28 [&_.ui-button-primary]:rounded-full [.app-shell_&_.ui-button-primary]:rounded-xl'
            }
          >
            <span>
              <ImagePlus size={18} aria-hidden="true" />
              Photos & updates
            </span>
            <ButtonLink href={loginPath('/community/create')}>
              Sign in to post
            </ButtonLink>
          </div>
        )}
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
        participants: [],
        participantCount: 0,
        author: {
          badges: [],
          leaderboardRank: null,
          displayName: session.actor!.displayName,
          username: null,
          avatar: session.actor!.avatar ?? null,
        },
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
      setRefs(initialRefs)
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
    <form
      onSubmit={submit}
      className={
        'post-composer bg-card [border:1px_solid_var(--border)] p-5 mb-6 rounded-xl [&_h2]:text-lg [&_h2]:mb-4 [&_label]:block [&_label]:mb-2 max-[48rem]:p-4 [.app-shell_&]:border-border [.app-shell_&]:rounded-xl [.app-shell_&]:[padding:1rem_1.125rem] [.app-shell_&]:[margin:0_0_1rem] [.app-shell_&_[data-slot=textarea]]:bg-background [.app-shell_&_[data-slot=textarea]]:border-[transparent] [.app-shell_&_[data-slot=textarea]]:min-h-16 [.app-shell_&_[data-slot=textarea]]:[resize:none] [.app-shell_&_[data-slot=textarea]]:rounded-xl [.app-shell_&_[data-slot=textarea]]:text-[length:0.9375rem] [.app-shell_&_[data-slot=textarea]]:[line-height:1.5] max-[48rem]:[.app-shell_&]:p-3.5 [.pet-community-composer_&]:[border:0] [.pet-community-composer_&]:rounded-[0] [.pet-community-composer_&]:m-0'
      }
      aria-busy={pending}
      noValidate
    >
      {post && <h2>Edit your story</h2>}
      <div
        className={
          'composer-entry flex items-start gap-3 [.composer-collapsed_&]:items-center [.composer-collapsed_&]:gap-2 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:px-2.5 [.composer-collapsed_&_>_[data-slot=button]:last-child:not(.composer-prompt)]:text-[color:var(--teal)]'
        }
      >
        <CommunityAvatar
          name={session.actor.displayName}
          image={session.actor.avatar}
          userId={session.actor.id}
        />
        <div className={'composer-writing [flex:1] min-w-0'}>
          <label htmlFor={id} className="sr-only">
            Your update
          </label>
          <Textarea
            id={id}
            autoFocus={compact}
            value={text}
            maxLength={2000}
            rows={2}
            disabled={pending || changing}
            onChange={(event) => setText(event.target.value)}
            placeholder={prompt + '…'}
            aria-invalid={!!error}
            aria-describedby={`${id}-help`}
          />
        </div>
      </div>
      <p
        id={`${id}-help`}
        className={
          'composer-help text-muted-foreground text-sm [margin:0.5rem_0_1rem] [.app-shell_&]:[margin:0.5rem_0_0.625rem_3.5rem] [.app-shell_&]:text-[0.6875rem] [.app-shell_&]:text-muted-foreground max-[48rem]:[.app-shell_&]:text-[0.625rem] max-[48rem]:[.app-shell_&]:ml-0'
        }
      >
        {text.length > 0 && <span>{text.length}/2,000 · </span>}Posts are
        reviewed before appearing publicly.
      </p>
      <div
        className={
          'composer-toolbar flex items-center justify-between gap-2 [border-top:1px_solid_var(--social-line)] pt-2.5 [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-2 [&_>_span]:text-muted-foreground [&_>_span]:text-[0.8125rem] [&_[data-slot=button]]:text-[0.8125rem] [&_[data-slot=button]]:min-h-10 [&_[data-slot=button]]:[padding:0.5rem_0.75rem] [&_.ui-button-ghost]:text-muted-foreground [&_.ui-button-ghost_svg]:text-[color:var(--teal)] [&_.ui-button-primary]:min-w-28 [&_.ui-button-primary]:rounded-full [.app-shell_&_.ui-button-primary]:rounded-xl'
        }
      >
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          disabled={pending}
        >
          <ImagePlus size={19} aria-hidden="true" />
          Photos
          <span className={'composer-details-label max-[23rem]:hidden'}>
            {' '}
            & details
          </span>
          <PawPrint size={17} aria-hidden="true" />
        </Button>
        <Button
          type="submit"
          loading={pending}
          disabled={pending || changing || !uploadsReady || !text.trim()}
        >
          {pending ? 'Submitting…' : 'Submit post'}
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
        {compact && !post && !text && !assets.length && !retained.length && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setWriting(false)}
          >
            Close composer
          </Button>
        )}
      </div>
      <fieldset
        hidden={!expanded}
        disabled={pending || changing}
        className={
          'composer-details mt-6 p-3 [border:0] bg-[#fafbfc] rounded-[0.625rem] [&_legend]:font-bold [&_legend]:mb-3'
        }
      >
        <legend>Story details</legend>
        <div
          className={
            'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
          }
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
