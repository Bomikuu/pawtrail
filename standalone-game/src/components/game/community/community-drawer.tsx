import { CityMetricCircles } from './community-metrics'
import { DiscoveryAvatar } from './discovery-avatar'
import type { CityMetrics } from '@/game/discovery/region-stats'
import { communityColor } from '@/game/discovery/communities'
import { ArrowUpRight, Map, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { Badge } from '@/components/ui/badge'
import type { CommunityArea } from '@/game/discovery/communities'
import { DetailDrawer } from './detail-drawer'
export function CommunityDrawer({
  area,
  metrics,
  loading = false,
  error = false,
  homeStatus = 'auth',
  exiting,
  href,
  onClose,
  onFit,
}: {
  area: CommunityArea
  metrics?: CityMetrics
  loading?: boolean
  error?: boolean
  homeStatus?: 'ready' | 'auth' | 'unavailable'
  exiting: boolean
  href: string
  onClose: () => void
  onFit: () => void
}) {
  const p = area.properties
  return (
    <DetailDrawer
      title={p.name}
      summary="City-wide shared community"
      description="Published community area and shared world entry."
      open={!exiting}
      onClose={onClose}
      portrait={
        <span className="rounded-full border-2" style={{ borderColor: communityColor(area) }}>
          <DiscoveryAvatar kind="city" alt="City illustration" decorative className="size-14" />
        </span>
      }
      status={
        <Badge variant="secondary" className="rounded-md text-foreground">
          Whole-city community
        </Badge>
      }
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
        <CityMetricCircles city={metrics} loading={loading} error={error} homeStatus={homeStatus} />
        <section className="space-y-3 border-t pt-5">
          <h3 className="flex items-center gap-2 font-heading text-xl font-bold">
            <Users aria-hidden="true" className="size-4" />
            Your community
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter the shared community world for this area using your PawTrail
            account. Each city shares one room and live conversation, without barangay or custom-zone splits.
          </p>
          <dl className="grid grid-cols-2 gap-4 border-y py-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Area</dt>
              <dd className="mt-1 font-medium">{p.city}</dd>
            </div>
            {p.province && <div><dt className="text-muted-foreground">Province / geographic context</dt><dd className="mt-1 font-medium">{p.province}</dd></div>}
            <div>
              <dt className="text-muted-foreground">Approximate coverage</dt>
              <dd className="mt-1 font-medium">
                {p.areaKm2.toLocaleString()} km²
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shared room capacity</dt>
              <dd className="mt-1 font-medium">{p.capacity} visitors</dd>
            </div>

          </dl>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md text-xs text-foreground"
            onClick={onFit}
          >
            <Map aria-hidden="true" className="size-3.5" />
            Show whole area
          </Button>
        </section>
        <section className="space-y-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          <h3 className="font-semibold text-foreground">Boundary source</h3>
          <p>{p.sourceName}</p>
          <p>{p.sourceVersion}</p>
          <p>
            Source-dated, simplified city outlines are used for community navigation.
          </p>
          <a
            href={p.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-8 items-center gap-1 text-foreground underline underline-offset-2"
          >
            View boundary source{' '}
            <ArrowUpRight aria-hidden="true" className="size-3" />
          </a>
        </section>
      </div>
      <footer className="shrink-0 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
        <ButtonAnchor href={href} className="h-11 w-full rounded-md">
          <Users aria-hidden="true" className="size-4" />
          Enter community
        </ButtonAnchor>
      </footer>
    </DetailDrawer>
  )
}
