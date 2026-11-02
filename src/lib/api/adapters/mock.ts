import 'server-only'
import { createDemoAuth } from '@/lib/server/auth'
import type { DemoRepository } from '@/lib/server/demo/repository'
import { z } from 'zod'
import type { PawTrailApi } from '../contracts'
import type { ListQuery, RequestOptions } from '@/types/common'
import { seed, type FixtureSeed } from '@/data/fixtures'
import { createUnimplementedApi } from '../unimplemented'
import { checkCancelled, ApiError } from '../errors'
import { paginate } from '../pagination'
import { parseInput, parseResponse } from '../validation'
import { listQuerySchema } from '../schemas'
import {
  toPublicAnimal,
  toPublicUser,
  toPublicSupporter,
} from '@/lib/server/projections'
import {
  animalFiltersSchema,
  animalSummarySchema,
} from '@/features/animals/schemas'
import { postFiltersSchema, postSchema } from '@/features/community/schemas'
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
    const record = data.animals.find((row) => row.slug === slug)
    if (!record) throw new ApiError('NOT_FOUND', 'Animal not found', 404)
    return toPublicAnimal(record)
  }
  api.community.list = async (filters, options) => {
    const query = parseInput(postFiltersSchema, filters)
    if (query.feed && query.feed !== 'for_you')
      throw new ApiError(
        'NOT_IMPLEMENTED',
        'This feed is not implemented yet',
        501,
      )
    const rows = data.posts.filter(
      (row) =>
        row.moderation === 'published' &&
        (!query.authorId || row.authorId === query.authorId) &&
        (!query.animalId ||
          row.refs.some(
            (ref) => ref.kind === 'animal' && ref.id === query.animalId,
          )) &&
        (!query.hordeId ||
          row.refs.some(
            (ref) => ref.kind === 'horde' && ref.id === query.hordeId,
          )),
    )
    if (query.areaId)
      throw new ApiError(
        'NOT_IMPLEMENTED',
        'Area feed filtering is not implemented yet',
        501,
      )
    return list(
      rows.map((row) => parseResponse(postSchema, row)),
      query,
      'posts',
      options,
    )
  }
  api.community.get = async (id, options) =>
    get(
      data.posts.filter((row) => row.moderation === 'published'),
      id,
      postSchema,
      options,
    )
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
