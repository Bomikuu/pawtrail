'use client'
import { useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataState } from '@/components/shared/data-state'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { useSession } from '@/features/auth/session-provider'
import type { Page } from '@/types/common'
import { findBadge } from './catalog'
import { ProofDetails } from './collection'
import type { AchievementProof } from './schemas'

function ReviewCard({ proof }: { proof: AchievementProof }) {
  const { session } = useSession(),
    client = useQueryClient()
  const [reason, setReason] = useState(''),
    [pending, setPending] = useState(false),
    [error, setError] = useState('')
  const busy = useRef(false),
    receipt = useRef({ fingerprint: '', key: '' })
  const badge = findBadge(proof.badgeId),
    self = proof.userId === session.actor?.id
  async function review(decision: 'approved' | 'rejected') {
    if (busy.current || reason.trim().length < 5) return
    busy.current = true
    setPending(true)
    setError('')
    const input = {
        id: proof.id,
        expectedVersion: proof.version,
        decision,
        reason: reason.trim(),
      },
      fingerprint = JSON.stringify(input)
    if (receipt.current.fingerprint !== fingerprint)
      receipt.current = { fingerprint, key: crypto.randomUUID() }
    try {
      await getBrowserApi().achievements.review(input, {
        idempotencyKey: receipt.current.key,
      })
      await client.invalidateQueries()
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : 'The review could not be saved.'
      setError(message)
      throw new Error(message)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <article
      className={
        'achievement-review-card [&_[data-slot=textarea]]:[resize:none] [&_[data-slot=textarea]]:min-h-32 p-5 [margin:1.25rem_0] [border:1px_solid_var(--social-line)] rounded-xl bg-card [&_>_header]:flex [&_>_header]:items-center [&_>_header]:gap-4 [&_header_img]:[flex:0_0_4rem] [&_header_img]:w-16 [&_header_img]:h-16 [&_header_img]:object-contain [&_h2]:text-lg [&_h2]:[margin:0_0_0.375rem] [&_header_p]:text-muted-foreground [&_header_p]:text-[0.8125rem] [&_header_p]:[margin:0.25rem_0] [&_>_label]:block [&_>_label]:[margin:1rem_0_0.5rem] [&_>_label]:font-semibold [&_>_label]:text-sm'
      }
    >
      <header>
        {badge && (
          <img
            src={badge.image}
            width={192}
            height={192}
            alt=""
            loading="lazy"
          />
        )}
        <div>
          <h2>{badge?.title ?? proof.badgeId}</h2>
          <p>
            Submitted by {proof.submitterName ?? proof.userId} · {proof.state}
          </p>
          <p>{badge?.rule}</p>
        </div>
      </header>
      <ProofDetails proof={proof} />
      {self ? (
        <p>
          Independent review required. You cannot review your own submission.
        </p>
      ) : (
        proof.state !== 'rejected' && (
          <>
            <label htmlFor={'reason-' + proof.id}>Review reason</label>
            <Textarea
              id={'reason-' + proof.id}
              value={reason}
              rows={3}
              maxLength={2000}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              placeholder="Explain what was confirmed or what needs correction…"
            />
            <div
              className={
                'workflow-actions flex items-center gap-3 flex-wrap [margin:0.75rem_0] [.discovery-map_&_p]:m-0 [.discovery-map_&_p]:text-sm [.discovery-map_&_p]:text-[#6b625b] max-[48rem]:[&_>_*]:max-w-full [.achievement-review-card_&]:mt-4 [.adoption-story_&]:gap-2.5 [.adoption-story_&_[data-slot=button]]:[flex:1_1_9rem]'
              }
            >
              {proof.state === 'pending' ? (
                <>
                  <Button
                    disabled={pending || reason.trim().length < 5}
                    onClick={() =>
                      void review('approved').catch(() => undefined)
                    }
                  >
                    {pending ? 'Saving…' : 'Approve evidence'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending || reason.trim().length < 5}
                    onClick={() =>
                      void review('rejected').catch(() => undefined)
                    }
                  >
                    Request revision
                  </Button>
                </>
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      disabled={pending || reason.trim().length < 5}
                    >
                      Reverse approval
                    </Button>
                  }
                  title="Reverse this evidence approval?"
                  description="The submission will need revision. Badge eligibility will be recalculated and any affected achievement rewards will receive an append-only Kibble correction."
                  confirmLabel="Reverse approval"
                  onConfirm={() => review('rejected')}
                />
              )}
            </div>
          </>
        )
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  )
}
export function AchievementReview({
  initial,
  scope,
}: {
  initial: Page<AchievementProof>
  scope: string
}) {
  const { session } = useSession(),
    [state, setState] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const query = useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('achievement-proofs', {
      scope: 'review',
      state,
    }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().achievements.proofs(
        { scope: 'review', state, cursor: pageParam, limit: 12 },
        { signal },
      ),
    initialData:
      state === 'pending' && scope === session.cacheScope
        ? { pages: [initial], pageParams: [undefined] }
        : undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  })
  const rows = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.items) ?? []).map((proof) => [
        proof.id,
        proof,
      ]),
    ).values(),
  ]
  return (
    <section
      className={
        'achievement-review [&_>_[data-slot=input]]:max-w-80 [&_>_[data-slot=input]]:[margin:1.5rem_0]'
      }
    >
      <header className="catalog-heading">
        <div>
          <h1>Achievement evidence</h1>
          <p>
            Confirm contribution evidence independently. Private documents stay
            within the review workspace.
          </p>
        </div>
        <ButtonLink href="/dashboard/achievements" variant="outline">
          Your achievements
        </ButtonLink>
      </header>
      <Select
        aria-label="Evidence review status"
        value={state}
        onChange={(event) => setState(event.target.value as typeof state)}
      >
        <SelectOption value="pending">Awaiting review</SelectOption>
        <SelectOption value="approved">Approved evidence</SelectOption>
        <SelectOption value="rejected">Needs revision</SelectOption>
      </Select>
      <DataState
        state={
          query.isPending
            ? 'loading'
            : query.isError && !rows.length
              ? 'error'
              : rows.length
                ? 'ready'
                : 'empty'
        }
        retry={() => void query.refetch()}
        emptyTitle="No evidence in this queue"
        emptyDescription="Choose another review status or return when a member submits evidence."
      >
        {rows.map((proof) => (
          <ReviewCard key={proof.id + ':' + proof.version} proof={proof} />
        ))}
      </DataState>
      {query.isError && !!rows.length && (
        <p role="alert">
          More evidence could not load.{' '}
          <Button variant="ghost" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </p>
      )}
      {query.hasNextPage && (
        <Button
          variant="outline"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more evidence'}
        </Button>
      )}
    </section>
  )
}
