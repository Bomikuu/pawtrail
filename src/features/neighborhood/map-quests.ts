import { getBrowserApi } from '@/lib/api/client'
import type { MapQuestLog } from './game/discovery/quests'
import type { MapAnimal } from './game/discovery/types'

/** Bound background detail reads; the map can render before these finish. */
async function withConcurrency<T, R>(
  values: T[],
  read: (value: T) => Promise<R>,
  signal: AbortSignal,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(4, values.length) }, async () => {
      while (next < values.length) {
        signal.throwIfAborted()
        const index = next++
        results[index] = await read(values[index])
      }
    }),
  )
  return results
}

/** Public mission/animal facts and only this viewer's saved participation states. */
export async function loadMapQuests(signal: AbortSignal): Promise<MapQuestLog> {
  const api = getBrowserApi()
  const [session, missions] = await Promise.all([
    api.auth.session({ signal }),
    api.missions.list(
      { status: 'open', sort: 'priority', limit: 24 },
      { signal },
    ),
  ])
  const states = new Map<
    string,
    'accepted' | 'submitted' | 'approved' | 'rejected'
  >()
  if (session.actor) {
    const seen = new Set<string>()
    let cursor: string | undefined
    do {
      const page = await api.missions.participations(
        { scope: 'mine', limit: 50, ...(cursor ? { cursor } : {}) },
        { signal },
      )
      for (const participation of page.items)
        states.set(participation.missionId, participation.state)
      cursor = page.nextCursor ?? undefined
      if (cursor && seen.has(cursor))
        throw new Error('Quest progress could not finish loading.')
      if (cursor) seen.add(cursor)
    } while (cursor)
  }
  let unavailable = 0
  const records = new Map(
    missions.items.map((mission) => [mission.id, mission]),
  )
  // Joined/approved quests can be closed or outside the first open priority page.
  const own = await withConcurrency(
    [...states.keys()].filter((id) => !records.has(id)),
    async (id) => {
      try {
        const mission = await api.missions.get(id, { signal })
        if (mission.id !== id)
          throw new Error('This quest no longer matches the joined record.')
        return mission
      } catch (error) {
        if (signal.aborted) throw error
        unavailable++
        return null
      }
    },
    signal,
  )
  for (const mission of own) if (mission) records.set(mission.id, mission)
  const ids = [
    ...new Set(
      [...records.values()]
        .map((mission) => mission.animalId)
        .filter((id): id is string => !!id),
    ),
  ]
  const chunks: string[][] = []
  for (let start = 0; start < ids.length; start += 50)
    chunks.push(ids.slice(start, start + 50))
  const animals = new Map<string, MapAnimal>()
  const portraits = await withConcurrency(
    chunks,
    async (chunk) => {
      try {
        return await api.animals.list(
          { scope: 'public', ids: chunk, limit: 50 },
          { signal },
        )
      } catch (error) {
        if (signal.aborted) throw error
        unavailable++
        return null
      }
    },
    signal,
  )
  for (const page of portraits)
    for (const animal of page?.items ?? []) {
      if (animal.reviewState && animal.reviewState !== 'published') continue
      animals.set(animal.id, {
        id: animal.id,
        name: animal.name,
        species: animal.species,
        status: animal.status,
        adoptable: animal.adoptable,
        coat: animal.appearance,
        photo:
          animal.photo && !animal.photo.sensitive
            ? { url: animal.photo.url, alt: animal.photo.alt }
            : null,
      })
    }
  return {
    authenticated: !!session.actor,
    total: missions.count,
    progress: {
      joined: states.size,
      approved: [...states.values()].filter((state) => state === 'approved')
        .length,
      submitted: [...states.values()].filter((state) => state === 'submitted')
        .length,
    },
    unavailable,
    items: [...records.values()]
      .map((mission) => ({
        id: mission.id,
        title: mission.title,
        href: '/missions/' + encodeURIComponent(mission.slug),
        priority: mission.urgency,
        area: mission.location.neighborhood,
        coordinates: [
          mission.location.longitude,
          mission.location.latitude,
        ] as [number, number],
        available:
          mission.state === 'open' && Date.parse(mission.deadline) > Date.now(),
        animal: mission.animalId
          ? (animals.get(mission.animalId) ?? null)
          : null,
        participation: states.get(mission.id) ?? null,
      }))
      .sort(
        (a, b) =>
          Number(!!b.participation) +
          Number(!!b.participation && b.participation !== 'approved') -
          (Number(!!a.participation) +
            Number(!!a.participation && a.participation !== 'approved')),
      ),
  }
}
