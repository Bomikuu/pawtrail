import { useEffect, useRef } from 'react'
import { Compass, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { distanceLabel } from '@/game/discovery/geo'
import type {
  EntityKind,
  MapEntity,
  Proximity,
  PublicRecords,
} from '@/game/discovery/types'
import { NearbySummary, nearbyTitle } from './entity-detail'
import { panelMotion, usePanelPresence } from './panel-motion'

export function NearbyPopup({
  open,
  proximity,
  entities,
  area,
  nearOnly,
  onNearOnly,
  onRadius,
  onFilter,
  onAnimals,
  onClose,
  onClear,
}: {
  open: boolean
  proximity: Proximity
  entities: MapEntity[]
  area?: PublicRecords['areaSummary']
  nearOnly: boolean
  onNearOnly: (v: boolean) => void
  onRadius: (v: number) => void
  onFilter: (v: EntityKind) => void
  onAnimals: () => void
  onClose: () => void
  onClear: () => void
}) {
  const present = usePanelPresence(open)
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (open) title.current?.focus({ preventScroll: true })
  }, [open])
  if (!present) return null
  return (
    <Card
      data-state={open ? 'open' : 'closed'}
      inert={!open}
      aria-hidden={!open}
      role="region"
      aria-label="Nearby animals and places"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.stopPropagation()
          onClose()
        }
      }}
      className={
        'absolute inset-x-3 bottom-4 z-20 max-h-[72%] gap-0 overflow-y-auto rounded-2xl border bg-card py-0 shadow-lg lg:inset-x-auto lg:right-4 lg:w-96 lg:max-h-[calc(100%-5rem)] ' +
        panelMotion
      }
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b bg-card p-4">
        <div className="flex gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10">
            <Compass className="size-5 text-primary" />
          </span>
          <div>
            <h2
              ref={title}
              tabIndex={-1}
              className="font-heading text-base font-extrabold leading-tight focus:outline-none text-foreground"
            >
              {nearbyTitle(proximity)}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Animals and places within{' '}
              <span
                key={proximity.radius}
                className="inline-block font-semibold text-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
              >
                {distanceLabel(proximity.radius)}
              </span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 rounded-md text-foreground"
          aria-label="Close nearby results"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      <NearbySummary
        proximity={proximity}
        entities={entities}
        area={area}
        nearOnly={nearOnly}
        onNearOnly={onNearOnly}
        onRadius={onRadius}
        onFilter={onFilter}
        onAnimals={onAnimals}
        framed={false}
        showHeading={false}
      />
      <div className="border-t px-4 py-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-0 text-xs text-muted-foreground"
          onClick={onClear}
        >
          <MapPin className="size-3.5" />
          Clear this nearby area
        </Button>
      </div>
    </Card>
  )
}
