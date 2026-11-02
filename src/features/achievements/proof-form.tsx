'use client'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
import type { ResourceRef } from '@/types/common'
import { getBrowserApi } from '@/lib/api/client'
import { toast } from '@/components/ui/sonner'
import { achievementProofInputSchema, type AchievementProof } from './schemas'
import type { BadgeDefinition } from './catalog'

export type ProofChoice = { ref: ResourceRef; title: string }
export function ProofForm({
  badge,
  choices,
  now,
  proof,
  close,
}: {
  badge: BadgeDefinition
  choices: ProofChoice[]
  now: string
  proof?: AchievementProof
  close: () => void
}) {
  const id = useId(),
    client = useQueryClient()
  const kind =
    badge.proofContext === 'friend'
      ? 'user'
      : badge.proofContext === 'campaign'
        ? 'fundraiser'
        : badge.proofContext!
  const options = choices.filter((choice) => choice.ref.kind === kind)
  const [recordId, setRecordId] = useState(
    proof?.ref.id ?? options[0]?.ref.id ?? '',
  )
  const [occurredAt, setOccurredAt] = useState(
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(proof?.occurredAt ?? now))
      .replace(' ', 'T'),
  )
  const [details, setDetails] = useState(proof?.details ?? ''),
    [assets, setAssets] = useState<MediaAsset[]>([])
  const [retained, setRetained] = useState(proof?.mediaIds ?? []),
    [ready, setReady] = useState(true)
  const [pending, setPending] = useState(false),
    [error, setError] = useState('')
  const busy = useRef(false),
    receipt = useRef({ fingerprint: '', key: '' })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy.current) close()
      }}
    >
      <DialogContent
        className="achievement-proof-dialog"
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        <DialogTitle>
          {proof ? 'Revise evidence' : 'Submit evidence'}: {badge.title}
        </DialogTitle>
        <DialogDescription>
          {badge.rule} Your details and attachments are private to you and
          authorized reviewers.
        </DialogDescription>
        <form
          className="achievement-proof-form"
          noValidate
          aria-busy={pending}
          onSubmit={async (event) => {
            event.preventDefault()
            if (busy.current) return
            const observed = new Date(
              occurredAt + (occurredAt.length === 16 ? ':00' : '') + '+08:00',
            )
            if (!occurredAt || !Number.isFinite(observed.getTime())) {
              setError('Choose a valid Manila activity date and time.')
              return
            }
            const parsed = achievementProofInputSchema.safeParse({
              ...(proof
                ? { id: proof.id, expectedVersion: proof.version }
                : {}),
              badgeId: badge.id,
              ref: { kind, id: recordId.trim() },
              occurredAt: observed.toISOString(),
              details,
              mediaIds: [...retained, ...assets.map((asset) => asset.id)],
            })
            if (!parsed.success) {
              setError(
                'Choose a record and date, and describe your contribution in 20–2,000 characters.',
              )
              return
            }
            const fingerprint = JSON.stringify(parsed.data)
            if (receipt.current.fingerprint !== fingerprint)
              receipt.current = { fingerprint, key: crypto.randomUUID() }
            busy.current = true
            setPending(true)
            setError('')
            try {
              await getBrowserApi().achievements.submitProof(parsed.data, {
                idempotencyKey: receipt.current.key,
              })
              await client.invalidateQueries()
              toast.success('Evidence submitted for independent review')
              close()
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Could not submit. Your details are still here; try again.',
              )
            } finally {
              busy.current = false
              setPending(false)
            }
          }}
        >
          <fieldset disabled={pending}>
            <legend className="sr-only">Private contribution evidence</legend>
            <label htmlFor={id + '-record'}>
              {kind === 'user'
                ? 'Friend’s public username or ID'
                : 'Related ' + kind}
            </label>
            {kind === 'user' ? (
              <Input
                id={id + '-record'}
                value={recordId}
                onChange={(event) => setRecordId(event.target.value)}
                autoComplete="off"
              />
            ) : (
              <Select
                id={id + '-record'}
                value={recordId}
                onChange={(event) => setRecordId(event.target.value)}
              >
                <option value="">Choose a record</option>
                {options.map((choice) => (
                  <option key={choice.ref.id} value={choice.ref.id}>
                    {choice.title}
                  </option>
                ))}
              </Select>
            )}
            {kind !== 'user' && (
              <details>
                <summary>Use a record ID instead</summary>
                <Input
                  aria-label={'Related ' + kind + ' record ID'}
                  value={recordId}
                  onChange={(event) => setRecordId(event.target.value)}
                />
              </details>
            )}
            {!options.length && kind !== 'user' && (
              <p>
                There are no eligible records in the current list. Publish a
                relevant record first or return when one is available.
              </p>
            )}
            <label htmlFor={id + '-time'}>
              Activity date and time (Manila)
            </label>
            <Input
              id={id + '-time'}
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
            />
            <label htmlFor={id + '-details'}>
              What did you contribute, and how can it be confirmed?
            </label>
            <Textarea
              id={id + '-details'}
              rows={5}
              value={details}
              maxLength={2000}
              onChange={(event) => setDetails(event.target.value)}
              aria-describedby={id + '-help'}
            />
            <p id={id + '-help'} className="field-help">
              Include the activity, your role and useful verification context.
              Do not include precise public animal locations.
            </p>
            {!!retained.length && (
              <ul>
                {retained.map((mediaId, index) => (
                  <li key={mediaId}>
                    Existing private attachment {index + 1}{' '}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setRetained((ids) => ids.filter((id) => id !== mediaId))
                      }
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <UploadField
              purpose="private_evidence"
              value={assets}
              onChange={setAssets}
              maxAttachments={6 - retained.length}
              onReadyChange={setReady}
              disabled={pending}
            />
          </fieldset>
          {error && <p role="alert">{error}</p>}
          <div className="dialog-actions">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !ready || !recordId.trim()}
            >
              {pending ? 'Submitting…' : 'Submit for review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
