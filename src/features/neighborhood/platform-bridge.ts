import { loadMapQuests } from './map-quests'
import { getBrowserApi } from '@/lib/api/client'
import { loginPath } from '@/features/auth/return-path'
import { demoClock, systemClock } from '@/lib/api/clock'
import type { AnimalSummary } from '@/features/animals/types'
import type {
  PlatformAnimal,
  PlatformAnimalDetail,
  PlatformBridge,
} from '@/features/neighborhood/game/platform'
import { animalSprite, eligibleEncounter } from '@/features/neighborhood/game/platform'
import type { MapAnimal, MapEntity, MapSources } from '@/features/neighborhood/game/discovery/types'

let discoveryCache: { at: number; value: MapSources } | null = null
async function discoveryData(signal: AbortSignal): Promise<MapSources> {
  if (discoveryCache && Date.now() - discoveryCache.at < 30000)
    return discoveryCache.value
  const api = getBrowserApi(),
    warnings: string[] = [],
    entities: MapEntity[] = []
  let truncated = false
  async function pages<T>(
    name: string,
    load: (
      cursor?: string,
    ) => Promise<{ items: T[]; nextCursor?: string | null }>,
  ): Promise<T[]> {
    const result: T[] = [],
      seen = new Set<string>()
    let cursor: string | undefined
    try {
      do {
        const page = await load(cursor)
        result.push(...page.items)
        cursor = page.nextCursor ?? undefined
        if (cursor && seen.has(cursor)) throw new Error('Repeated page cursor')
        if (cursor) seen.add(cursor)
        if (result.length >= 250) {
          truncated = truncated || !!cursor
          break
        }
      } while (cursor)
    } catch (error) {
      if (signal.aborted) throw error
      warnings.push(name + ' could not finish loading.')
    }
    return result.slice(0, 250)
  }
  const [animals, shelters, hordes, missions, events] = await Promise.all([
    pages('Animals', (cursor) =>
      api.animals.list(
        { scope: 'public', limit: 50, ...(cursor ? { cursor } : {}) },
        { signal },
      ),
    ),
    pages('Shelters', (cursor) =>
      api.shelters.list(
        { limit: 50, ...(cursor ? { cursor } : {}) },
        { signal },
      ),
    ),
    pages('Hordes', (cursor) =>
      api.hordes.list({ limit: 50, ...(cursor ? { cursor } : {}) }, { signal }),
    ),
    pages('Help missions', (cursor) =>
      api.missions.list(
        { status: 'open', limit: 50, ...(cursor ? { cursor } : {}) },
        { signal },
      ),
    ),
    pages('Events', (cursor) =>
      api.events.list(
        {
          scope: 'public',
          state: 'scheduled',
          sort: 'soonest',
          limit: 50,
          ...(cursor ? { cursor } : {}),
        },
        { signal },
      ),
    ),
  ])
  const visible = animals.filter(
    (a) => !a.reviewState || a.reviewState === 'published',
  )
  const photo = (p: (typeof animals)[number]['photo']) =>
    p && !p.sensitive ? { url: p.url, alt: p.alt } : null
  const pet = (a: (typeof animals)[number]): MapAnimal => ({
    id: a.id,
    name: a.name,
    species: a.species,
    status: a.status,
    adoptable: a.adoptable,
    ageMonths: a.ageMonths ?? undefined,
    gender: a.gender,
    size: a.size,
    coat: a.appearance,
    photo: photo(a.photo),
    profileHref: '/pets/' + encodeURIComponent(a.slug),
  })
  const location = (a: { location: (typeof animals)[number]['location'] }) => ({
    area: a.location.neighborhood,
    coordinates: [a.location.longitude, a.location.latitude] as [
      number,
      number,
    ],
    locationLabel: `Published approximate location · about ${Math.round(a.location.approximateRadiusMeters)} m radius`,
  })
  for (const s of shelters) {
    const pets = visible.filter((a) => a.shelterId === s.id)
    entities.push({
      id: 'shelter:' + s.id,
      kind: 'shelter',
      name: s.name,
      description: s.description,
      ...location(s),
      sample: s.provenance.kind !== 'real',
      photo: photo(s.photo),
      membership: { animals: pets.map(pet) },
      adoptableCount: pets.filter((a) => a.adoptable).length,
      missionCount: missions.filter((m) => m.shelterId === s.id).length,
      entry: { kind: 'shelter', shelterId: s.id },
      profileHref: '/shelters/' + encodeURIComponent(s.slug),
    })
  }
  for (const h of hordes) {
    const pets = visible.filter(
      (a) => a.hordeId === h.id || h.animalIds.includes(a.id),
    )
    entities.push({
      id: 'horde:' + h.id,
      kind: 'horde',
      name: h.name,
      description: h.description,
      ...location(h),
      sample: h.provenance.kind !== 'real',
      photo: photo(h.photo),
      membership: { animals: pets.map(pet) },
      profileHref: '/hordes/' + encodeURIComponent(h.slug),
    })
  }
  for (const a of visible) {
    // A membership is not a sighting. Do not manufacture separate overlapping
    // pins from shelter/owner/Horde membership coordinates.
    if (a.shelterId || a.hordeId || ['owned', 'adopted'].includes(a.status))
      continue
    entities.push({
      id: 'animal:' + a.id,
      kind: 'animal',
      name: a.name,
      description:
        a.status === 'missing'
          ? 'A published missing-animal profile.'
          : 'A community animal with a published approximate location.',
      ...location(a),
      sample: a.provenance.kind !== 'real',
      photo: photo(a.photo),
      animal: { ...pet(a), needsHelp: a.status === 'missing' },
      profileHref: '/pets/' + encodeURIComponent(a.slug),
    })
  }
  const now = (
    process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ? demoClock : systemClock
  )
    .now()
    .getTime()
  for (const m of missions) {
    if (m.state !== 'open' || Date.parse(m.deadline) <= now) continue
    const animal = visible.find((a) => a.id === m.animalId),
      urgent = m.urgency === 'critical' || m.urgency === 'high'
    entities.push({
      id: 'help:mission:' + m.id,
      kind: urgent ? 'urgent' : 'help',
      name: m.title,
      description:
        'An open PawTrail assistance mission. Open the mission to coordinate help and see its requirements.',
      ...location(m),
      sample: m.provenance.kind !== 'real',
      photo: animal ? photo(animal.photo) : null,
      membership: { animals: animal ? [pet(animal)] : [] },
      help: {
        id: m.id,
        category: m.kind,
        priority: m.urgency,
        status: m.state,
        expiresAt: m.deadline,
        href: '/missions/' + encodeURIComponent(m.slug),
      },
      profileHref: '/missions/' + encodeURIComponent(m.slug),
    })
  }
  for (const event of events) {
    const clock = event.provenance.kind === 'real' ? systemClock : demoClock
    if (
      event.state !== 'scheduled' ||
      !event.venue.intentionallyPublic ||
      Date.parse(event.endsAt) <= clock.now().getTime()
    )
      continue
    entities.push({
      id: 'event:' + event.id,
      kind: 'event',
      name: event.title,
      description:
        'A scheduled community event. Open the event page for its description, updates and RSVP.',
      area: event.venue.name,
      coordinates: [event.venue.longitude, event.venue.latitude],
      locationLabel: 'Intentionally public event venue',
      sample: event.provenance.kind !== 'real',
      profileHref: '/events/' + encodeURIComponent(event.slug),
      event: {
        id: event.id,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue.name,
        attending: event.attendanceCount,
        capacity: event.capacity,
        href: '/events/' + encodeURIComponent(event.slug),
        attendees: event.attendees.map((a) => ({
          id: a.id,
          name: a.displayName,
          avatar: a.avatar?.url ?? null,
        })),
      },
    })
  }
  const value = { entities, warnings, truncated }
  if (!signal.aborted) discoveryCache = { at: Date.now(), value }
  return value
}

async function publicAnimal(id: string, signal: AbortSignal) {
  const api = getBrowserApi()
  // The normal detail endpoint also serves an owner's unpublished drafts. A public
  // listing gate keeps those drafts out of game deep links, even for that owner.
  const page = await api.animals.list(
    { scope: 'public', ids: [id], limit: 1 },
    { signal },
  )
  const summary = page.items.find((animal) => animal.id === id)
  if (!summary)
    throw Object.assign(new Error('Animal is no longer public.'), {
      status: 404,
    })
  const animal = await api.animals.get(summary.slug, { signal })
  if (
    animal.id !== id ||
    (animal.reviewState && animal.reviewState !== 'published')
  )
    throw Object.assign(new Error('Animal is no longer public.'), {
      status: 404,
    })
  return animal
}

/** Explicit projection: never pass location coordinates, private notes or evidence into Phaser. */
function project(animal: AnimalSummary, appearance = ''): PlatformAnimal {
  if (animal.species !== 'cat' && animal.species !== 'dog')
    throw new Error('This animal has no game representation yet.')
  return {
    id: animal.id,
    slug: animal.slug,
    name: animal.name,
    species: animal.species,
    sprite: animalSprite(animal.species, appearance),
    ageMonths: animal.ageMonths,
    gender: animal.gender,
    size: animal.size,
    status: animal.status,
    adoptable: animal.adoptable,
    shelterId: animal.shelterId,
    neighborhood: animal.location.neighborhood,
    photo:
      animal.photo && !animal.photo.sensitive
        ? { url: animal.photo.url, alt: animal.photo.alt }
        : null,
    provenance: {
      kind: animal.provenance.kind,
      label: animal.provenance.label,
    },
  }
}
async function following(id: string, signal: AbortSignal) {
  const seen = new Set<string>()
  let cursor: string | undefined
  do {
    const page = await getBrowserApi().follows.list(
      { kind: 'animal', limit: 50, ...(cursor ? { cursor } : {}) },
      { signal },
    )
    if (
      page.items.some(
        (edge) => edge.target.kind === 'animal' && edge.target.id === id,
      )
    )
      return true
    cursor = page.nextCursor ?? undefined
    if (cursor && seen.has(cursor))
      throw new Error('Following could not finish loading.')
    if (cursor) seen.add(cursor)
  } while (cursor)
  return false
}
export const platformBridge: PlatformBridge = {
  mapQuests: loadMapQuests,
  async getMission(id, href, signal) {
    const match = /^\/missions\/([^/?#]+)\/?$/.exec(href)
    if (!match) throw new Error('This mission link is unavailable.')
    const mission = await getBrowserApi().missions.get(
      decodeURIComponent(match[1]),
      { signal },
    )
    if (mission.id !== id)
      throw new Error('This mission no longer matches the published request.')
    return {
      id: mission.id,
      title: mission.title,
      href,
      description: mission.description,
      requirements: mission.evidenceRequirements,
      priority: mission.urgency,
      deadline: mission.deadline,
      state: mission.state,
      sample: mission.provenance.kind !== 'real',
    }
  },
  async offerMission(id, href, signal) {
    const api = getBrowserApi(),
      session = await api.auth.session({ signal })
    if (!session.actor)
      throw new Error('Sign in to offer help with this mission.')
    const match = /^\/missions\/([^/?#]+)\/?$/.exec(href)
    if (!match) throw new Error('This mission link is unavailable.')
    const mission = await api.missions.get(decodeURIComponent(match[1]), {
      signal,
    })
    if (mission.id !== id)
      throw new Error('This mission no longer matches the published request.')
    const clock = mission.provenance.kind === 'real' ? systemClock : demoClock
    if (
      mission.state !== 'open' ||
      Date.parse(mission.deadline) <= clock.now().getTime()
    )
      throw new Error(
        'This mission is no longer accepting help. Open its page for the latest update.',
      )
    const result = await api.missions.accept(mission.id, { signal })
    return { state: result.state, title: mission.title }
  },
  discovery: discoveryData,
  communityStats: (signal) => getBrowserApi().discovery.communityStats({ signal }),
  async mapViewer() {
    const session = await getBrowserApi().auth.session()
    return {
      id: session.actor?.id,
      name: session.actor?.displayName ?? 'You',
      avatar: session.actor?.avatar?.url ?? null,
      authenticated: !!session.actor,
      profileHref: session.actor
        ? '/users/' + encodeURIComponent(session.actor.username)
        : undefined,
      canManage: !!session.actor?.roles.some((role) =>
        ['moderator', 'shelter_staff', 'admin'].includes(role),
      ),
    }
  },
  async places(signal) {
    const items: import('@/features/neighborhood/game/community').CommunityPlace[] = []
    const seen = new Set<string>()
    let cursor: string | undefined
    do {
      const page = await getBrowserApi().shelters.list(
        { limit: 50, ...(cursor ? { cursor } : {}) },
        { signal },
      )
      for (const shelter of page.items) {
        items.push({
          id: 'shelter:' + shelter.id,
          kind: 'shelter',
          name: shelter.name,
          description: shelter.description,
          area: shelter.location.neighborhood,
          coordinates: [shelter.location.longitude, shelter.location.latitude],
          locationLabel: `Published approximate location · about ${Math.round(shelter.location.approximateRadiusMeters)} m radius`,
          sample: shelter.provenance.kind !== 'real',
          photo:
            shelter.photo && !shelter.photo.sensitive
              ? { url: shelter.photo.url, alt: shelter.photo.alt }
              : null,
          entry: { kind: 'shelter', shelterId: shelter.id },
          profileHref: '/shelters/' + encodeURIComponent(shelter.slug),
        })
      }
      cursor = page.nextCursor ?? undefined
      if (cursor && seen.has(cursor))
        throw new Error('The shelter directory could not finish loading.')
      if (cursor) seen.add(cursor)
    } while (cursor)
    return items
  },
  loginHref: loginPath,
  async list(signal) {
    const animals: PlatformAnimal[] = [],
      seen = new Set<string>()
    let cursor: string | undefined
    do {
      const page = await getBrowserApi().animals.list(
        {
          scope: 'public',
          adoptable: true,
          limit: 50,
          ...(cursor ? { cursor } : {}),
        },
        { signal },
      )
      for (const animal of page.items) {
        if (
          (animal.species === 'cat' || animal.species === 'dog') &&
          animal.shelterId &&
          (animal.reviewState === undefined ||
            animal.reviewState === 'published')
        ) {
          const publicAnimal = project(animal)
          if (
            eligibleEncounter(publicAnimal) &&
            !animals.some((a) => a.id === animal.id)
          )
            animals.push(publicAnimal)
        }
        if (animals.length === 12) return animals
      }
      cursor = page.nextCursor ?? undefined
      if (cursor && seen.has(cursor))
        throw new Error('The animal directory could not finish loading.')
      if (cursor) seen.add(cursor)
    } while (cursor)
    return animals
  },
  async get(id, signal) {
    const api = getBrowserApi(),
      animal = await publicAnimal(id, signal)
    if (animal.id !== id)
      throw new Error(
        'This animal profile changed. Please reopen the directory.',
      )
    const detail: PlatformAnimalDetail = {
      ...project(animal, animal.appearance),
      description: animal.description,
      appearance: animal.appearance,
      characteristics: [...animal.characteristics],
      personality: [...animal.personality],
      behavior: [...animal.behavior],
      observedCondition: animal.observedCondition,
      needs: [],
      checkedAt: new Date().toISOString(),
      shelter: null,
      missions: [],
      warnings: [],
      viewer: {
        authenticated: false,
        following: null,
        saved: animal.viewerSaved,
      },
    }
    const n = animal.needs
    if (n.suitableHomeTypes?.length)
      detail.needs.push('Suitable homes: ' + n.suitableHomeTypes.join(', '))
    if (n.energy) detail.needs.push('Energy level: ' + n.energy)
    if (n.requiresExperiencedHandler)
      detail.needs.push('Needs an experienced handler')
    if (n.compatiblePetTypes?.length)
      detail.needs.push('Can live with: ' + n.compatiblePetTypes.join(', '))
    if (n.incompatiblePetTypes?.length)
      detail.needs.push('Separate from: ' + n.incompatiblePetTypes.join(', '))
    // Related sections fail independently; the animal's public profile remains readable.
    const [session, shelter, missions] = await Promise.allSettled([
      api.auth.session({ signal }),
      animal.shelterId
        ? api.shelters.get(animal.shelterId, { signal })
        : Promise.resolve(null),
      Promise.allSettled(
        animal.missionIds
          .slice(0, 6)
          .map((missionId) => api.missions.get(missionId, { signal })),
      ),
    ])
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    if (session.status === 'fulfilled') {
      detail.viewer.authenticated = !!session.value.actor
      if (session.value.actor) {
        try {
          detail.viewer.following = await following(id, signal)
        } catch {
          detail.warnings.push(
            'Following could not load. Refresh to try again.',
          )
        }
      }
    } else
      detail.warnings.push(
        'Your sign-in status could not load. Refresh before using account actions.',
      )
    if (shelter.status === 'fulfilled' && shelter.value)
      detail.shelter = {
        name: shelter.value.name,
        href: '/shelters/' + encodeURIComponent(shelter.value.slug),
      }
    else if (animal.shelterId)
      detail.warnings.push('The shelter details are temporarily unavailable.')
    if (missions.status === 'fulfilled') {
      for (const result of missions.value) {
        if (result.status !== 'fulfilled') {
          detail.warnings.push('Some linked missions could not load.')
          continue
        }
        const m = result.value
        const now = (m.provenance.kind === 'real' ? systemClock : demoClock)
          .now()
          .getTime()
        if (
          m.state === 'open' &&
          new Date(m.deadline).getTime() > now &&
          (!m.animalId || m.animalId === animal.id)
        )
          detail.missions.push({
            id: m.id,
            title: m.title,
            href: '/missions/' + encodeURIComponent(m.slug),
            reward: m.rewardKibble,
            sample: m.provenance.kind !== 'real',
          })
      }
    }
    detail.warnings = [...new Set(detail.warnings)]
    return detail
  },
  async follow(id, active, signal) {
    // Resolve public visibility again; the normal API owns auth, CSRF and permissions.
    const animal = await publicAnimal(id, signal)
    if (animal.id !== id) throw new Error('Animal unavailable.')
    await getBrowserApi().follows.set({ kind: 'animal', id }, active, {
      signal,
    })
  },
  async save(id, active, signal) {
    const animal = await publicAnimal(id, signal)
    if (animal.id !== id) throw new Error('Animal unavailable.')
    await getBrowserApi().animals.setSaved(id, active, { signal })
  },
}
