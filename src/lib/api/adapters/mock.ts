import 'server-only'
import { createCommunityService } from '@/features/community/service'
import { geoAreaSchema } from '@/features/discovery/schemas'
import { createDemoMedia } from '@/lib/server/media/storage'
import { createDemoAuth, requireActor } from '@/lib/server/auth'
import { actorSchema } from '@/features/auth/schemas'
import { can } from '@/lib/server/permissions'
import { getApiConfig } from '../config'
import type { DemoRepository } from '@/lib/server/demo/repository'
import { z } from 'zod'
import type { PawTrailApi } from '../contracts'
import type { ListQuery, RequestOptions } from '@/types/common'
import { seed, type FixtureSeed } from '@/data/fixtures'
import { createUnimplementedApi } from '../unimplemented'
import { checkCancelled, ApiError } from '../errors'
import { paginate } from '../pagination'
import { parseInput, parseResponse } from '../validation'
import { listQuerySchema, idSchema } from '../schemas'
import {
  toPublicAnimal,
  toPublicUser,
  toPublicSupporter,
} from '@/lib/server/projections'
import {
  animalFiltersSchema,
  animalSummarySchema,
} from '@/features/animals/schemas'
import {
  hordeSummarySchema,
  hordeProfileSchema,
} from '@/features/hordes/schemas'
import {
  campaignFiltersSchema,
  campaignSummarySchema,
  campaignDetailSchema,
} from '@/features/fundraising/schemas'
import {
  missionFiltersSchema,
  missionSummarySchema,
  missionDetailSchema,
} from '@/features/missions/schemas'
import {
  shelterSummarySchema,
  shelterProfileSchema,
} from '@/features/shelters/schemas'
import {
  eventFiltersSchema,
  eventSummarySchema,
  eventDetailSchema,
} from '@/features/events/schemas'
import {
  sightingFiltersSchema,
  sightingSchema,
} from '@/features/sightings/schemas'

export function createMockApi(
  snapshot: FixtureSeed = seed,
  repository?: DemoRepository,
): PawTrailApi {
  // Each request owns its snapshot. Returned mutable DTOs cannot change the shared seed.
  const data = structuredClone(snapshot)
  const api = createUnimplementedApi()
  api.auth = createDemoAuth(repository)
  api.media = createDemoMedia(repository)
  function list<T extends { id: string; createdAt: string }>(
    rows: T[],
    query: ListQuery,
    scope: string,
    options?: RequestOptions,
  ) {
    checkCancelled(options?.signal)
    const filtered = query.q
      ? rows.filter((row) =>
          JSON.stringify(row).toLowerCase().includes(query.q!.toLowerCase()),
        )
      : rows
    const filters = Object.fromEntries(
      Object.entries(query)
        .filter(([key]) => !['cursor', 'limit'].includes(key))
        .sort(([a], [b]) => a.localeCompare(b)),
    )
    return paginate(filtered, query, `${scope}:${JSON.stringify(filters)}`)
  }
  function get<T extends z.ZodType>(
    rows: { slug?: string; id: string }[],
    key: string,
    schema: T,
    options?: RequestOptions,
  ): z.output<T> {
    checkCancelled(options?.signal)
    const record = rows.find((row) => row.slug === key || row.id === key)
    if (!record) throw new ApiError('NOT_FOUND', 'Record not found', 404)
    return parseResponse(schema, record)
  }
  api.animals.list = async (filters, options) => {
    const query = parseInput(animalFiltersSchema, filters)
    const rows = data.animals
      .filter(
        (row) =>
          row.moderation === 'published' &&
          (!query.species || row.species === query.species) &&
          (query.adoptable === undefined ||
            row.adoptable === query.adoptable) &&
          (!query.shelterId || row.shelterId === query.shelterId) &&
          (!query.hordeId || row.hordeId === query.hordeId) &&
          (!query.areaId || row.location.areaId === query.areaId),
      )
      .map((row) => parseResponse(animalSummarySchema, toPublicAnimal(row)))
    return list(rows, query, 'animals', options)
  }
  api.animals.get = async (slug, options) => {
    checkCancelled(options?.signal)
    const read = (
      snapshot: FixtureSeed,
      actorId: string | null,
      saved: { actorId: string; animalId: string }[],
    ) => {
      const record = snapshot.animals.find((row) => row.slug === slug)
      if (!record) throw new ApiError('NOT_FOUND', 'Animal not found', 404)
      return toPublicAnimal(
        record,
        snapshot.users,
        !!actorId &&
          saved.some(
            (row) => row.actorId === actorId && row.animalId === record.id,
          ),
      )
    }
    return repository
      ? repository.read((draft) =>
          read(draft.data, draft.auth.actorId, draft.savedAnimals),
        )
      : read(data, null, [])
  }
  api.animals.setSaved = async (id, saved, options) => {
    checkCancelled(options?.signal)
    const input = parseInput(z.object({ id: idSchema, saved: z.boolean() }), {
      id,
      saved,
    })
    if (getApiConfig().mode !== 'mock')
      throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
    if (!repository)
      throw new ApiError('UNAUTHENTICATED', 'Sign in to save animals', 401)
    await repository.transact({
      name: 'animals.setSaved',
      input,
      idempotencyKey: options?.idempotencyKey,
      execute(draft) {
        checkCancelled(options?.signal)
        const record = draft.data.users.find(
          (user) => user.id === draft.auth.actorId,
        )
        const actor = requireActor({
          api,
          mode: 'mock',
          actor: record ? actorSchema.parse(record) : null,
        })
        if (!can(actor, 'contribute'))
          throw new ApiError(
            'FORBIDDEN',
            'A community account is required',
            403,
          )
        const animal = draft.data.animals.find(
          (row) => row.id === input.id && row.moderation === 'published',
        )
        if (!animal) throw new ApiError('NOT_FOUND', 'Animal not found', 404)
        draft.savedAnimals = draft.savedAnimals.filter(
          (row) => row.actorId !== actor.id || row.animalId !== input.id,
        )
        if (input.saved)
          draft.savedAnimals.push({ actorId: actor.id, animalId: input.id })
      },
    })
  }
  Object.assign(api.community, createCommunityService(data, repository))
  api.discovery.searchAreas = async (q, options) => {
    checkCancelled(options?.signal)
    const query = parseInput(z.string().max(200), q).toLowerCase()
    const read = (snapshot: FixtureSeed) =>
      snapshot.areas
        .filter((area) => area.name.toLowerCase().includes(query))
        .map((area) => parseResponse(geoAreaSchema, area))
    return repository
      ? repository.read((draft) => read(draft.data))
      : read(data)
  }
  api.users.get = async (username, options) => {
    checkCancelled(options?.signal)
    const record = data.users.find((row) => row.username === username)
    if (!record) throw new ApiError('NOT_FOUND', 'Profile not found', 404)
    return toPublicUser(record)
  }
  api.hordes.list = async (filters, options) =>
    list(
      data.hordes.map((row) => parseResponse(hordeSummarySchema, row)),
      parseInput(listQuerySchema, filters),
      'hordes',
      options,
    )
  api.hordes.get = async (slug, options) =>
    get(data.hordes, slug, hordeProfileSchema, options)
  api.fundraisers.list = async (filters, options) => {
    const query = parseInput(campaignFiltersSchema, filters)
    if (query.sort === 'urgent')
      throw new ApiError(
        'NOT_IMPLEMENTED',
        'Urgency sorting is not implemented yet',
        501,
      )
    const rows = data.fundraisers.filter(
      (row) =>
        ['active', 'completed', 'closed'].includes(row.state) &&
        (!query.state || row.state === query.state) &&
        (!query.category || row.category === query.category) &&
        (!query.urgency || row.urgency === query.urgency) &&
        (!query.areaId || row.location.areaId === query.areaId) &&
        (!query.nearlyFunded ||
          (row.state === 'active' &&
            row.raisedMinor >= row.goalMinor * 0.8 &&
            row.raisedMinor < row.goalMinor)),
    )
    return list(
      rows.map((row) => parseResponse(campaignSummarySchema, row)),
      query,
      'fundraisers',
      options,
    )
  }
  api.fundraisers.get = async (slug, options) =>
    get(
      data.fundraisers.filter((row) =>
        ['active', 'completed', 'closed'].includes(row.state),
      ),
      slug,
      campaignDetailSchema,
      options,
    )
  api.fundraisers.supporters = async (id, query, options) => {
    if (
      !data.fundraisers.some(
        (row) =>
          row.id === id &&
          ['active', 'completed', 'closed'].includes(row.state),
      )
    )
      throw new ApiError('NOT_FOUND', 'Campaign not found', 404)
    const rows = data.contributions
      .filter((row) => row.campaignId === id)
      .map((row) => {
        const user = data.users.find((user) => user.id === row.contributorId)
        if (!user)
          throw new ApiError(
            'INVALID_RESPONSE',
            'Invalid supporter record',
            502,
          )
        return toPublicSupporter(row, user)
      })
    return list(
      rows,
      parseInput(listQuerySchema, query),
      `supporters:${id}`,
      options,
    )
  }
  api.missions.list = async (filters, options) => {
    const query = parseInput(missionFiltersSchema, filters)
    return list(
      data.missions
        .filter(
          (row) =>
            (!query.kind || row.kind === query.kind) &&
            (!query.urgency || row.urgency === query.urgency) &&
            (!query.areaId || row.location.areaId === query.areaId),
        )
        .map((row) => parseResponse(missionSummarySchema, row)),
      query,
      'missions',
      options,
    )
  }
  api.missions.get = async (slug, options) =>
    get(data.missions, slug, missionDetailSchema, options)
  api.shelters.list = async (filters, options) =>
    list(
      data.shelters.map((row) => parseResponse(shelterSummarySchema, row)),
      parseInput(listQuerySchema, filters),
      'shelters',
      options,
    )
  api.shelters.get = async (slug, options) =>
    get(data.shelters, slug, shelterProfileSchema, options)
  api.events.list = async (filters, options) => {
    const query = parseInput(eventFiltersSchema, filters)
    return list(
      data.events
        .filter(
          (row) =>
            (!query.shelterId || row.shelterId === query.shelterId) &&
            (!query.state || row.state === query.state) &&
            (!query.from ||
              Date.parse(row.startsAt) >= Date.parse(query.from)) &&
            (!query.to || Date.parse(row.startsAt) <= Date.parse(query.to)),
        )
        .map((row) => parseResponse(eventSummarySchema, row)),
      query,
      'events',
      options,
    )
  }
  api.events.get = async (slug, options) =>
    get(data.events, slug, eventDetailSchema, options)
  api.sightings.list = async (filters, options) => {
    const query = parseInput(sightingFiltersSchema, filters)
    return list(
      data.sightings
        .filter(
          (row) =>
            row.moderation === 'published' &&
            (!query.animalId || row.animalId === query.animalId) &&
            (!query.hordeId || row.hordeId === query.hordeId) &&
            (!query.since ||
              Date.parse(row.observedAt) >= Date.parse(query.since)),
        )
        .map((row) => parseResponse(sightingSchema, row)),
      query,
      'sightings',
      options,
    )
  }
  return api
}
