import { requestPosition } from '@/features/neighborhood/game/discovery/geolocation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, LocateFixed, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMMUNITY_START } from '@/features/neighborhood/game/community'
import type { MapEntity, Point } from '@/features/neighborhood/game/discovery/types'
import { CommunityMapCanvas } from './map-canvas'

const ignore = () => {}
export function MapLocationPicker({
  value,
  onChange,
  label,
}: {
  value: Point | null
  onChange: (point: Point, label: string) => void
  label: string
}) {
  const [expanded, setExpanded] = useState(!value)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [focus, setFocus] = useState({
    point: value ?? COMMUNITY_START,
    id: 0,
    zoom: 14,
  })
  const alive = useRef(true)
  const revision = useRef(0)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const pin = useMemo<MapEntity | null>(
    () =>
      value
        ? {
            id: 'report-location',
            kind: 'hub',
            name: 'Chosen report location',
            description: '',
            area: label,
            coordinates: value,
            locationLabel: 'Private selection',
            sample: false,
          }
        : null,
    [value, label],
  )
  function choose(point: Point) {
    onChange(point, 'Selected on the map')
    setMessage(
      'Location selected. You can move the map and choose another point.',
    )
  }
  function locate() {
    if (!navigator.geolocation) {
      setMessage(
        'This browser cannot provide location. Choose a point on the map instead.',
      )
      setExpanded(true)
      return
    }
    setBusy(true)
    setMessage('Requesting your current location…')
    requestPosition(
      navigator.geolocation,
      (position) => {
        if (!alive.current) return
        const point: Point = [
          position.coords.longitude,
          position.coords.latitude,
        ]
        onChange(point, 'Near my current location')
        setFocus({ point, id: ++revision.current, zoom: 15 })
        setExpanded(true)
        setBusy(false)
        setMessage(
          `Location selected, accurate to about ${Math.round(position.coords.accuracy)} m. Adjust the pin if needed.`,
        )
      },
      () => {
        if (!alive.current) return
        setBusy(false)
        setExpanded(true)
        setMessage(
          'Location permission was unavailable. You can still choose a point on the map.',
        )
      },
    )
  }
  return (
    <section
      className="space-y-3 rounded-xl border p-3"
      aria-label="Report location"
    >
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            Where is help needed?
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Choose a point on the map or use your current location.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="text-foreground"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded || !value}
        >
          <MapPin className="size-3.5" />
          {expanded && value
            ? 'Hide map'
            : value
              ? 'Change location'
              : 'Choose on map'}
        </Button>
        <Button
          className="text-foreground"
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={locate}
        >
          <LocateFixed
            className={'size-3.5 ' + (busy ? 'motion-safe:animate-pulse' : '')}
          />
          {busy ? 'Locating…' : 'Use current location'}
        </Button>
      </div>
      {value && (
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Check className="size-3.5 text-green-700" />
          {label || 'Map location selected'}
        </p>
      )}
      {(expanded || !value) && (
        <div className="h-64 overflow-hidden rounded-lg border">
          <CommunityMapCanvas
            places={pin ? [pin] : []}
            selected={null}
            onSelect={ignore}
            onCluster={ignore}
            onBounds={ignore}
            clusters={false}
            picking
            onPick={choose}
            focus={focus}
          />
        </div>
      )}
      {message && (
        <p
          role="status"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {message}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The submitted pin stays private. A reviewer can publish an approximate
        area. You do not need to enter coordinates.
      </p>
    </section>
  )
}
