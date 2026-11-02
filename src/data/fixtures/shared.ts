import 'server-only'
import { DEMO_NOW } from '@/lib/api/clock'
export const provenance = {
  kind: 'sample' as const,
  label: 'Illustrative PawTrail sample — not a real community record',
}
export const verification = {
  status: 'illustrative' as const,
  label: 'Sample verification — not independently verified',
  evidenceRefs: [],
}
export const base = (id: string) => ({ id, createdAt: DEMO_NOW, provenance })
export const location = {
  areaId: 'area-davao-poblacion',
  neighborhood: 'Poblacion, Davao City',
  latitude: 7.073,
  longitude: 125.612,
  approximateRadiusMeters: 750,
}
export const ids = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`)
export const related = (prefix: string, count: number, shelterIndex: number) =>
  ids(prefix, count).filter((_, i) => i % 5 === shelterIndex)
