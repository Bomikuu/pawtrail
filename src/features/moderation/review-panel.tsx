'use client'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { toast } from '@/components/ui/sonner'
import { Textarea } from '@/components/ui/textarea'
import { AnimalImage } from '@/components/shared/animal-image'
import { StatusBadge } from '@/components/shared/status-badge'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { ModerationDecision, ModerationItem } from './types'
import { reportReasons } from '@/features/community/report-dialog'
function ReviewMedia({ media }: { media: ModerationItem['media'][number] }) {
  const [shown, setShown] = useState(!media.sensitive)
  const [failed, setFailed] = useState(false)
  if (!shown)
    return (
      <div className="review-warning">
        <p>This review image may show an animal in distress.</p>
        <Button variant="outline" onClick={() => setShown(true)}>
          Show review photograph
        </Button>
      </div>
    )
  if (media.mimeType === 'application/pdf')
    return (
      <ButtonAnchor
        href={media.url}
        target="_blank"
        rel="noreferrer"
        variant="outline"
      >
        Open private evidence document
      </ButtonAnchor>
    )
  return failed ? (
    <p role="alert">
      Review photograph unavailable. Reload the queue before deciding.
    </p>
  ) : (
    <img
      src={media.url}
      alt={media.alt}
      width={640}
      height={480}
      onError={() => setFailed(true)}
    />
  )
}
export function ReviewPanel({
  item,
  onReviewed,
}: {
  item: ModerationItem
  onReviewed(): void
}) {
  const { session, pending: changing } = useSession()
  const client = useQueryClient()
  const router = useRouter()
  const id = useId()
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false)
  const busy = useRef(false)
  const retry = useRef({ input: '', key: '' })
  const verification = item.kind === 'verification'
  const actions: [ModerationDecision['action'], string][] = verification
    ? [
        ['verify', 'Verify'],
        ['revoke_verification', 'Revoke verification'],
      ]
    : item.state === 'pending'
      ? [
          ['publish', 'Publish'],
          ['reject', 'Reject'],
          ['remove', 'Remove'],
        ]
      : item.state !== 'removed'
        ? [['remove', 'Remove']]
        : []
  async function decide(action: ModerationDecision['action']) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    const input = {
      id: item.id,
      expectedVersion: item.version,
      action,
      reason: reason.trim(),
      evidenceRefs: verification ? evidence : [],
    }
    const fingerprint = JSON.stringify(input)
    if (retry.current.input !== fingerprint)
      retry.current = { input: fingerprint, key: crypto.randomUUID() }
    try {
      await getBrowserApi().moderation.review(input, {
        idempotencyKey: retry.current.key,
      })
      // Every viewer-scoped projection (feed, detail, search, profile, notifications) is stale after review.
      await client.invalidateQueries({
        queryKey: ['pawtrail', session.cacheScope],
      })
      router.refresh()
      toast.success('Review saved')
      onReviewed()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setStale(true)
        setError(
          'This record changed. Reload the queue and review its latest version before deciding again.',
        )
      } else
        setError(
          'The review could not be saved. Your reason is kept; try again.',
        )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const disabled =
    pending ||
    changing ||
    stale ||
    !reason.trim() ||
    (verification &&
      (!item.canVerify || !evidence.length || item.state !== 'published'))
  return (
    <section
      className="review-panel"
      aria-label={`${item.kind} review of ${item.title}`}
    >
      <header>
        <h2>{item.title}</h2>
        <div className="community-choice-row">
          <StatusBadge>
            {verification ? 'Verification review' : 'Publication review'}
          </StatusBadge>
          <StatusBadge tone={item.state === 'pending' ? 'warning' : 'neutral'}>
            {item.state}
          </StatusBadge>
        </div>
      </header>
      <p className="field-hint">
        {item.ref.kind} · Version {item.version} · {item.provenance.label}
      </p>
      <p className="post-text">{item.text}</p>
      {item.publicImages.length > 0 && (
        <div className="review-media">
          {item.publicImages.map((image) => (
            <AnimalImage key={image.id} image={image} />
          ))}
        </div>
      )}
      {item.media.length > 0 && (
        <div className="review-media">
          {item.media.map((media) => (
            <ReviewMedia key={media.id} media={media} />
          ))}
        </div>
      )}
      {item.reports.length > 0 && (
        <section>
          <h3>Reported concerns ({item.reportCount})</h3>
          <ul>
            {item.reports.map((report, index) => (
              <li key={index}>
                <strong>{reportReasons[report.reason]}</strong>
                {report.details && <p>{report.details}</p>}
              </li>
            ))}
          </ul>
          <p className="field-hint">
            Reports inform your review; the count does not determine the
            outcome. Reporter identities are confidential.
          </p>
        </section>
      )}
      {verification && (
        <div>
          <p>
            Verification is separate from publication. Demo decisions are
            labeled illustrative and require an independent reviewer.
          </p>
          <p>Current status: {item.verification?.label ?? 'Unverified'}</p>
          {!item.canVerify ? (
            <p role="status">
              You cannot verify your own record or organization, or a subject
              without an established creator.
            </p>
          ) : !item.evidenceIds.length ? (
            <p role="status">
              No eligible subject evidence is attached. Verification is
              unavailable.
            </p>
          ) : (
            <fieldset>
              <legend>Evidence reviewed</legend>
              <div className="community-choice-row">
                {item.evidenceIds.map((evidenceId, index) => (
                  <Button
                    key={evidenceId}
                    type="button"
                    variant="outline"
                    aria-pressed={evidence.includes(evidenceId)}
                    disabled={pending}
                    onClick={() =>
                      setEvidence((current) =>
                        current.includes(evidenceId)
                          ? current.filter((id) => id !== evidenceId)
                          : [...current, evidenceId],
                      )
                    }
                  >
                    Evidence {index + 1}
                  </Button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}
      {actions.length > 0 && (
        <div className="discussion-form">
          <label htmlFor={id}>Audit reason</label>
          <Textarea
            id={id}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
            disabled={pending}
            rows={3}
          />
          <p className="field-hint">
            This explanation is recorded permanently and sent to the author. Do
            not include reporter identities or private evidence details.
          </p>
          <div className="community-choice-row">
            {actions.map(([action, label]) => (
              <Button
                key={action}
                variant={
                  action === 'publish' || action === 'verify'
                    ? 'default'
                    : 'outline'
                }
                disabled={disabled}
                onClick={() => void decide(action)}
              >
                {pending ? 'Saving…' : label}
              </Button>
            ))}
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {stale && (
        <Button variant="outline" onClick={onReviewed}>
          Reload queue
        </Button>
      )}
    </section>
  )
}
