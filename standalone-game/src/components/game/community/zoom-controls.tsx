import { LocateFixed, MapPin, Minus, Plus, Scan, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Point } from '@/game/discovery/types'

export type MapCamera = { point: Point; zoom: number }
export type MapControlActions = {
  locating: boolean
  picking: boolean
  inView: boolean
  hasBounds: boolean
  onLocate: () => void
  onPick: () => void
  onSearch: () => void
}

function MapControl({
  id,
  label,
  icon: Icon,
  active,
  busy,
  disabled,
  onClick,
}: {
  id?: string
  label: string
  icon: LucideIcon
  active?: boolean
  busy?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id={id}
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 rounded-md text-foreground transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground pointer-coarse:size-11"
          aria-label={label}
          aria-pressed={active}
          aria-busy={busy || undefined}
          disabled={disabled || busy}
          onClick={onClick}
        >
          <Icon
            aria-hidden="true"
            className={'size-3.5 ' + (busy ? 'motion-safe:animate-pulse' : '')}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="pawtrail-game">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function MapZoomControls({
  actions,
  displaced = false,
  zoom,
  onIn,
  onOut,
  onFit,
  hasPlaces,
}: {
  actions?: MapControlActions
  displaced?: boolean
  zoom: number
  onIn: () => void
  onOut: () => void
  onFit: () => void
  hasPlaces: boolean
}) {
  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={
          'absolute bottom-[max(2rem,env(safe-area-inset-bottom))] right-3 z-30 flex items-end gap-2 ' +
          (displaced ? 'max-lg:bottom-[calc(50%+1rem)] lg:right-[29rem]' : '')
        }
        role="toolbar"
        aria-label="Map controls"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {actions && (
          <div
            className="flex gap-0 rounded-md border bg-card p-0.5 shadow-md lg:flex-col lg:gap-1 lg:p-1"
            role="group"
            aria-label="Map location controls"
          >
            <MapControl
              id="map-locate"
              label={
                actions.locating
                  ? 'Finding your location…'
                  : 'Find animals near me'
              }
              icon={LocateFixed}
              busy={actions.locating}
              onClick={actions.onLocate}
            />
            <MapControl
              label={
                actions.picking
                  ? 'Cancel choosing a map center'
                  : 'Choose a center on the map'
              }
              icon={MapPin}
              active={actions.picking}
              onClick={actions.onPick}
            />
            <MapControl
              label={
                actions.inView
                  ? 'Clear map-area filter'
                  : 'Search this map area'
              }
              icon={Search}
              active={actions.inView}
              disabled={!actions.hasBounds}
              onClick={actions.onSearch}
            />
          </div>
        )}
        <div
          className="flex gap-0 rounded-md border bg-card p-0.5 shadow-md lg:flex-col lg:gap-1 lg:p-1"
          role="group"
          aria-label="Map zoom controls"
        >
          <MapControl
            label="Zoom in"
            icon={Plus}
            disabled={zoom >= 18}
            onClick={onIn}
          />
          <MapControl
            label="Zoom out"
            icon={Minus}
            disabled={zoom <= 3}
            onClick={onOut}
          />
          <MapControl
            label="Show all places"
            icon={Scan}
            disabled={!hasPlaces}
            onClick={onFit}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
