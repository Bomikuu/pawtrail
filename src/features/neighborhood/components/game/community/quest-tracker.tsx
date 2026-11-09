import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flag,
  Grid2X2,
  House,
  RotateCw,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlatformBridge } from '@/features/neighborhood/game/platform'
import {
  QUEST_FILTERS,
  mapQuestEntries,
  matchesQuestFilter,
  type MapQuestLog,
  type QuestFilter,
} from '@/features/neighborhood/game/discovery/quests'
import type { HelpPrompt } from '@/features/neighborhood/game/discovery/attention'
import type {
  MapEntity,
  Point,
} from '@/features/neighborhood/game/discovery/types'
import { QuestProgress } from './quest-progress'
import { QuestRow } from './quest-row'

const labels = {
  all: 'All',
  attention: 'Needs attention',
  adoption: 'Adoption',
  mine: 'My quests',
}
const icons = {
  all: Grid2X2,
  attention: TriangleAlert,
  adoption: House,
  mine: UserRound,
}

export function MapQuestTracker({
  platform,
  refreshKey,
  visible,
  attention,
  attentions,
  entities,
  loadingAnimals,
  origin,
  resultsExpanded,
  onExpand,
  onAttention,
  onChoose,
  onDismissAttention,
  loginHref,
}: {
  platform?: PlatformBridge
  refreshKey: number
  visible: boolean
  attention: HelpPrompt | null
  attentions: HelpPrompt[]
  entities: MapEntity[]
  loadingAnimals: boolean
  origin?: Point | null
  resultsExpanded: boolean
  onExpand?: () => void
  onAttention: (prompt: HelpPrompt) => void
  onChoose: (id: string) => void
  onDismissAttention: (prompt: HelpPrompt) => void
  loginHref: string
}) {
  const [log, setLog] = useState<MapQuestLog | null>(null)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState<QuestFilter>('all')
  const [limit, setLimit] = useState(5)
  useEffect(() => {
    setExpanded(window.matchMedia('(min-width: 1024px)').matches)
  }, [])
  useEffect(() => {
    if (resultsExpanded && window.innerWidth < 1024) setExpanded(false)
  }, [resultsExpanded])
  const changeExpanded = (open: boolean) => {
    if (open) onExpand?.()
    else if (window.innerWidth < 1024)
      document
        .getElementById('map-quests-toggle')
        ?.focus({ preventScroll: true })
    setExpanded(open)
  }
  useEffect(() => {
    let active = true
    let request: AbortController | null = null
    const refresh = () => {
      if (!platform?.mapQuests) return
      request?.abort()
      const controller = new AbortController()
      request = controller
      setRefreshing(true)
      platform
        .mapQuests(controller.signal)
        .then((value) => {
          if (active && !controller.signal.aborted) {
            setLog(value)
            setError(false)
          }
        })
        .catch(() => {
          if (active && !controller.signal.aborted) setError(true)
        })
        .finally(() => {
          if (active && !controller.signal.aborted) setRefreshing(false)
        })
    }
    refresh()
    const onFocus = () => {
      if (!document.hidden) refresh()
    }
    window.addEventListener('focus', onFocus)
    const timer = setInterval(onFocus, 60_000)
    return () => {
      active = false
      request?.abort()
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [platform, refreshKey, attempt])
  const entries = useMemo(
    () => mapQuestEntries(entities, attentions, log, attention),
    [entities, attentions, log, attention],
  )
  const groups = useMemo(
    () =>
      Object.fromEntries(
        QUEST_FILTERS.map((value) => [
          value,
          entries.filter((entry) => matchesQuestFilter(entry, value)),
        ]),
      ) as Record<QuestFilter, typeof entries>,
    [entries],
  )
  const loadingMissions = !!platform?.mapQuests && !log && !error
  const chooseFilter = (value: string) => {
    const next = QUEST_FILTERS.find((item) => item === value)
    if (next) {
      setFilter(next)
      setLimit(5)
    }
  }
  const openFilter = (value: QuestFilter) => {
    chooseFilter(value)
    changeExpanded(true)
  }
  const emptyCopy = {
    all: 'No published care quests in the loaded map area right now.',
    attention:
      'No animal attention alerts or urgent quests in the loaded records.',
    adoption: 'No loaded animal records are currently marked for adoption.',
    mine: log?.authenticated
      ? 'Your joined quests will appear here.'
      : 'Sign in to view your joined quests.',
  }
  const extraAlert = entries.find((entry) => entry.kind === 'alert')
  if (!visible) return null
  return (
    <>
      <Button
        id="map-quests-toggle"
        type="button"
        variant="secondary"
        className="absolute right-3 top-20 z-30 size-11 rounded-md border bg-card p-0 shadow-md lg:hidden"
        aria-expanded={expanded}
        aria-controls="map-quest-log"
        aria-label={`${expanded ? 'Close' : 'Open'} quests. ${groups.attention.length} need attention.`}
        onClick={() => changeExpanded(!expanded)}
      >
        <Flag aria-hidden="true" className="size-4" />
        {groups.attention.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-sm bg-primary px-1 text-[10px] text-primary-foreground tabular-nums">
            {groups.attention.length}
          </span>
        )}
      </Button>
      <Collapsible asChild open={expanded} onOpenChange={changeExpanded}>
        <section
          id="map-quest-log"
          aria-label="Quest tracker"
          className={
            'absolute right-3 top-80 z-20 max-h-[calc(100%-21rem)] w-[min(26rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-lg lg:top-3 lg:max-h-[calc(100%-13rem)] lg:w-96 xl:w-104 ' +
            (expanded ? 'flex' : 'hidden lg:flex')
          }
        >
          <header className="flex shrink-0 items-center gap-2 p-3">
            <Flag aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div className={expanded ? 'min-w-0 flex-1' : 'shrink-0'}>
              <h2 className="font-heading text-2xl font-bold leading-tight">
                Quests
              </h2>
              {expanded && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Help your animal neighbors.
                </p>
              )}
            </div>
            {!expanded && (
              <>
                <QuestProgress
                  log={log}
                  compact
                  loading={loadingMissions}
                  unavailable={error || !platform?.mapQuests}
                  loginHref={loginHref}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="relative size-8 rounded-md text-foreground"
                  aria-label={`Needs attention: ${groups.attention.length} quests`}
                  onClick={() => openFilter('attention')}
                >
                  <TriangleAlert
                    aria-hidden="true"
                    className="size-4 text-destructive"
                  />
                  {groups.attention.length > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-sm bg-destructive px-1 text-[10px] text-white tabular-nums">
                      {groups.attention.length}
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-md text-foreground"
                  aria-label={`Adoption: ${groups.adoption.length} animals`}
                  onClick={() => openFilter('adoption')}
                >
                  <House aria-hidden="true" className="size-4" />
                </Button>
              </>
            )}
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 shrink-0 rounded-md text-foreground"
                aria-label={
                  expanded ? 'Collapse quest list' : 'Expand quest list'
                }
              >
                {expanded ? (
                  <ChevronUp aria-hidden="true" className="size-4" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </header>
          <CollapsibleContent className="min-h-0 flex-1 overflow-hidden data-[state=open]:flex data-[state=open]:flex-col motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-top-2 motion-safe:data-[state=open]:duration-150">
            <QuestProgress
              log={log}
              loading={loadingMissions}
              unavailable={error || !platform?.mapQuests}
              loginHref={loginHref}
            />
            <Tabs
              value={filter}
              onValueChange={chooseFilter}
              className="min-h-0 flex-1 gap-0"
            >
              <div className="shrink-0 px-3 pb-3">
                <TabsList
                  aria-label="Quest filters"
                  className="grid w-full grid-cols-2 gap-2 rounded-none bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto"
                >
                  {QUEST_FILTERS.map((value) => {
                    const Icon = icons[value]
                    return (
                      <TabsTrigger
                        key={value}
                        value={value}
                        aria-label={`${labels[value]}: ${groups[value].length} quests`}
                        className="h-9 justify-start rounded-md border border-border bg-card px-2 text-xs text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground max-sm:min-h-11"
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-3.5 shrink-0"
                        />
                        {labels[value]}
                        <Badge
                          variant="secondary"
                          className="ml-auto min-w-5 justify-center rounded-sm px-1 py-0 text-[10px] tabular-nums"
                        >
                          {groups[value].length}
                        </Badge>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
              <p className="sr-only" role="status" aria-atomic="true">
                {labels[filter]}: {groups[filter].length} quests in loaded
                records.{error ? ' Mission refresh is unavailable.' : ''}
              </p>
              {QUEST_FILTERS.map((value) => (
                <TabsContent
                  key={value}
                  value={value}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3"
                >
                  {groups[value].length > 0 ? (
                    <ul className="space-y-2">
                      {groups[value].slice(0, limit).map((entry) => (
                        <QuestRow
                          key={entry.id}
                          entry={entry}
                          origin={origin}
                          onAttention={onAttention}
                          onChoose={onChoose}
                        />
                      ))}
                    </ul>
                  ) : (
                      value === 'mine'
                        ? loadingMissions
                        : loadingAnimals || loadingMissions
                    ) ? (
                    <div className="space-y-2" aria-label="Loading quests">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
                      {emptyCopy[value]}
                      {value === 'mine' && !log?.authenticated && (
                        <a
                          href={loginHref}
                          className="mt-2 block text-foreground underline underline-offset-2"
                        >
                          Sign in
                        </a>
                      )}
                    </p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
            {(error || !!log?.unavailable || !platform?.mapQuests) && (
              <div className="flex shrink-0 items-center gap-2 border-t px-3 py-2">
                <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                  {!platform?.mapQuests
                    ? 'Personal mission tracking is unavailable in this view.'
                    : error
                      ? log
                        ? 'Mission refresh failed. Showing last loaded quests.'
                        : 'Mission progress could not load.'
                      : 'Some quest details are unavailable.'}
                </p>
                {platform?.mapQuests && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-md text-xs text-foreground"
                    disabled={refreshing}
                    onClick={() => setAttempt((value) => value + 1)}
                  >
                    <RotateCw
                      aria-hidden="true"
                      className={
                        'size-3.5 ' +
                        (refreshing ? 'motion-safe:animate-spin' : '')
                      }
                    />
                    Retry
                  </Button>
                )}
              </div>
            )}
            <footer className="shrink-0 space-y-2 border-t p-3">
              {groups[filter].length > limit ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 w-full rounded-md text-xs text-foreground"
                  onClick={() => setLimit((value) => value + 5)}
                >
                  View more quests{' '}
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </Button>
              ) : (
                <a
                  href="/missions"
                  className="flex min-h-8 items-center justify-center gap-2 rounded-md text-xs font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  View mission board{' '}
                  <ChevronRight aria-hidden="true" className="size-3.5" />
                </a>
              )}
              {extraAlert?.kind === 'alert' &&
                (filter === 'all' || filter === 'attention') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto w-full whitespace-normal text-xs text-muted-foreground"
                    onClick={() => onDismissAttention(extraAlert.prompt)}
                  >
                    Dismiss this place alert
                  </Button>
                )}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Counts reflect available records and your joined quests.
                Published locations are approximate.
              </p>
            </footer>
          </CollapsibleContent>
        </section>
      </Collapsible>
    </>
  )
}
