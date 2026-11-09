import { Button } from '@/components/ui/button'
import { DiscoveryAvatar } from './discovery-avatar'
import {
  discoveryPlaceholder,
  type DiscoveryArtwork,
} from '@/game/discovery/placeholders'
import type {
  CityMetrics,
  MetricKind,
  ProvinceSummary,
} from '@/game/discovery/region-stats'
import { visibleMetrics } from '@/game/discovery/region-stats'
import type { EntityKind } from '@/game/discovery/types'
const artwork: Record<MetricKind, DiscoveryArtwork> = {
  animals: 'animals',
  events: 'events',
  homes: 'home',
  shelters: 'shelters',
  hordes: 'groups',
  help: 'help',
}
const labels = {
  animals: 'Animals',
  events: 'Events',
  homes: 'Homes',
  shelters: 'Shelters',
  hordes: 'Groups',
  help: 'Help requests',
}
const compact = (n: number) =>
  Intl.NumberFormat('en-PH', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
export function CityMetricCircles({
  city,
  loading,
  error,
  homeStatus,
  compact: small = false,
}: {
  city?: CityMetrics
  loading: boolean
  error: boolean
  homeStatus: 'ready' | 'auth' | 'unavailable'
  compact?: boolean
}) {
  if (error)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        City totals couldn’t load. Refresh the map to try again.
      </p>
    )
  return (
    <section
      aria-label={small ? 'City summary counts' : 'City map totals'}
      aria-busy={loading}
      className={small ? 'space-y-3' : 'space-y-4'}
    >
      {!small && (
        <h3 className="font-heading text-xl font-bold">
          Around {city?.name ?? 'this city'}
        </h3>
      )}
      <dl
        className={
          small
            ? 'grid grid-cols-3 gap-x-2 gap-y-3'
            : 'grid grid-cols-3 gap-x-3 gap-y-5'
        }
      >
        {(Object.keys(labels) as MetricKind[]).map((kind) => {
          const value = city?.[kind]
          const src =
            kind === 'animals'
              ? city?.images.animals
              : kind === 'shelters'
                ? city?.images.shelters
                : null
          return (
            <div
              key={kind}
              className="relative flex min-w-0 flex-col items-center text-center"
            >
              <dt className="flex flex-col items-center gap-2">
                <DiscoveryAvatar
                  kind={artwork[kind]}
                  src={src}
                  alt={labels[kind]}
                  decorative
                  className={
                    small
                      ? 'size-10 border border-border'
                      : 'size-16 border border-border'
                  }
                />
                <span
                  className={
                    small ? 'text-[11px] font-medium' : 'text-xs font-medium'
                  }
                >
                  {labels[kind]}
                </span>
              </dt>
              <dd
                aria-label={
                  typeof value === 'number'
                    ? `${value} ${labels[kind].toLowerCase()}`
                    : `${labels[kind]} ${loading ? 'loading' : 'unavailable'}`
                }
                className={
                  small
                    ? 'absolute top-6 right-[calc(50%-1.75rem)] min-w-5 rounded-full border bg-card px-1 text-[11px] font-semibold tabular-nums'
                    : 'absolute top-10 right-[calc(50%-2.5rem)] min-w-7 rounded-full border bg-card px-1.5 py-0.5 text-sm font-semibold tabular-nums'
                }
              >
                {typeof value === 'number'
                  ? compact(value)
                  : loading
                    ? '…'
                    : '—'}
              </dd>
            </div>
          )
        })}
      </dl>
      {!small && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Published map records, using approximate or shared-place locations.
          Animals are counted once.
        </p>
      )}
      {homeStatus !== 'ready' && (
        <p
          className={
            small
              ? 'text-[11px] leading-relaxed text-muted-foreground'
              : 'text-xs leading-relaxed text-muted-foreground'
          }
        >
          {homeStatus === 'auth'
            ? small
              ? 'Sign in for home totals.'
              : 'Sign in to see homes shared with your account.'
            : 'Home totals are currently unavailable.'}
        </p>
      )}
    </section>
  )
}
export function ProvinceCountMarker({
  summary,
  kinds,
  onChoose,
}: {
  summary: ProvinceSummary
  kinds: EntityKind[]
  onChoose(): void
}) {
  const visible = visibleMetrics(kinds)
  const total = visible.reduce(
    (sum, key) => sum + (summary.counts[key] ?? 0),
    0,
  )
  const incomplete = visible.some((key) => summary.counts[key] === null)
  const details = visible
    .map((key) => `${labels[key]}: ${summary.counts[key] ?? 'unavailable'}`)
    .join(', ')
  return (
    <div className="flex w-40 flex-col items-center gap-1.5 text-foreground">
      <Button
        variant="outline"
        aria-label={`${summary.name}. ${details}. Zoom to area.`}
        title={`${summary.name} · ${details}`}
        className="relative size-19 flex-col gap-0 rounded-full border-2 bg-card p-1 text-foreground shadow-md hover:bg-secondary"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          onChoose()
        }}
      >
        <img
          src={discoveryPlaceholder('city')}
          alt=""
          aria-hidden="true"
          className="size-7 scale-125 object-contain"
        />
        <span className="font-heading text-2xl font-bold leading-none tabular-nums">
          {compact(total)}
          {incomplete ? '+' : ''}
        </span>
        <span className="mt-0.5 text-[10px] font-normal">map records</span>
      </Button>
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-1"
      >
        {(['animals', 'events', 'homes'] as MetricKind[])
          .filter((key) => visible.includes(key))
          .map((key) => {
            return (
              <span
                key={key}
                className="flex h-7 min-w-8 items-center justify-center gap-0.5 rounded-full border bg-card px-1.5 text-[10px] font-semibold shadow-sm"
              >
                <img
                  src={discoveryPlaceholder(artwork[key])}
                  alt=""
                  className="size-5 object-contain"
                />
                {summary.counts[key] === null
                  ? '—'
                  : compact(summary.counts[key]!)}
              </span>
            )
          })}
      </div>
      <span className="max-w-full rounded-md border bg-card px-2 py-1 text-center text-xs font-semibold leading-tight shadow-sm">
        {summary.name}
      </span>
    </div>
  )
}
