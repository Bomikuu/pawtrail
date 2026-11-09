import { useMemo, useSyncExternalStore } from 'react'
import { getSampleMission } from './sample-missions'
const KEY = 'pawtrail:sample-mission-progress:v1',
  CHANGE = 'pawtrail-sample-progress'
type Offer = { description: string; offeredAt: string }
export type SampleProgress = {
  offers: Record<string, Offer>
  reports: {
    id: string
    animalId: string
    animalName: string
    kind: 'sighting' | 'concern'
    description: string
    createdAt: string
  }[]
}
let memory: string | null = null
function raw() {
  if (memory !== null) return memory
  try {
    return typeof window === 'undefined'
      ? ''
      : (sessionStorage.getItem(KEY) ?? '')
  } catch {
    return ''
  }
}
function parse(value: string): SampleProgress {
  const empty: SampleProgress = { offers: {}, reports: [] }
  try {
    const parsed = JSON.parse(value)
    if (parsed?.offers && typeof parsed.offers === 'object')
      for (const [id, rawOffer] of Object.entries(parsed.offers)) {
        const offer = rawOffer as Partial<Offer> | null
        if (
          getSampleMission(id) &&
          offer &&
          typeof offer.description === 'string' &&
          typeof offer.offeredAt === 'string'
        )
          empty.offers[id] = {
            description: offer.description.slice(0, 1000),
            offeredAt: offer.offeredAt,
          }
      }
    if (Array.isArray(parsed?.reports))
      for (const report of parsed.reports.slice(-50)) {
        if (
          report &&
          typeof report.id === 'string' &&
          typeof report.animalId === 'string' &&
          typeof report.animalName === 'string' &&
          typeof report.description === 'string' &&
          typeof report.createdAt === 'string' &&
          ['sighting', 'concern'].includes(report.kind)
        )
          empty.reports.push({
            id: report.id,
            animalId: report.animalId,
            animalName: report.animalName,
            kind: report.kind,
            description: report.description.slice(0, 2000),
            createdAt: report.createdAt,
          })
      }
  } catch {}
  return empty
}
function save(progress: SampleProgress) {
  const value = JSON.stringify(progress)
  try {
    sessionStorage.setItem(KEY, value)
    memory = null
  } catch {
    memory = value
  }
  window.dispatchEvent(new Event(CHANGE))
}
const subscribe = (callback: () => void) => {
  window.addEventListener(CHANGE, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE, callback)
    window.removeEventListener('storage', callback)
  }
}
export function useSampleProgress() {
  const value = useSyncExternalStore(subscribe, raw, () => '')
  return useMemo(() => parse(value), [value])
}
export function offerSampleMission(id: string, description: string) {
  if (!getSampleMission(id))
    throw new Error('This sample mission is unavailable.')
  const note = description.trim()
  if (note.length < 10 || note.length > 1000)
    throw new Error('Describe your sample offer in 10–1,000 characters.')
  const progress = parse(raw())
  progress.offers = {
    ...progress.offers,
    [id]: { description: note, offeredAt: new Date().toISOString() },
  }
  save(progress)
}
export function reportSampleAnimal(
  animalId: string,
  animalName: string,
  kind: 'sighting' | 'concern',
  description: string,
) {
  const note = description.trim()
  if (note.length < 10 || note.length > 2000)
    throw new Error('Describe your sample report in 10–2,000 characters.')
  const progress = parse(raw())
  progress.reports = [
    ...progress.reports,
    {
      id: crypto.randomUUID(),
      animalId,
      animalName,
      kind,
      description: note,
      createdAt: new Date().toISOString(),
    },
  ].slice(-50)
  save(progress)
}
