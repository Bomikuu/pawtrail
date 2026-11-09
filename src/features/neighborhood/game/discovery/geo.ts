import type { MapEntity, Point, Proximity } from './types'
const R = 6371008.8
const rad = (n: number) => (n * Math.PI) / 180
export function metersBetween(a: Point, b: Point) {
  const dy = rad(b[1] - a[1]),
    dx = rad(b[0] - a[0]),
    v =
      Math.sin(dy / 2) ** 2 +
      Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dx / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)))
}
export function radiusRing(center: Point, meters: number): Point[] {
  const [lng, lat] = center.map(rad),
    angle = meters / R,
    result: Point[] = []
  for (let i = 0; i <= 64; i++) {
    const bearing = (i / 64) * Math.PI * 2,
      y = Math.asin(
        Math.sin(lat) * Math.cos(angle) +
          Math.cos(lat) * Math.sin(angle) * Math.cos(bearing),
      )
    const x =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angle) * Math.cos(lat),
        Math.cos(angle) - Math.sin(lat) * Math.sin(y),
      )
    result.push([
      (((x * 180) / Math.PI + 540) % 360) - 180,
      (y * 180) / Math.PI,
    ])
  }
  return result
}
export function circleFeature(value: Proximity | null) {
  return {
    type: 'FeatureCollection' as const,
    features: value
      ? [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'Polygon' as const,
              coordinates: [radiusRing(value.center, value.radius)],
            },
          },
        ]
      : [],
  }
}
export function withinBounds(e: MapEntity, b: readonly number[]) {
  const [x, y] = e.coordinates
  return x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]
}
export function membershipAnimals(entities: MapEntity[]) {
  const animals = new Map<
    string,
    NonNullable<MapEntity['membership']>['animals'][number]
  >()
  for (const e of entities) {
    for (const a of e.membership?.animals ?? []) animals.set(a.id, a)
    if (e.animal) animals.set(e.animal.id, e.animal)
  }
  return [...animals.values()]
}
export function composition(entities: MapEntity[]) {
  const kinds = Object.fromEntries(
    [
      'home',
      'shelter',
      'hub',
      'animal',
      'horde',
      'help',
      'urgent',
      'incident',
      'event',
    ].map((k) => [k, entities.filter((e) => e.kind === k).length]),
  )
  return {
    kinds,
    animals: membershipAnimals(entities).length,
    places: entities.length,
    documentedPlaces: entities.filter(
      (e) => (e.contribution?.verifiedCount ?? 0) > 0,
    ).length,
    openConfirmed: entities.filter((e) => e.incident?.status === 'corroborated')
      .length,
    underReview: entities.filter((e) => e.incident?.status === 'under_review')
      .length,
  }
}
export const distanceLabel = (meters: number) =>
  meters < 1000
    ? `${Math.round(meters / 10) * 10} m`
    : `${(meters / 1000).toFixed(1)} km`
