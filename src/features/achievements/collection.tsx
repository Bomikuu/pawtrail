'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Award, Check, Cookie, Eye, LockKeyhole, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import { DataState } from '@/components/shared/data-state'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Page } from '@/types/common'
import { achievementCatalog, findBadge, type BadgeDefinition } from './catalog'
import type { AchievementOverview, AchievementProof } from './schemas'
import { MasteryPanel } from './badge-shelf'
import { ProofForm, type ProofChoice } from './proof-form'

export function ProofDetails({ proof }: { proof: AchievementProof }) {
  return (
    <details
      className={
        'achievement-proof-details [&_summary]:cursor-pointer [&_summary]:min-h-11 [&_summary]:[display:list-item] [&_summary]:[align-content:center] [&_summary]:text-[color:var(--teal)] [&_summary]:text-[0.8125rem] [&_summary:hover]:underline [&_summary:hover]:[text-underline-offset:0.2em] [margin:0.5rem_0] [&_p]:text-muted-foreground [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere] [&_p]:text-[0.8125rem] [&_a]:text-[0.8125rem]'
      }
    >
      <summary>Private evidence details</summary>
      <p>{proof.details}</p>
      <p>
        Record: {proof.ref.kind} / {proof.ref.id}
      </p>
      <p>
        Activity:{' '}
        {new Intl.DateTimeFormat('en-PH', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Manila',
        }).format(new Date(proof.occurredAt))}
      </p>
      {!!proof.mediaIds.length && (
        <ul>
          {proof.mediaIds.map((id, index) => (
            <li key={id}>
              <a
                href={'/api/v1/media/' + encodeURIComponent(id) + '/content'}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open private attachment {index + 1}
              </a>
            </li>
          ))}
        </ul>
      )}
      {proof.reason && (
        <p>
          <strong>Review:</strong> {proof.reason}
        </p>
      )}
    </details>
  )
}
export function AchievementCollection({
  initial,
  proofs: initialProofs,
  scope,
  choices,
  now,
  contributionsPublic,
}: {
  initial: AchievementOverview
  proofs: Page<AchievementProof>
  scope: string
  choices: ProofChoice[]
  now: string
  contributionsPublic: boolean
}) {
  const { session, pending: sessionChanging } = useSession(),
    client = useQueryClient(),
    router = useRouter()
  const key = queryKeys(session.cacheScope).detail('achievements', 'overview')
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getBrowserApi().achievements.overview({ signal }),
    initialData: scope === session.cacheScope ? initial : undefined,
    enabled: !sessionChanging,
  })
  const proofs = useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('achievement-proofs', {
      scope: 'mine',
    }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().achievements.proofs(
        { scope: 'mine', limit: 12, cursor: pageParam },
        { signal },
      ),
    initialData:
      scope === session.cacheScope
        ? { pages: [initialProofs], pageParams: [undefined] }
        : undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !sessionChanging,
  })
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('all'),
    [filter, setFilter] = useState('all')
  const [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState('')
  const [proofForm, setProofForm] = useState<{
    badge: BadgeDefinition
    proof?: AchievementProof
  } | null>(null)
  const busy = useRef(false),
    input = useRef<HTMLInputElement>(null),
    receipts = useRef(new Map<string, string>())
  async function action(
    name: string,
    operation: () => Promise<AchievementOverview>,
  ) {
    if (busy.current) return
    busy.current = true
    setPending(name)
    setError('')
    try {
      const next = await operation()
      client.setQueryData(key, next)
      await client.invalidateQueries()
      router.refresh()
      return true
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'The change could not be saved. Please try again.',
      )
      return false
    } finally {
      busy.current = false
      setPending(null)
    }
  }
  if (scope !== session.cacheScope)
    return (
      <DataState
        state="empty"
        emptyTitle="Your account changed"
        emptyDescription="Reload this workspace to load your achievements and private evidence choices."
        emptyAction={
          <Button onClick={() => router.refresh()}>Reload workspace</Button>
        }
      />
    )
  const overview = query.data
  if (!overview)
    return (
      <DataState
        state={query.isError ? 'error' : 'loading'}
        retry={() => void query.refetch()}
      />
    )
  const countReady = overview.items.filter(
    (item) => item.state === 'ready',
  ).length
  const listed = overview.items.filter((item) => {
    const badge = findBadge(item.id)!
    return (
      (filter === 'all' || item.state === filter) &&
      (category === 'all' || badge.category === category) &&
      (!search.trim() ||
        (badge.title + ' ' + badge.rule)
          .toLowerCase()
          .includes(search.trim().toLowerCase()))
    )
  })
  const activeIds = overview.showcase.badgeIds.filter((id) =>
    overview.items.some((item) => item.id === id && item.state === 'unlocked'),
  )
  function showcase(id?: string) {
    const badgeIds = id
      ? activeIds.includes(id)
        ? activeIds.filter((current) => current !== id)
        : [...activeIds, id]
      : activeIds
    if (badgeIds.length > 6) {
      setError(
        'Choose up to six badges for your public profile. Remove one before adding another.',
      )
      return
    }
    void action('showcase:' + (id ?? 'mastery'), () =>
      getBrowserApi().achievements.showcase({
        badgeIds,
        showMastery: id
          ? overview!.showcase.showMastery
          : !overview!.showcase.showMastery,
      }),
    )
  }
  return (
    <div className="achievement-workspace">
      <header className="catalog-heading">
        <div>
          <h1>Achievements</h1>
          <p>
            Your small acts of care, collected. Unlock badges, earn non-cash
            Kibble and choose what to share.
          </p>
        </div>
        {session.roles.includes('moderator') && (
          <ButtonLink href="/dashboard/achievements/review" variant="outline">
            Review evidence
          </ButtonLink>
        )}
      </header>
      <MasteryPanel summary={overview.summary} />
      <div
        className={
          'achievement-controls flex flex-wrap items-center justify-between gap-4 [margin:1.25rem_0] [&_p]:text-[0.8125rem] [&_p]:text-muted-foreground [&_p]:[margin:0.25rem_0_0] [&_>_[data-slot=button]]:text-[0.8125rem]'
        }
      >
        <div>
          <strong>
            {countReady
              ? countReady + ' ready to unlock'
              : 'Every contribution counts'}
          </strong>
          <p>
            Badge rewards are one-time milestones, separate from mission
            rewards.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!!pending || overview.checkedInToday}
          onClick={() =>
            void action('check-in', () =>
              getBrowserApi().achievements.record({ kind: 'daily' }),
            )
          }
        >
          {overview.checkedInToday ? (
            <>
              <Check size={17} aria-hidden="true" />
              Checked in today
            </>
          ) : pending === 'check-in' ? (
            'Checking in…'
          ) : (
            'Check in today'
          )}
        </Button>
      </div>
      {session.demo && (
        <p
          className={
            'achievement-demo-clock text-xs text-muted-foreground [margin:-0.5rem_0_1.25rem]'
          }
        >
          Demo progress uses{' '}
          {new Intl.DateTimeFormat('en-PH', {
            dateStyle: 'long',
            timeZone: 'Asia/Manila',
          }).format(new Date(now))}{' '}
          as its server date. Sample support transfers no money.
        </p>
      )}
      <section
        className={
          'achievement-sharing flex flex-wrap items-center justify-between gap-4 [margin:1.25rem_0] bg-card [border:1px_solid_var(--social-line)] rounded-xl [padding:1.125rem_1.25rem] [&_p]:text-[0.8125rem] [&_p]:text-muted-foreground [&_p]:[margin:0.25rem_0_0] [&_h2]:text-base [&_h2]:[margin:0_0_0.25rem] [&_[data-slot=button]]:text-[0.8125rem] [&_[aria-pressed=true]]:border-[color:var(--teal)] [&_[aria-pressed=true]]:text-[color:var(--teal)] max-[40rem]:p-4 max-[40rem]:[&_[data-slot=button]]:w-full'
        }
        aria-label="Profile showcase"
      >
        <div>
          <h2>Your profile showcase</h2>
          <p>
            {activeIds.length}/6 badges selected. Only your selected, unlocked
            badges appear publicly.
          </p>
          {!contributionsPublic && (
            <p>
              Contribution privacy is off.{' '}
              <Link href="/dashboard/settings">
                Update your privacy settings
              </Link>{' '}
              to make the showcase visible.
            </p>
          )}
        </div>
        <Button
          variant="outline"
          aria-pressed={overview.showcase.showMastery}
          disabled={!!pending}
          onClick={() => showcase()}
        >
          <Eye size={17} aria-hidden="true" />
          {overview.showcase.showMastery
            ? 'Mastery shared on profile'
            : 'Show mastery on profile'}
        </Button>
      </section>
      <div
        className={
          'achievement-filter-bar flex flex-wrap items-center gap-3 [margin:1.75rem_0_0] [&_>_[data-slot=input]]:w-auto [&_>_[data-slot=input]]:[flex:0_1_11rem] [&_>_[data-slot=input]]:text-sm [&_>_nav]:flex [&_>_nav]:gap-1 [&_nav_[data-slot=button]]:[padding:0.625rem_0.75rem] [&_nav_[data-slot=button]]:text-[0.8125rem] [&_nav_[aria-pressed=true]]:text-[color:var(--teal)] [&_nav_[aria-pressed=true]]:bg-card [&_nav_[aria-pressed=true]]:border-border max-[40rem]:[&_>_[data-slot=input]]:[flex:1_1_100%] max-[40rem]:[&_>_nav]:w-full max-[40rem]:[&_nav_[data-slot=button]]:[flex:1] max-[40rem]:[&_nav_[data-slot=button]]:px-2'
        }
      >
        <div
          className={
            'achievement-search relative [flex:1_1_14rem] [&_[data-slot=input]]:pr-12 [&_[data-slot=input]]:text-sm [&_[data-slot=button]]:absolute [&_[data-slot=button]]:right-0.5 [&_[data-slot=button]]:top-0'
          }
        >
          <Input
            ref={input}
            aria-label="Find a badge"
            type="search"
            placeholder="Find a badge…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              aria-label="Clear badge search"
              onClick={() => {
                setSearch('')
                input.current?.focus()
              }}
            >
              <X size={17} aria-hidden="true" />
            </Button>
          )}
        </div>
        <Select
          aria-label="Badge category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <SelectOption value="all">All categories</SelectOption>
          {[...new Set(achievementCatalog.map((badge) => badge.category))].map(
            (category) => (
              <SelectOption key={category} value={category}>
                {category}
              </SelectOption>
            ),
          )}
        </Select>
        <nav aria-label="Achievement status">
          {[
            ['all', 'All ' + achievementCatalog.length],
            ['ready', 'Ready ' + countReady],
            ['unlocked', 'Unlocked ' + overview.summary.unlocked],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </nav>
      </div>
      {error && (
        <p
          className={
            'achievement-error [border:1px_solid_var(--muted)] rounded-[0.625rem] [padding:0.75rem_1rem] bg-card text-sm'
          }
          role="alert"
        >
          {error}
        </p>
      )}
      {query.isError && (
        <p role="alert">
          Progress could not refresh. Your last results remain visible.{' '}
          <Button variant="ghost" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </p>
      )}
      <p
        className={
          'achievement-results [margin:0.875rem_0] text-xs text-muted-foreground'
        }
        aria-live="polite"
      >
        {listed.length} badges shown
      </p>
      {!listed.length ? (
        <DataState
          state="empty"
          emptyTitle="No badges match"
          emptyDescription="Try another category, status or search."
          emptyAction={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setCategory('all')
                setFilter('all')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div
          className={
            'achievement-grid grid grid-cols-[repeat(auto-fill,_minmax(17.5rem,_1fr))] items-start gap-4 max-[40rem]:grid-cols-1'
          }
        >
          {listed.map((item) => {
            const badge = findBadge(item.id)!,
              unlocked = item.state === 'unlocked',
              ready = item.state === 'ready'
            return (
              <article
                key={item.id}
                className={
                  'achievement-card min-w-0 [border:1px_solid_var(--social-line)] rounded-xl p-4 bg-card [&_>_header]:flex [&_>_header]:items-center [&_>_header]:gap-3.5 [&_>_header]:min-h-20 [&_>_header]:mb-3.5 [&_header_img]:[flex:0_0_5rem] [&_header_img]:w-20 [&_header_img]:h-20 [&_header_img]:object-contain [&_header_img]:[mix-blend-mode:multiply] [&.achievement-locked_header_img]:[filter:grayscale(0.75)] [&.achievement-locked_header_img]:opacity-[0.65] [&.achievement-revoked_header_img]:[filter:grayscale(0.75)] [&.achievement-revoked_header_img]:opacity-[0.65] [&_h2]:text-[length:1.0625rem] [&_h2]:[line-height:1.3] [&_h2]:[margin:0_0_0.5rem] [@media(forced-colors:_active)]:[&.achievement-locked_header_img]:opacity-[1] [@media(forced-colors:_active)]:[&.achievement-locked_header_img]:[filter:none] [@media(forced-colors:_active)]:[&.achievement-revoked_header_img]:opacity-[1] [@media(forced-colors:_active)]:[&.achievement-revoked_header_img]:[filter:none] achievement-' +
                  item.state
                }
              >
                <header>
                  <img
                    src={badge.image}
                    width={192}
                    height={192}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <h2>{badge.title}</h2>
                    <span
                      className={
                        'achievement-reward inline-flex items-center gap-1 text-[#963b0c] text-xs font-semibold'
                      }
                    >
                      <Cookie size={15} aria-hidden="true" />
                      {badge.rewardKibble} Kibble
                    </span>
                  </div>
                </header>
                <div
                  className={
                    'achievement-progress-copy flex justify-between gap-2 text-muted-foreground text-xs [margin:0.75rem_0_0.5rem] tabular-nums [.achievement-ready_&]:text-[color:var(--teal)] [.achievement-unlocked_&]:text-[color:var(--teal)]'
                  }
                >
                  <span>
                    {unlocked
                      ? 'Unlocked'
                      : ready
                        ? 'Ready to unlock'
                        : item.state === 'revoked'
                          ? 'Needs requalification'
                          : item.current
                            ? 'In progress'
                            : 'Not started'}
                  </span>
                  <span>
                    {Math.min(item.current, item.target)}/{item.target}
                  </span>
                </div>
                <Progress
                  value={item.percent}
                  max={100}
                  aria-label={badge.title + ': ' + item.percent + '% complete'}
                />
                <p
                  className={
                    'achievement-unit text-muted-foreground text-[0.6875rem] [margin:0.375rem_0_0.75rem]'
                  }
                >
                  {badge.unit}
                </p>
                <details
                  className={
                    'achievement-instructions [&_summary]:cursor-pointer [&_summary]:min-h-11 [&_summary]:[display:list-item] [&_summary]:[align-content:center] [&_summary]:text-[color:var(--teal)] [&_summary]:text-[0.8125rem] [&_summary:hover]:underline [&_summary:hover]:[text-underline-offset:0.2em] [&_p]:text-[0.8125rem] [&_p]:text-muted-foreground [&_p]:[overflow-wrap:anywhere] [&_p]:[margin:0.375rem_0_0.75rem] [&_li]:text-[0.8125rem] [&_li]:text-muted-foreground [&_li]:[overflow-wrap:anywhere] [&_ul]:[margin:0.5rem_0] [&_ul]:pl-4.5'
                  }
                >
                  <summary>How to earn</summary>
                  <p>{badge.rule}</p>
                  {item.criteria.length > 1 && (
                    <ul>
                      {item.criteria.map((criterion) => (
                        <li key={criterion.label}>
                          {criterion.label}: {criterion.current}/
                          {criterion.target}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>
                    Reward: {badge.rewardKibble} non-cash Kibble, once per
                    qualifying badge. Reversed evidence can revoke the badge and
                    correct the reward.
                  </p>
                </details>
                <div
                  className={
                    'achievement-card-action mt-2.5 [&_>_[data-slot=button]]:w-full [&_>_[data-slot=button]]:text-[0.8125rem] [&_[aria-pressed=true]]:border-[color:var(--teal)] [&_[aria-pressed=true]]:text-[color:var(--teal)]'
                  }
                >
                  {ready ? (
                    <Button
                      disabled={!!pending}
                      onClick={() => {
                        const key =
                          receipts.current.get(item.id) ?? crypto.randomUUID()
                        receipts.current.set(item.id, key)
                        void action('claim:' + item.id, () =>
                          getBrowserApi().achievements.claim(item.id, {
                            idempotencyKey: key,
                          }),
                        ).then((saved) => {
                          if (saved) {
                            receipts.current.delete(item.id)
                            toast.success('Badge unlocked: ' + badge.title)
                          }
                        })
                      }}
                    >
                      <Award size={17} aria-hidden="true" />
                      {pending === 'claim:' + item.id
                        ? 'Unlocking…'
                        : 'Unlock +' + badge.rewardKibble}
                    </Button>
                  ) : unlocked ? (
                    <Button
                      variant="outline"
                      disabled={!!pending}
                      aria-pressed={activeIds.includes(item.id)}
                      onClick={() => showcase(item.id)}
                    >
                      <Check size={16} aria-hidden="true" />
                      {activeIds.includes(item.id)
                        ? 'Shown on profile'
                        : 'Show on profile'}
                    </Button>
                  ) : badge.proofContext ? (
                    <Button
                      variant="outline"
                      onClick={() => setProofForm({ badge })}
                    >
                      <LockKeyhole size={16} aria-hidden="true" />
                      Submit evidence
                    </Button>
                  ) : (
                    <ButtonLink href={badge.href} variant="outline">
                      {badge.id === 'daily-pawpal' ||
                      badge.id === 'paw-legacy' ||
                      badge.id === 'true-pawpal'
                        ? 'Keep making progress'
                        : 'Work toward this badge'}
                    </ButtonLink>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
      <section
        className={
          'achievement-proof-history mt-10 [&_>_h2]:[margin:0_0_0.5rem] [&_>_h2]:text-[length:1.375rem] [&_>_p]:text-muted-foreground [&_>_p]:text-sm [&_>_p]:max-w-[70ch] [&_>_ul]:list-none [&_>_ul]:[margin:1.25rem_0] [&_>_ul]:p-0 [&_>_ul_>_li]:[border-bottom:1px_solid_var(--social-line)] [&_>_ul_>_li]:[padding:1rem_0]'
        }
      >
        <h2>Your evidence submissions</h2>
        <p>
          Private to you and authorized reviewers. Approval adds progress;
          unlock a completed badge to collect its reward.
        </p>
        <DataState
          state={
            proofs.isPending
              ? 'loading'
              : proofs.isError && !proofs.data
                ? 'error'
                : proofs.data?.pages.some((page) => page.items.length)
                  ? 'ready'
                  : 'empty'
          }
          retry={() => void proofs.refetch()}
          emptyTitle="No evidence submitted yet"
          emptyDescription="Badges that need real-world confirmation include a Submit evidence action."
        >
          <ul>
            {[
              ...new Map(
                (proofs.data?.pages.flatMap((page) => page.items) ?? []).map(
                  (proof) => [proof.id, proof],
                ),
              ).values(),
            ].map((proof) => (
              <li key={proof.id}>
                <div
                  className={
                    'achievement-proof-heading flex items-center justify-between gap-2 flex-wrap text-sm [&_>_span]:text-muted-foreground [&_>_span]:text-xs'
                  }
                >
                  <strong>
                    {findBadge(proof.badgeId)?.title ?? proof.badgeId}
                  </strong>
                  <span>
                    {proof.state === 'pending'
                      ? 'Awaiting review'
                      : proof.state === 'approved'
                        ? 'Approved'
                        : 'Needs revision'}
                  </span>
                </div>
                <ProofDetails proof={proof} />
                {proof.state === 'rejected' && findBadge(proof.badgeId) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setProofForm({ badge: findBadge(proof.badgeId)!, proof })
                    }
                  >
                    Revise evidence
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </DataState>
        {proofs.isError && proofs.data && (
          <p role="alert">
            More submissions could not load.{' '}
            <Button variant="ghost" onClick={() => void proofs.refetch()}>
              Retry submissions
            </Button>
          </p>
        )}
        {proofs.hasNextPage && (
          <Button
            variant="outline"
            disabled={proofs.isFetchingNextPage}
            onClick={() => void proofs.fetchNextPage()}
          >
            {proofs.isFetchingNextPage ? 'Loading…' : 'Load more submissions'}
          </Button>
        )}
      </section>
      {proofForm && (
        <ProofForm
          key={proofForm.proof?.id ?? proofForm.badge.id}
          badge={proofForm.badge}
          proof={proofForm.proof}
          choices={choices}
          now={now}
          close={() => setProofForm(null)}
        />
      )}
    </div>
  )
}
