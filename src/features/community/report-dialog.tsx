'use client'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Flag } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import type { ResourceRef } from '@/types/common'
import type { ReportReason } from '@/features/moderation/types'
export const reportReasons: Record<ReportReason, string> = {
  animal_welfare: 'Animal welfare concern',
  harassment: 'Harassment',
  misinformation: 'Misinformation',
  spam: 'Spam',
  privacy: 'Privacy concern',
  other: 'Other concern',
}
export function ReportDialog({
  target,
  returnTo,
  compact = false,
}: {
  target: ResourceRef
  returnTo: string
  compact?: boolean
}) {
  const { session, pending: changing } = useSession()
  const id = useId()
  const [reason, setReason] = useState<ReportReason>('animal_welfare')
  const [details, setDetails] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const retry = useRef({ input: '', key: '' })
  if (!session.actor)
    return (
      <ButtonLink
        variant="ghost"
        href={loginPath(returnTo)}
        aria-label="Sign in to report a concern"
        title="Report a concern"
      >
        {compact ? <Flag size={17} aria-hidden="true" /> : 'Sign in to report'}
      </ButtonLink>
    )
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Report a concern"
          title="Report a concern"
        >
          {compact ? <Flag size={17} aria-hidden="true" /> : 'Report'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Report a concern</DialogTitle>
        <DialogDescription>
          Your report is private to the review team. Share enough context for a
          fair review.
        </DialogDescription>
        {done ? (
          <p role="status">
            Report received. A reviewer will assess it; reporting does not
            automatically remove or verify content.
          </p>
        ) : (
          <form
            className={
              'discussion-form grid gap-3 [&_>_[data-slot=button]]:[justify-self:start] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-[0.875rem] [.app-shell_&]:p-4 [.app-shell_&]:bg-card [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.event-community_&]:p-5 [.event-community_&]:[border:1px_solid_var(--border)] [.event-community_&]:rounded-2xl [.event-community_&]:bg-card [.event-community_&_>_[data-slot=button]]:[justify-self:end] [.event-community_&_>_[data-slot=button]]:rounded-[2rem] [.event-community_&_textarea]:min-h-24 [.event-community_&_textarea]:[resize:vertical] max-[40rem]:[.event-community_&]:p-4'
            }
            onSubmit={async (e) => {
              e.preventDefault()
              if (busy.current) return
              busy.current = true
              setPending(true)
              setError('')
              const input = { target, reason, details: details.trim() }
              const fingerprint = JSON.stringify(input)
              if (retry.current.input !== fingerprint)
                retry.current = { input: fingerprint, key: crypto.randomUUID() }
              try {
                await getBrowserApi().moderation.report(input, {
                  idempotencyKey: retry.current.key,
                })
                setDone(true)
              } catch {
                setError(
                  'Your report could not be sent. Your details are kept; try again.',
                )
              } finally {
                busy.current = false
                setPending(false)
              }
            }}
          >
            <fieldset disabled={pending || changing}>
              <legend>Reason for reporting</legend>
              <div
                className={
                  'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
                }
              >
                {Object.entries(reportReasons).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    aria-pressed={reason === value}
                    onClick={() => setReason(value as ReportReason)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <label htmlFor={id}>Additional details (optional)</label>
            <Textarea
              id={id}
              value={details}
              maxLength={2000}
              rows={4}
              onChange={(e) => setDetails(e.target.value)}
              disabled={pending || changing}
            />
            {error && <p role="alert">{error}</p>}
            <Button type="submit" disabled={pending || changing}>
              {pending ? 'Sending…' : 'Submit report'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
