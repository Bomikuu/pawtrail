import type { Point } from './types'
export type CommunityGeometry =
  | { type: 'Polygon'; coordinates: Point[][] }
  | { type: 'MultiPolygon'; coordinates: Point[][][] }
export type CommunityArea = {
  type: 'Feature'
  id: string
  geometry: CommunityGeometry
  properties: {
    id: string
    name: string
    kind: 'city'
    province?: string
    region?: string
    color: string
    parentId: string | null
    parentName: string | null
    city: string
    center: Point
    bounds: [number, number, number, number]
    areaKm2: number
    roomId: string
    communityId: string
    capacity: number
    sourceName: string
    sourceVersion: string
    sourceUrl: string
    custom: boolean
  }
}
export type CommunityAreas = {
  type: 'FeatureCollection'
  features: CommunityArea[]
  truncated: boolean
}
export const EMPTY_COMMUNITIES: CommunityAreas = {
  type: 'FeatureCollection',
  features: [],
  truncated: false,
}
export function invalidateCommunityAreas() {
  cache.clear()
}
const cache = new Map<string, { at: number; data: CommunityAreas }>()
const point = (value: unknown): value is Point =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
  Math.abs(value[0]) <= 180 &&
  Math.abs(value[1]) <= 85
function validGeometry(geometry: CommunityGeometry) {
  const polygons =
    geometry?.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry?.type === 'MultiPolygon'
        ? geometry.coordinates
        : null
  return (
    Array.isArray(polygons) &&
    polygons.length > 0 &&
    polygons.every(
      (polygon) =>
        Array.isArray(polygon) &&
        polygon.length > 0 &&
        polygon.every(
          (ring) =>
            Array.isArray(ring) &&
            ring.length >= 4 &&
            ring.every(point) &&
            ring[0][0] === ring.at(-1)![0] &&
            ring[0][1] === ring.at(-1)![1],
        ),
    )
  )
}
export async function loadCommunityAreas(
  bounds: readonly number[],
  signal: AbortSignal,
): Promise<CommunityAreas> {
  const key = bounds.map((n) => n.toFixed(4)).join(',')
  const old = cache.get(key)
  if (old && Date.now() - old.at < 30_000) return old.data
  const url =
    window.location.pathname === '/'
      ? 'http://127.0.0.1:8001/api/v1/map/communities/'
      : '/api/game/community-areas'
  const response = await fetch(url + '?bbox=' + encodeURIComponent(key), {
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
    credentials: 'omit',
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Local community borders could not load.')
  const data = (await response.json()) as CommunityAreas
  if (
    data.type !== 'FeatureCollection' ||
    !Array.isArray(data.features) ||
    data.features.length > 2000 ||
    data.features.some((feature) => {
      const p = feature.properties
      return (
        feature.type !== 'Feature' ||
        typeof feature.id !== 'string' ||
        !p ||
        p.id !== feature.id ||
        typeof p.name !== 'string' ||
        !point(p.center) ||
        !Array.isArray(p.bounds) ||
        p.bounds.length !== 4 ||
        !p.bounds.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
        typeof p.roomId !== 'string' ||
        p.roomId !== 'system:hub:geo:' + feature.id ||
        !/^system:hub:geo:[0-9a-f-]{36}$/.test(p.roomId) ||
        p.kind !== 'city' ||
        !/^#[0-9a-fA-F]{6}$/.test(p.color) ||
        typeof p.areaKm2 !== 'number' ||
        !Number.isFinite(p.areaKm2) ||
        typeof p.capacity !== 'number' ||
        typeof p.sourceName !== 'string' ||
        typeof p.sourceVersion !== 'string' ||
        typeof p.sourceUrl !== 'string' ||
        !p.sourceUrl.startsWith('https://') ||
        !validGeometry(feature.geometry)
      )
    })
  )
    throw new Error('The community border response was incomplete.')
  if (cache.size > 16) cache.delete(cache.keys().next().value!)
  cache.set(key, { at: Date.now(), data })
  return data
}
function inRing(point: Point, ring: Point[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j]
    if (
      Math.abs(
        (point[1] - a[1]) * (b[0] - a[0]) - (point[0] - a[0]) * (b[1] - a[1]),
      ) < 1e-12 &&
      point[0] >= Math.min(a[0], b[0]) &&
      point[0] <= Math.max(a[0], b[0]) &&
      point[1] >= Math.min(a[1], b[1]) &&
      point[1] <= Math.max(a[1], b[1])
    )
      return true
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside
  }
  return inside
}
export function communityAt(point: Point, areas: CommunityAreas) {
  return areas.features.find((feature) => {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    return polygons.some(
      (rings) =>
        inRing(point, rings[0]) &&
        !rings.slice(1).some((ring) => inRing(point, ring)),
    )
  })
}

export function communityColor(area: CommunityArea) {
  return /^#[0-9a-fA-F]{6}$/.test(area.properties.color) ? area.properties.color : '#0f766e'
}
