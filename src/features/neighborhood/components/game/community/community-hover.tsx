import { Card } from '@/components/ui/card'
import { DoorOpen, ArrowRight } from 'lucide-react'
import {
  communityColor,
  type CommunityArea,
} from '@/features/neighborhood/game/discovery/communities'
import type { CommunityMetricsState } from '@/features/neighborhood/game/discovery/region-stats'
import { CityMetricCircles } from './community-metrics'
import { DiscoveryAvatar } from './discovery-avatar'

export type CommunityHover = { id: string; x: number; y: number }

export function CommunityHoverPreview({
  area,
  point,
  statistics,
}: {
  area?: CommunityArea
  point: CommunityHover | null
  statistics?: CommunityMetricsState
}) {
  if (!area || !point) return null
  return (
    <Card
      role="tooltip"
      className="pointer-events-none absolute z-20 w-72 max-w-[calc(100%-1rem)] gap-0 rounded-lg p-3 text-foreground shadow-md"
      style={{ left: point.x, top: point.y }}
    >
      <div className="flex items-center gap-3">
        <DiscoveryAvatar
          kind="city"
          alt="City"
          decorative
          className="size-12 border"
        />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-heading text-xl font-bold leading-tight">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: communityColor(area) }}
            />
            {area.properties.name}
          </h3>
          {area.properties.province && (
            <p className="mt-1 text-xs text-muted-foreground">
              {area.properties.province}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 border-t pt-3">
        <CityMetricCircles
          compact
          city={statistics?.cities.find((city) => city.id === area.id)}
          loading={statistics?.loading ?? true}
          error={statistics?.error ?? false}
          homeStatus={statistics?.homeStatus ?? 'auth'}
        />
      </div>
      <p className="mt-3 flex items-center gap-2 border-t pt-2.5 text-xs font-semibold">
        <DoorOpen aria-hidden="true" className="size-4" />
        Click to view and enter
        <ArrowRight aria-hidden="true" className="ml-auto size-3.5" />
      </p>
    </Card>
  )
}
export function communityHoverPoint(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): CommunityHover {
  return {
    id,
    x: Math.max(8, Math.min(x + 16, width - 296)),
    y: Math.max(8, Math.min(y + 16, height - 332)),
  }
}
