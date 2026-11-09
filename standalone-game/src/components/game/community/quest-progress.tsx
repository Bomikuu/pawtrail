import { HeartHandshake } from 'lucide-react'
import { DiscoveryAvatar } from './discovery-avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { MapQuestLog } from '@/game/discovery/quests'

export function QuestProgress({
  log,
  compact = false,
  loading,
  unavailable,
  loginHref,
}: {
  log: MapQuestLog | null
  compact?: boolean
  loading: boolean
  unavailable: boolean
  loginHref: string
}) {
  const progress = log?.progress
  const joined = progress?.joined ?? 0
  const approved = progress?.approved ?? 0
  const submitted = progress?.submitted ?? 0
  const known = !!log?.authenticated && !!progress && !unavailable
  const percent = known && joined ? (approved / joined) * 100 : 0
  const bar = (
    <Progress
      value={percent}
      className={compact ? 'h-1.5' : 'h-2'}
      aria-label="Approved joined quests"
      aria-valuetext={
        known
          ? `${approved} of ${joined} joined quests approved`
          : 'No saved progress available'
      }
    />
  )
  if (compact)
    return (
      <div className="min-w-0 flex-1 space-y-1">
        {loading ? (
          <Skeleton className="h-7 w-full" />
        ) : known ? (
          <>
            <p className="text-xs font-semibold text-foreground tabular-nums">
              {approved} / {joined} approved
            </p>
            {bar}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {unavailable ? 'Progress unavailable' : 'Your care journey'}
          </p>
        )}
      </div>
    )
  return (
    <div className="mx-3 mb-3 flex shrink-0 items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <DiscoveryAvatar
        kind="help"
        alt="Community care"
        decorative
        className="size-12 border border-primary/20"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h3 className="font-heading text-xl font-bold leading-tight">
            Neighborhood care
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {loading
              ? 'Loading your recorded quest progress…'
              : unavailable
                ? 'Your quest progress could not refresh.'
                : !log?.authenticated
                  ? 'Sign in to save your quest progress.'
                  : joined
                    ? `${approved} of ${joined} joined quests approved${submitted ? ` · ${submitted} awaiting review` : ''}`
                    : 'Join a quest to start your care journey.'}
          </p>
        </div>
        {loading ? (
          <Skeleton className="h-2" />
        ) : known ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">{bar}</div>
            <span className="shrink-0 text-xs font-bold tabular-nums">
              {approved} / {joined}
            </span>
          </div>
        ) : !unavailable && !log?.authenticated ? (
          <a
            href={loginHref}
            className="inline-flex min-h-6 text-xs font-medium text-foreground underline underline-offset-2"
          >
            Sign in to join
          </a>
        ) : null}
      </div>
      <HeartHandshake
        aria-hidden="true"
        className="hidden size-8 shrink-0 text-primary/70 xl:block"
      />
    </div>
  )
}
