'use client'
import { useId, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { toast } from 'sonner'
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
      <div className={'review-warning p-4 [border:1px_solid_var(--border)]'}>
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
      className={
        'review-panel grid gap-6 min-w-0 py-6 [border-block:1px_solid_var(--border)]'
      }
      aria-label={`${item.kind} review of ${item.title}`}
    >
      <header>
        <h2>{item.title}</h2>
        <div
          className={
            'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
          }
        >
          <StatusBadge>
            {verification ? 'Verification review' : 'Publication review'}
          </StatusBadge>
          <StatusBadge tone={item.state === 'pending' ? 'warning' : 'neutral'}>
            {item.state}
          </StatusBadge>
        </div>
      </header>
      <p
        className={
          'field-hint text-sm text-muted-foreground [.dark_&]:text-muted-foreground'
        }
      >
        {item.ref.kind} · Version {item.version} · {item.provenance.label}
      </p>
      <p
        className={
          'post-text whitespace-pre-wrap [overflow-wrap:anywhere] [line-height:1.65] [margin:1rem_0] [.app-shell_&]:[margin:0.875rem_0] [.app-shell_&]:text-[length:0.9375rem] [.app-shell_&]:max-w-[78ch] max-[48rem]:[.app-shell_&]:text-sm [.pet-social-profile_&]:px-4 [.event-community_&]:[margin:0.875rem_0_0]'
        }
      >
        {item.text}
      </p>
      {item.publicImages.length > 0 && (
        <div
          className={
            'review-media grid grid-cols-[repeat(auto-fit,_minmax(min(100%,_16rem),_1fr))] gap-4 [&_img]:w-full [&_img]:h-auto [&_img]:object-contain'
          }
        >
          {item.publicImages.map((image) => (
            <AnimalImage key={image.id} image={image} />
          ))}
        </div>
      )}
      {item.media.length > 0 && (
        <div
          className={
            'review-media grid grid-cols-[repeat(auto-fit,_minmax(min(100%,_16rem),_1fr))] gap-4 [&_img]:w-full [&_img]:h-auto [&_img]:object-contain'
          }
        >
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
          <p
            className={
              'field-hint text-sm text-muted-foreground [.dark_&]:text-muted-foreground'
            }
          >
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
              <div
                className={
                  'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
                }
              >
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
        <div
          className={
            'discussion-form grid gap-3 [&_>_[data-slot=button]]:[justify-self:start] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-[0.875rem] [.app-shell_&]:p-4 [.app-shell_&]:bg-card [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.event-community_&]:p-5 [.event-community_&]:[border:1px_solid_var(--border)] [.event-community_&]:rounded-2xl [.event-community_&]:bg-card [.event-community_&_>_[data-slot=button]]:[justify-self:end] [.event-community_&_>_[data-slot=button]]:rounded-[2rem] [.event-community_&_textarea]:min-h-24 [.event-community_&_textarea]:[resize:vertical] max-[40rem]:[.event-community_&]:p-4'
          }
        >
          <label htmlFor={id}>Audit reason</label>
          <Textarea
            id={id}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={2000}
            disabled={pending}
            rows={3}
          />
          <p
            className={
              'field-hint text-sm text-muted-foreground [.dark_&]:text-muted-foreground'
            }
          >
            This explanation is recorded permanently and sent to the author. Do
            not include reporter identities or private evidence details.
          </p>
          <div
            className={
              'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
            }
          >
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
