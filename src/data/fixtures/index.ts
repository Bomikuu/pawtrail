import 'server-only'
import { animals } from './animals'
import { hordes } from './hordes'
import { users } from './users'
import { posts } from './posts'
import { fundraisers } from './fundraisers'
import { missions } from './missions'
import { shelters } from './shelters'
import { events } from './events'
import {
  sightings,
  comments,
  contributions,
  participations,
  kibbleEntries,
  namingAwards,
  rsvps,
} from './activity'
import { geoAreaSchema } from '@/features/discovery/schemas'
import { sampleAreas } from './scenarios'
import { ApiError } from '@/lib/api/errors'
export const areas = sampleAreas.map((area) =>
  geoAreaSchema.parse({
    id: area.areaId,
    name: area.name,
    latitude: area.latitude,
    longitude: area.longitude,
    approximateRadiusMeters: area.approximateRadiusMeters,
  }),
)
export const seed = {
  animals,
  hordes,
  users,
  posts,
  fundraisers,
  missions,
  shelters,
  events,
  sightings,
  comments,
  contributions,
  participations,
  kibbleEntries,
  namingAwards,
  rsvps,
  areas,
}
export type FixtureSeed = typeof seed
export function validateSeed(data: FixtureSeed): void {
  const collections = {
    area: data.areas,
    animal: data.animals,
    horde: data.hordes,
    user: data.users,
    post: data.posts,
    campaign: data.fundraisers,
    fundraiser: data.fundraisers,
    mission: data.missions,
    shelter: data.shelters,
    event: data.events,
    sighting: data.sightings,
    comment: data.comments,
    participation: data.participations,
    contribution: [...data.participations, ...data.namingAwards],
  }
  type Collection = keyof typeof collections
  const relationFields: Record<string, Collection> = {
    areaId: 'area',
    animalId: 'animal',
    animalIds: 'animal',
    hordeId: 'horde',
    shelterId: 'shelter',
    shelterIds: 'shelter',
    eventId: 'event',
    eventIds: 'event',
    postIds: 'post',
    fundraiserIds: 'campaign',
    campaignId: 'campaign',
    missionId: 'mission',
    missionIds: 'mission',
    sightingIds: 'sighting',
    userId: 'user',
    ownerId: 'user',
    authorId: 'user',
    organizerId: 'user',
    contributorId: 'user',
    contributorIds: 'user',
    reporterId: 'user',
    volunteerId: 'user',
    reviewerId: 'user',
    staffIds: 'user',
    helperIds: 'user',
    contributionId: 'contribution',
  }
  const requireRef = (kind: Collection, id: unknown) => {
    if (!collections[kind].some((row) => row.id === id))
      throw new ApiError(
        'INVALID_FIXTURE',
        `Unresolved sample relation: ${kind}`,
        500,
      )
  }
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return
    const object = value as Record<string, unknown>
    if (
      typeof object.kind === 'string' &&
      'id' in object &&
      object.kind in collections
    )
      requireRef(object.kind as Collection, object.id)
    for (const [key, child] of Object.entries(object)) {
      const kind = relationFields[key]
      if (kind && child !== null)
        for (const id of Array.isArray(child) ? child : [child])
          requireRef(kind, id)
      visit(child)
    }
  }
  for (const rows of Object.values(data)) {
    if (new Set(rows.map((row) => row.id)).size !== rows.length)
      throw new ApiError('INVALID_FIXTURE', 'Duplicate sample ID', 500)
    const slugs = rows.flatMap((row) => ('slug' in row ? [row.slug] : []))
    if (new Set(slugs).size !== slugs.length)
      throw new ApiError('INVALID_FIXTURE', 'Duplicate sample slug', 500)
    visit(rows)
  }
}
export const emptyPageFixture = { items: [], count: 0, nextCursor: null }
export const errorFixtures = {
  missing: new ApiError('NOT_FOUND', 'Record not found', 404),
  denied: new ApiError('FORBIDDEN', 'This action is not permitted', 403),
  conflict: new ApiError('CONFLICT', 'The record has changed', 409),
  timeout: new ApiError('TIMEOUT', 'Request timed out', 504),
}
validateSeed(seed)
