import type { MapAnimal } from './types'
import type { PlatformMissionDetail } from '../platform'
export function getSampleAnimal(_id: string): MapAnimal | null {
  return null
}
export type SampleMission = Omit<PlatformMissionDetail, 'href'> & {
  animalIds: string[]
  category: string
}
export const SAMPLE_MISSIONS: SampleMission[] = []
export const getSampleMission = (id: string) =>
  SAMPLE_MISSIONS.find((m) => m.id === id) ?? null
export const sampleMissionsFor = (animalId: string) =>
  SAMPLE_MISSIONS.filter((m) => m.animalIds.includes(animalId))
export function sampleMissionHref(
  id: string,
  base = typeof window !== 'undefined' && window.location.pathname === '/'
    ? '/'
    : '/play',
) {
  return base + '?map=community&sampleMission=' + encodeURIComponent(id)
}
