import { useEffect, useRef } from 'react'
import {
  Footprints,
  LoaderCircle,
  Map,
  MapPin,
  RotateCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { distanceLabel } from '@/game/discovery/geo'
import {
  lastSeenLabel,
  mapsDirectionsHref,
  walkingTime,
} from '@/game/discovery/directions'
import { AnimalFace, ViewerMarker } from './markers'
import type { DirectionsState } from './use-directions'

export function DirectionsPanel({
  state,
  onClose,
  onRetry,
  onShowRoute,
  onPickOrigin,
  onCancelPicking,
}: {
  state: DirectionsState
  onClose: () => void
  onRetry: () => void
  onShowRoute: () => void
  onPickOrigin: () => void
  onCancelPicking: () => void
}) {
  const { target, route, phase, origin } = state
  const access = route?.accessDistanceMeters
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus({ preventScroll: true }), [target.id])
  const busy = phase === 'locating' || phase === 'routing'
  useEffect(() => {
    if (phase === 'picking')
      document
        .querySelector<HTMLElement>('[data-active-map="true"]')
        ?.focus({ preventScroll: true })
  }, [phase])
  if (phase === 'picking')
    return (
      <div
        role="status"
        className="absolute left-[var(--map-overlay-left)] right-16 top-80 lg:top-36 z-30 space-y-2 rounded-md border bg-card p-3 shadow-md lg:max-w-md"
      >
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Where are you starting from?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {state.error ? 'Location access is unavailable. ' : ''}Tap your
              position on the map to get directions to {target.name}.
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              You can also pan with the arrow keys and press Enter to use the
              map center.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancelPicking}>
            Cancel selection
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Stop directions
          </Button>
        </div>
      </div>
    )
  return (
    <Card
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
      role="region"
      aria-label={'Walking directions to ' + target.name}
      className="absolute inset-x-3 bottom-3 z-30 max-h-[50%] lg:max-h-[calc(100%-5rem)] gap-0 overflow-x-hidden overflow-y-auto [overflow-wrap:anywhere] rounded-xl border bg-card py-0 shadow-lg lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96"
    >
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-card p-4">
        {target.animal && (
          <AnimalFace animal={target.animal} className="size-12 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2
            ref={heading}
            tabIndex={-1}
            className="font-heading text-xl font-bold leading-tight outline-none"
          >
            Go to {target.name}
          </h2>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {target.area}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Stop directions"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>
      <div className="space-y-4 p-4">
        {busy && (
          <div role="status" className="flex items-center gap-3 py-2 text-sm">
            <LoaderCircle className="size-5 shrink-0 motion-safe:animate-spin text-primary" />
            {phase === 'locating'
              ? 'Finding your starting point…'
              : 'Finding a short walking route…'}
          </div>
        )}
        {phase === 'error' && (
          <p role="alert" className="text-sm leading-relaxed text-destructive">
            {state.error}
          </p>
        )}
        {route && (
          <div role="status" className="space-y-1">
            <p className="flex items-center gap-2 font-heading text-3xl font-bold">
              <Footprints className="size-6 text-primary" />
              {walkingTime(route.durationSeconds)}
            </p>
            <p className="text-sm text-muted-foreground">
              {distanceLabel(route.distanceMeters)} · shortest available walking
              route
            </p>
            <p className="text-xs text-muted-foreground">
              Time is approximate. Missing or restricted mapped paths can cause
              detours.
            </p>
          </div>
        )}
        {route && access && (access.origin > 10 || access.destination > 10) && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {access.origin > 10 && (
              <>
                Start is {distanceLabel(access.origin)} from the mapped
                path.{' '}
              </>
            )}
            {access.destination > 10 && (
              <>
                Path ends {distanceLabel(access.destination)} from {target.name}
                ’s destination pin.{' '}
              </>
            )}
            Dashed links show these gaps, not confirmed walking paths; they are
            excluded from the estimate.
          </p>
        )}
        {origin && (
          <div className="flex items-center gap-3 pb-1">
            <div className="shrink-0 pb-2">
              <ViewerMarker viewer={origin} onSelect={onShowRoute} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {origin.name === 'You' ? 'Your starting point' : origin.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {origin.source === 'manual'
                  ? 'Starting point you chose on the map'
                  : `Location accuracy about ${Math.round(origin.accuracy ?? 0)} m`}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-md bg-secondary/60 p-3 text-xs leading-relaxed">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">
              Approximate location, not live tracking
            </p>
            <p className="mt-1 text-muted-foreground">
              {lastSeenLabel(target)} {target.name} may have moved.
            </p>
            {target.approximateRadiusMeters && (
              <p className="mt-1 text-muted-foreground">
                Published area: about{' '}
                {distanceLabel(target.approximateRadiusMeters)} radius. The
                destination pin marks its public map center.
              </p>
            )}
          </div>
        </div>
        {!busy && state.destinationReady && (
          <Button
            type="button"
            onClick={onPickOrigin}
            variant={origin ? 'outline' : 'default'}
            className="w-full rounded-md"
          >
            <MapPin className="size-4" />
            {origin
              ? 'Change starting point on map'
              : 'Choose your position on the map'}
          </Button>
        )}
        <div className="flex flex-wrap gap-2">
          {route && (
            <Button type="button" variant="outline" onClick={onShowRoute}>
              <Map className="size-4" />
              Show full route
            </Button>
          )}
          {!busy && (
            <Button type="button" variant="outline" onClick={onRetry}>
              <RotateCw className="size-4" />
              {route ? 'Update route' : 'Try again'}
            </Button>
          )}
          {!busy && (
            <Button asChild variant={route ? 'outline' : 'default'}>
              <a
                href={mapsDirectionsHref(
                  target.coordinates,
                  origin?.coordinates,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Maps<span className="sr-only"> (opens a new tab)</span>
              </a>
            </Button>
          )}
        </div>
        {route && route.steps.length > 0 && (
          <details className="border-t pt-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Walking directions
            </summary>
            <ol className="mt-3 max-h-48 list-decimal space-y-3 overflow-y-auto pl-5 text-sm">
              {route.steps.map((step, i) => (
                <li key={i} className="pl-1 leading-relaxed">
                  {step.instruction}
                  {step.distanceMeters > 0 && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {distanceLabel(step.distanceMeters)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </details>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Your starting point is used to request these directions, never
          published on the community map. Routing:{' '}
          <a
            href="https://valhalla.github.io/valhalla/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Valhalla
          </a>{' '}
          ·{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            OpenStreetMap contributors
          </a>
          .
        </p>
      </div>
    </Card>
  )
}
