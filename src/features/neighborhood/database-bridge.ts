import { z } from 'zod'
import { captureRequest } from '@/features/capture/api'
import { captureAnimalSchema } from '@/features/capture/schemas'
import {
  animalSprite,
  type PlatformAnimal,
  type PlatformAnimalDetail,
} from '@/features/neighborhood/game/platform'
import type { MapSources } from '@/features/neighborhood/game/discovery/types'
type Animal = z.infer<typeof captureAnimalSchema>
const page = z.object({
  items: z.array(captureAnimalSchema),
  count: z.number(),
  nextCursor: z.string().nullable(),
})
function project(a: Animal): PlatformAnimal {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    species: a.species === 'dog' ? 'dog' : 'cat',
    sprite: animalSprite(a.species === 'dog' ? 'dog' : 'cat', a.appearance),
    ageMonths: null,
    gender: 'Not recorded',
    size: 'Not recorded',
    status: a.state,
    adoptable: false,
    shelterId: null,
    neighborhood: a.areaLabel,
    photo: a.photo,
    provenance: { kind: 'real', label: 'Database animal record' },
  }
}
export async function databaseList(signal: AbortSignal) {
  const result: Animal[] = []
  let cursor: string | null = null
  const seen = new Set<string>()
  do {
    const data = await captureRequest(
      'animals?limit=50' +
        (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''),
      page,
      { signal },
    )
    result.push(...data.items)
    cursor = data.nextCursor
    if (cursor && seen.has(cursor))
      throw new Error('Repeated database page cursor')
    if (cursor) seen.add(cursor)
  } while (cursor && result.length < 500)
  return { items: result, truncated: !!cursor }
}
export async function databaseDiscovery(
  signal: AbortSignal,
): Promise<MapSources> {
  const { items, truncated } = await databaseList(signal)
  return {
    entities: items
      .filter((a) => a.location)
      .map((a) => ({
        id: 'animal:' + a.id,
        kind: 'animal',
        name: a.name,
        description: a.description,
        area: a.location!.neighborhood,
        coordinates: [a.location!.longitude, a.location!.latitude],
        locationLabel:
          'Accepted approximate location · ' +
          a.location!.approximateRadiusMeters +
          ' m radius',
        sample: false,
        photo: a.photo,
        profileHref: '/pets/' + encodeURIComponent(a.slug),
        animal: {
          id: a.id,
          name: a.name,
          species: a.species,
          coat: a.appearance,
          photo: a.photo,
          profileHref: '/pets/' + encodeURIComponent(a.slug),
          lastSeen: a.lastReportedAt ?? undefined,
        },
      })),
    warnings: items.some((a) => !a.location)
      ? [
          'Animals without an accepted public location appear in Explore, not at invented map positions.',
        ]
      : [],
    truncated,
  }
}
export async function databasePlatformList(signal: AbortSignal) {
  return (await databaseList(signal)).items.map(project)
}
export async function databasePlatformGet(
  id: string,
  signal: AbortSignal,
): Promise<PlatformAnimalDetail> {
  const a = await captureRequest(
    'animals/' + encodeURIComponent(id),
    captureAnimalSchema,
    { signal },
  )
  return {
    ...project(a),
    description: a.description,
    appearance: a.appearance,
    personality: [],
    behavior: [],
    observedCondition: 'Not recorded',
    needs: [],
    checkedAt: new Date().toISOString(),
    shelter: null,
    missions: [],
    warnings: [
      'Only published database facts are shown. Adoption and mission data are not connected for this record.',
    ],
    viewer: { authenticated: false, following: null, saved: false },
  }
}
