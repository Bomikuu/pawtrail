import { validCoordinates } from '../community'
import type { MapEntity, Point } from './types'
import { metersBetween } from './geo'

export type WalkingRoute = {
  coordinates: Point[]
  origin: Point
  destination: Point
  distanceMeters: number
  durationSeconds: number
  accessDistanceMeters: { origin: number; destination: number }
  steps: { instruction: string; distanceMeters: number }[]
  estimatedAt: string
  provider: string
}

export function routeDestination(entity: MapEntity): MapEntity {
  const location = entity.animal?.publicLocation
  return {
    ...entity,
    name: entity.animal?.name ?? entity.name,
    coordinates: [...(location?.coordinates ?? entity.coordinates)],
    ...(location && {
      locationLabel: location.label,
      approximateRadiusMeters: location.radiusMeters,
    }),
  }
}

export function lastSeenLabel(entity: MapEntity) {
  const date = entity.animal?.lastSeen
  const timestamp = date ? Date.parse(date) : NaN
  return Number.isFinite(timestamp)
    ? 'Last seen ' +
        new Date(timestamp).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
    : entity.animal?.associationName && !entity.animal.publicLocation
      ? 'Shared place location. No last-seen time is recorded.'
      : 'No last-seen time is recorded for this approximate location.'
}

export function mapsDirectionsHref(destination: Point, origin?: Point) {
  const query = new URLSearchParams({
    api: '1',
    destination: `${destination[1]},${destination[0]}`,
    travelmode: 'walking',
  })
  if (origin) query.set('origin', `${origin[1]},${origin[0]}`)
  return 'https://www.google.com/maps/dir/?' + query
}

export function walkingTime(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  if (minutes < 60) return `About ${minutes} min`
  const hours = Math.floor(minutes / 60),
    remainder = minutes % 60
  return `About ${hours} hr${remainder ? ` ${remainder} min` : ''}`
}

export async function walkingRoute(
  origin: Point,
  destination: Point,
  signal: AbortSignal,
): Promise<WalkingRoute> {
  const response = await fetch(
    window.location.pathname === '/'
      ? 'http://127.0.0.1:8001/api/v1/map/route/'
      : '/api/game/directions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
      cache: 'no-store',
    },
  )
  const value = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      typeof value?.detail === 'string'
        ? value.detail
        : 'Walking directions could not load. Try again or open Maps.',
    )
  if (
    !value ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length < 2 ||
    value.coordinates.length > 30000 ||
    !value.coordinates.every(validCoordinates) ||
    !Number.isFinite(value.distanceMeters) ||
    value.distanceMeters < 0 ||
    !Number.isFinite(value.durationSeconds) ||
    value.durationSeconds < 0 ||
    value.profile !== 'walking' ||
    !validCoordinates(value.origin) ||
    !validCoordinates(value.destination) ||
    metersBetween(origin, value.origin) > 2 ||
    metersBetween(destination, value.destination) > 2 ||
    !Array.isArray(value.steps)
  )
    throw new Error('The walking route was incomplete. Try again or open Maps.')
  const accessDistanceMeters = {
    origin: metersBetween(origin, value.coordinates[0]),
    destination: metersBetween(
      destination,
      value.coordinates[value.coordinates.length - 1],
    ),
  }
  if (
    Math.max(accessDistanceMeters.origin, accessDistanceMeters.destination) > 75
  )
    throw new Error(
      'This route ends too far from your selected points. Choose a nearby street or open Maps.',
    )
  return {
    ...value,
    origin,
    destination,
    accessDistanceMeters,
    steps: value.steps.filter(
      (s: { instruction?: unknown; distanceMeters?: unknown }) =>
        !!s &&
        typeof s.instruction === 'string' &&
        typeof s.distanceMeters === 'number' &&
        Number.isFinite(s.distanceMeters),
    ),
  }
}
