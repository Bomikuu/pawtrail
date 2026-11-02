'use client'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
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
}: {
  target: ResourceRef
  returnTo: string
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
      <ButtonLink variant="ghost" href={loginPath(returnTo)}>
        Sign in to report
      </ButtonLink>
    )
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">Report</Button>
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
            className="discussion-form"
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
              <div className="community-choice-row">
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
