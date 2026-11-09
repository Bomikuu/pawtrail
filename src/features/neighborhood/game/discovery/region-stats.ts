import type { Point, EntityKind } from './types'

// Aggregate records below this zoom; city boundaries keep their own visibility range.
export const CITY_MIN_ZOOM = 8
export const CITY_BOUNDARY_MIN_ZOOM = 3
export const STREET_ZOOM = 13
export const cityLevel = (zoom: number) =>
  zoom >= CITY_BOUNDARY_MIN_ZOOM && zoom < STREET_ZOOM
export type CityStatistics = {
  id: string
  provinceId: string
  name: string
  province: string
  center: Point
  bounds: [number, number, number, number]
  animals: number
  events: number
  shelters: number
  hordes: number
  help: number
  images: { animals: string | null; shelters: string | null }
}
export type CommunityStatistics = {
  cities: CityStatistics[]
  provinces: CityStatistics[]
  generatedAt: string
}
export type CityMetrics = CityStatistics & { homes: number | null }
export type CommunityMetricsState = {
  cities: CityMetrics[]
  loading: boolean
  error: boolean
  homeStatus: 'ready' | 'auth' | 'unavailable'
}
export const metricKinds = [
  'animals',
  'events',
  'homes',
  'shelters',
  'hordes',
  'help',
] as const
export type MetricKind = (typeof metricKinds)[number]
export type ProvinceSummary = {
  id: string
  name: string
  center: Point
  bounds: [number, number, number, number]
  counts: Record<MetricKind, number | null>
}
const categories: Record<MetricKind, EntityKind[]> = {
  animals: ['animal'],
  events: ['event'],
  homes: ['home'],
  shelters: ['shelter'],
  hordes: ['horde'],
  help: ['help', 'urgent', 'incident'],
}
export const visibleMetrics = (kinds: EntityKind[]) =>
  metricKinds.filter((metric) =>
    categories[metric].some((kind) => kinds.includes(kind)),
  )
export function provinceSummaries(
  provinces: CityStatistics[],
  cities: CityMetrics[],
  kinds: EntityKind[],
): ProvinceSummary[] {
  const visible = visibleMetrics(kinds)
  return provinces
    .map((province): ProvinceSummary => {
      const members = cities.filter((city) => city.provinceId === province.id)
      const homes = cities.some((city) => city.homes === null)
        ? null
        : members.reduce((sum, city) => sum + (city.homes ?? 0), 0)
      const bounds: ProvinceSummary['bounds'] = [...province.bounds]
      for (const city of members) {
        bounds[0] = Math.min(bounds[0], city.bounds[0])
        bounds[1] = Math.min(bounds[1], city.bounds[1])
        bounds[2] = Math.max(bounds[2], city.bounds[2])
        bounds[3] = Math.max(bounds[3], city.bounds[3])
      }
      return {
        id: province.id,
        name: province.name,
        bounds,
        center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
        counts: {
          animals: province.animals,
          events: province.events,
          shelters: province.shelters,
          hordes: province.hordes,
          help: province.help,
          homes,
        },
      }
    })
    .filter((province) =>
      visible.some((key) => (province.counts[key] ?? 0) > 0),
    )
}
