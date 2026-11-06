'use client'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { SignInPrompt } from '@/components/shared/sign-in-prompt'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ResourceRef } from '@/types/common'
import { commentInputSchema } from './schemas'
export function CommentForm({
  target,
  returnTo,
  subject,
}: {
  target: ResourceRef
  returnTo: string
  subject?: string
}) {
  const { session, pending: changing } = useSession()
  const client = useQueryClient()
  const id = useId()
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const busy = useRef(false)
  const retry = useRef({ text: '', key: '' })
  if (!session.actor)
    return (
      <SignInPrompt
        href={loginPath(returnTo)}
        placeholder={
          subject
            ? `Have a question or an update about ${subject}?`
            : 'Add a thoughtful comment…'
        }
      />
    )
  return (
    <form
      className={
        'discussion-form grid gap-3 [&_>_[data-slot=button]]:[justify-self:start] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-[0.875rem] [.app-shell_&]:p-4 [.app-shell_&]:bg-card [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.event-community_&]:p-5 [.event-community_&]:[border:1px_solid_var(--border)] [.event-community_&]:rounded-2xl [.event-community_&]:bg-card [.event-community_&_>_[data-slot=button]]:[justify-self:end] [.event-community_&_>_[data-slot=button]]:rounded-[2rem] [.event-community_&_textarea]:min-h-24 [.event-community_&_textarea]:[resize:vertical] max-[40rem]:[.event-community_&]:p-4'
      }
      onSubmit={async (event) => {
        event.preventDefault()
        if (busy.current) return
        const result = commentInputSchema.safeParse({ text })
        if (!result.success) {
          setError('Write a comment between 1 and 1,000 characters.')
          return
        }
        busy.current = true
        setPending(true)
        setError('')
        setDone(false)
        if (retry.current.text !== result.data.text)
          retry.current = { text: result.data.text, key: crypto.randomUUID() }
        try {
          await getBrowserApi().community.comment(target, result.data, {
            idempotencyKey: retry.current.key,
          })
          setText('')
          retry.current = { text: '', key: '' }
          setDone(true)
          await client.invalidateQueries({
            queryKey: queryKeys(session.cacheScope).all('discussions'),
          })
        } catch {
          setError(
            'Your comment could not be submitted. Your text is kept; try again.',
          )
        } finally {
          busy.current = false
          setPending(false)
        }
      }}
    >
      <label htmlFor={id}>Your comment</label>
      <Textarea
        id={id}
        value={text}
        maxLength={1000}
        rows={3}
        placeholder={
          subject
            ? `Share a kind observation or a useful update about ${subject}…`
            : 'Share a thoughtful observation or a useful update…'
        }
        onChange={(e) => setText(e.target.value)}
        disabled={pending || changing}
        aria-describedby={`${id}-hint`}
      />
      <p
        id={`${id}-hint`}
        className={
          'field-hint text-sm text-muted-foreground [.dark_&]:text-muted-foreground'
        }
      >
        Keep observations kind and useful. Comments appear publicly after
        review. {text.length}/1,000
      </p>
      {error && <p role="alert">{error}</p>}
      {done && (
        <p role="status">Comment submitted for review. It is not public yet.</p>
      )}
      <Button
        type="submit"
        loading={pending}
        disabled={pending || changing || !text.trim()}
      >
        {pending ? 'Submitting…' : 'Submit comment'}
      </Button>
    </form>
  )
}
