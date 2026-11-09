import {
  Compass,
  FileText,
  HandHelping,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { distanceLabel } from '@/features/neighborhood/game/discovery/geo'
import type { Proximity } from '@/features/neighborhood/game/discovery/types'
import { nearbyTitle } from './entity-detail'
import type { ReportMode } from './report-dialog'

export function FloatingMapActions({
  onReport,
  proximity,
  animalCount,
  nearbyOpen,
  onNearby,
}: {
  onReport: (mode: ReportMode) => void
  proximity: Proximity | null
  animalCount: number
  nearbyOpen: boolean
  onNearby: () => void
}) {
  return (
    <>
      {proximity && (
        <Button
          id="map-nearby-trigger"
          type="button"
          variant="secondary"
          className="absolute left-[var(--map-overlay-left)] top-80 lg:top-20 z-10 h-auto max-w-[calc(100%-5rem)] gap-2 rounded-md border bg-card px-3 py-2 text-left shadow-md transition-colors aria-pressed:border-primary aria-pressed:bg-primary/5"
          aria-label="Open nearby animals and places"
          aria-expanded={nearbyOpen}
          onClick={onNearby}
        >
          <Compass className="size-4 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block max-w-40 truncate text-xs font-bold">
              {nearbyTitle(proximity)}
            </span>
            <span className="block text-[10px] text-muted-foreground">
              <span
                key={animalCount + ':' + proximity.radius}
                className="inline-block motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
              >
                {animalCount} animals · {distanceLabel(proximity.radius)}
              </span>
            </span>
          </span>
          <SlidersHorizontal className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      )}
      <div className="absolute bottom-24 left-[var(--map-overlay-left)] z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className="h-11 rounded-md px-4 shadow-md">
              <HandHelping className="size-4" />
              Help & reports
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="pawtrail-game w-60 text-foreground"
          >
            <DropdownMenuLabel className="text-foreground">
              A little help goes a long way
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="text-foreground"
              onSelect={() => onReport('help')}
            >
              <HandHelping className="size-4" />
              Request practical help
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-foreground"
              onSelect={() => onReport('incident')}
            >
              <ShieldAlert className="size-4" />
              Report a welfare concern
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-foreground"
              onSelect={() => onReport('mine')}
            >
              <FileText className="size-4" />
              My reports & reviews
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
