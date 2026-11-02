import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import {
  context,
  areaLocation,
  stamp,
  found,
  manage,
  version,
  registerSubject,
  distanceKm,
  workflows,
  page,
  fail,
  attachments,
  filterScope,
} from '@/lib/server/workflow-context'
import {
  publicSnapshot,
  reconcilePublicMedia,
} from '@/features/moderation/service'
import { currentUser } from '@/features/users/service'
import {
  animalReportInputSchema,
  animalUpdateInputSchema,
  animalRecordSchema,
  animalProfileSchema,
  animalSummarySchema,
  animalFiltersSchema,
} from '@/features/animals/schemas'
import {
  sightingInputSchema,
  sightingFiltersSchema,
  sightingSchema,
} from '@/features/sightings/schemas'
import { discoveryQuerySchema } from './schemas'
import { searchQuerySchema } from '@/features/search/schemas'
import { toPublicAnimal } from '@/lib/server/projections'
import type { ResourceRef } from '@/types/common'
import {
  hordeProfileSchema,
  hordeSummarySchema,
} from '@/features/hordes/schemas'
import { listQuerySchema } from '@/lib/api/schemas'

export function installDiscovery(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.hordes.list = (input) => {
    const q = listQuerySchema.parse(input)
    return read((d) =>
      page(
        publicSnapshot(d).hordes.map((h) => hordeSummarySchema.parse(h)),
        q,
        'hordes',
      ),
    )
  }
  api.hordes.get = (slug) =>
    read((d) =>
      hordeProfileSchema.parse(
        found(
          publicSnapshot(d).hordes.find(
            (h) => h.slug === slug || h.id === slug,
          ),
        ),
      ),
    )
  api.animals.list = async (input) => {
    const q = animalFiltersSchema.parse(input)
    return read((d) => {
      const mine = q.scope === 'mine'
      const user = mine || q.saved ? currentUser(d) : null
      const source = mine ? d.data : publicSnapshot(d)
      return page(
        source.animals
          .filter(
            (a) =>
              (!mine ||
                a.ownerId === user!.id ||
                user!.shelterIds.includes(a.shelterId ?? '')) &&
              (!q.saved ||
                d.savedAnimals.some(
                  (s) => s.actorId === user!.id && s.animalId === a.id,
                )) &&
              (!q.ids || q.ids.includes(a.id)) &&
              (!q.species || a.species === q.species) &&
              (q.adoptable === undefined || a.adoptable === q.adoptable) &&
              (!q.shelterId || a.shelterId === q.shelterId) &&
              (!q.hordeId || a.hordeId === q.hordeId) &&
              (!q.areaId || a.location.areaId === q.areaId),
          )
          .map((a) =>
            animalSummarySchema.parse({
              ...a,
              ...(mine ? { reviewState: a.moderation } : {}),
            }),
          ),
        q,
        `animals:${mine ? user!.id : 'public'}:${filterScope(q)}`,
      )
    })
  }
  api.animals.report = async (input, options) => {
    const p = animalReportInputSchema.parse(input)
    return write('animals.report', p, options, (d, u, now) => {
      if (p.shelterId && !u.shelterIds.includes(p.shelterId))
        fail('Choose a shelter you manage.', 403)
      const a = animalRecordSchema.parse({
        ...stamp(now),
        slug: `${p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 45)}-${crypto.randomUUID().slice(0, 8)}`,
        name: p.name,
        species: p.species,
        description: p.description,
        location: areaLocation(d, p.location.areaId),
        ageMonths: 0,
        gender: 'unknown',
        size: 'medium',
        adoptable: false,
        status: 'community',
        photo: null,
        shelterId: p.shelterId ?? null,
        hordeId: null,
        verification: {
          status: 'unverified',
          label: 'Awaiting independent review',
          evidenceRefs: [],
        },
        appearance: '',
        observedCondition: '',
        personality: [],
        behavior: [],
        characteristics: [],
        badges: [],
        gallery: [],
        needs: {},
        postIds: [],
        sightingIds: [],
        fundraiserIds: [],
        missionIds: [],
        helperIds: [],
        version: 1,
        ownerId: u.id,
        moderation: 'pending',
        privateNotes: '',
      })
      d.data.animals.push(a)
      registerSubject(
        d,
        { kind: 'animal', id: a.id },
        [u.id],
        p.verificationEvidenceIds ?? [],
        p.mediaIds,
        'pending',
        1,
      )
      return animalProfileSchema.parse(a)
    })
  }
  api.animals.update = async (id, input, options) => {
    const p = animalUpdateInputSchema.parse(input)
    return write('animals.update', { id, ...p }, options, (d, u) => {
      const a = found(d.data.animals.find((a) => a.id === id))
      manage(u, a.ownerId, a.shelterId)
      version(a, p.expectedVersion)
      const oldPhotos = a.gallery.map((m) => m.id)
      const subject = d.moderation.subjects.find(
        (s) => s.ref.kind === 'animal' && s.ref.id === id,
      )
      if (p.name) a.name = p.name
      if (p.species) a.species = p.species
      if (p.description) a.description = p.description
      if (p.status) a.status = p.status
      if (p.adoptable !== undefined) {
        if (p.adoptable && !a.shelterId && !p.shelterId)
          fail('A responsible shelter is required for adoption applications.')
        a.adoptable = p.adoptable
      }
      if (p.ageMonths !== undefined) a.ageMonths = p.ageMonths
      if (p.size) a.size = p.size
      if (p.location) a.location = areaLocation(d, p.location.areaId)
      if (p.shelterId) {
        if (!u.shelterIds.includes(p.shelterId))
          fail('Shelter access required', 403)
        a.shelterId = p.shelterId
      }
      a.version++
      a.moderation = 'pending'
      a.verification = {
        status: 'unverified',
        label: 'Changed; awaiting independent review',
        evidenceRefs: [],
      }
      registerSubject(
        d,
        { kind: 'animal', id },
        [a.ownerId],
        p.verificationEvidenceIds ?? subject?.evidenceIds ?? [],
        p.mediaIds ?? subject?.photoIds ?? [],
        'pending',
        a.version,
      )
      if (p.mediaIds !== undefined) {
        a.gallery = []
        a.photo = null
      }
      reconcilePublicMedia(d, oldPhotos)
      return animalProfileSchema.parse(a)
    })
  }
  api.sightings.create = async (input, options) => {
    const p = sightingInputSchema.parse(input)
    return write('sightings.create', p, options, (d, u, now) => {
      const a = found(
        publicSnapshot(d).animals.find((a) => a.id === p.animalId),
      )
      if (p.hordeId && a.hordeId !== p.hordeId)
        fail('The animal does not belong to that Horde.')
      if (Date.parse(p.observedAt) > Date.parse(now))
        fail('An observation cannot be in the future.')
      const row = sightingSchema.parse({
        ...stamp(now),
        animalId: a.id,
        hordeId: p.hordeId ?? a.hordeId,
        reporterId: u.id,
        observedAt: p.observedAt,
        location: areaLocation(d, p.areaId),
        observation: p.observation,
        media: [],
        moderation: 'pending',
      })
      // Observations are community reports, shown publicly only after the linked profile's moderator reviews them.
      d.data.sightings.push(row)
      if ((p.exactLatitude === undefined) !== (p.exactLongitude === undefined))
        fail('Provide both private coordinates or leave both blank.')
      // Photo association is private even when no exact position was supplied.
      workflows(d).preciseSightings.push({
        id: row.id,
        ownerId: u.id,
        ...(p.exactLatitude !== undefined && p.exactLongitude !== undefined
          ? { latitude: p.exactLatitude, longitude: p.exactLongitude }
          : {}),
        photoIds: p.mediaIds,
      })
      attachments(d, p.mediaIds, 'public_image')
      found(
        d.data.animals.find((record) => record.id === a.id),
      ).sightingIds.push(row.id)
      return sightingSchema.parse(row)
    })
  }
  api.sightings.list = async (input) => {
    const q = sightingFiltersSchema.parse(input)
    return read((d) => {
      const mine = q.scope === 'mine' ? currentUser(d) : null
      const s = mine ? d.data : publicSnapshot(d)
      return page(
        s.sightings
          .filter(
            (r) =>
              (mine
                ? r.reporterId === mine.id
                : r.moderation === 'published') &&
              (!q.animalId || r.animalId === q.animalId) &&
              (!q.hordeId || r.hordeId === q.hordeId) &&
              (!q.since || Date.parse(r.observedAt) >= Date.parse(q.since)),
          )
          .map((r) =>
            sightingSchema.parse({
              ...r,
              reporterId:
                mine ||
                s.users.some(
                  (u) => u.id === r.reporterId && u.settings.showContributions,
                )
                  ? r.reporterId
                  : 'anonymous',
            }),
          ),
        q,
        `sightings:${mine?.id ?? 'public'}:${filterScope(q)}`,
      )
    })
  }
  function features(d: DemoDraft) {
    const s = publicSnapshot(d)
    const result: {
      ref: ResourceRef
      title: string
      location: (typeof s.animals)[number]['location']
      urgency?: 'critical' | 'high' | 'normal'
      href?: string
    }[] = []
    for (const a of s.animals)
      result.push({
        ref: { kind: 'animal', id: a.id },
        href: `/pets/${a.slug}`,
        title: a.name,
        location: a.location,
      })
    for (const h of s.hordes)
      result.push({
        ref: { kind: 'horde', id: h.id },
        href: `/hordes/${h.slug}`,
        title: h.name,
        location: h.location,
      })
    for (const m of s.missions)
      if (m.state === 'open')
        result.push({
          ref: { kind: 'mission', id: m.id },
          href: `/missions/${m.slug}`,
          title: m.title,
          location: m.location,
          urgency: m.urgency,
        })
    for (const f of s.fundraisers)
      result.push({
        ref: { kind: 'fundraiser', id: f.id },
        href: `/fundraisers/${f.slug}`,
        title: f.title,
        location: f.location,
        urgency: f.urgency,
      })
    for (const h of s.shelters)
      result.push({
        ref: { kind: 'shelter', id: h.id },
        href: `/shelters/${h.slug}`,
        title: h.name,
        location: h.location,
      })
    for (const e of s.events)
      if (e.state === 'scheduled')
        result.push({
          ref: { kind: 'event', id: e.id },
          href: `/events/${e.slug}`,
          title: e.title,
          location: {
            areaId: `public-event-${e.id}`,
            neighborhood: e.venue.address,
            latitude: e.venue.latitude,
            longitude: e.venue.longitude,
            approximateRadiusMeters: 500,
          },
        })
    return result
  }
  api.discovery.nearby = async (input) => {
    const q = discoveryQuerySchema.parse(input)
    if (q.radiusMeters > 100000) fail('Choose a radius of 100 km or less.')
    if (q.bounds && q.bounds.north < q.bounds.south) fail('Invalid map bounds.')
    return read((d) => {
      const rows = features(d).filter(
        (f) =>
          (!q.kinds || q.kinds.includes(f.ref.kind)) &&
          distanceKm(q, f.location) <= q.radiusMeters / 1000 &&
          (!q.bounds ||
            (f.location.latitude <= q.bounds.north &&
              f.location.latitude >= q.bounds.south &&
              (q.bounds.west <= q.bounds.east
                ? f.location.longitude >= q.bounds.west &&
                  f.location.longitude <= q.bounds.east
                : f.location.longitude >= q.bounds.west ||
                  f.location.longitude <= q.bounds.east))),
      )
      const filtered = rows.filter((f) => {
        if (f.ref.kind !== 'animal' || !q.filters) return true
        const a = d.data.animals.find((a) => a.id === f.ref.id)!
        const p = q.filters
        return (
          (!p.species || a.species === p.species) &&
          (p.adoptable === undefined || a.adoptable === p.adoptable) &&
          (!p.q ||
            `${a.name} ${a.description}`
              .toLowerCase()
              .includes(p.q.toLowerCase())) &&
          (!p.shelterId || a.shelterId === p.shelterId) &&
          (!p.hordeId || a.hordeId === p.hordeId) &&
          (!p.areaId || a.location.areaId === p.areaId)
        )
      })
      filtered.sort(
        (a, b) =>
          distanceKm(q, a.location) - distanceKm(q, b.location) ||
          a.ref.id.localeCompare(b.ref.id),
      )
      return { features: filtered, count: filtered.length }
    })
  }
  api.search.query = async (input) => {
    const q = searchQuerySchema.parse(input)
    return read((d) => {
      const s = publicSnapshot(d)
      const rows: {
        id: string
        createdAt: string
        ref: ResourceRef
        title: string
        path: string
        excerpt: string
      }[] = []
      const paths = {
        animal: 'pets',
        horde: 'hordes',
        mission: 'missions',
        fundraiser: 'fundraisers',
        shelter: 'shelters',
        event: 'events',
        post: 'community',
        user: 'users',
      }
      function add(
        kind: ResourceRef['kind'],
        records: {
          id: string
          createdAt: string
          slug?: string
          username?: string
          name?: string
          title?: string
          displayName?: string
          description?: string
          text?: string
        }[],
      ) {
        for (const r of records)
          rows.push({
            id: `${kind}:${r.id}`,
            createdAt: r.createdAt,
            ref: { kind, id: r.id },
            title:
              r.name ??
              r.title ??
              r.displayName ??
              r.text?.slice(0, 80) ??
              'Community story',
            path: `/${paths[kind]}/${encodeURIComponent(r.slug ?? r.username ?? r.id)}`,
            excerpt: (r.description ?? r.text ?? '').slice(0, 180),
          })
      }
      add('animal', s.animals)
      add('horde', s.hordes)
      add('mission', s.missions)
      add('fundraiser', s.fundraisers)
      add('shelter', s.shelters)
      add('event', s.events)
      add('post', s.posts)
      add('user', s.users)
      const result = page(
        rows.filter((r) => !q.kinds || q.kinds.includes(r.ref.kind)),
        q,
        `search:${JSON.stringify(q.kinds ?? [])}`,
      )
      return {
        ...result,
        items: result.items.map(({ ref, title, path, excerpt }) => ({
          ref,
          title,
          path,
          excerpt,
        })),
      }
    })
  }
}
