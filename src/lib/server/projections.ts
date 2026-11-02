import 'server-only'
import type { AnimalRecord, AnimalProfile } from '@/features/animals/types'
import { animalProfileSchema } from '@/features/animals/schemas'
import type { PrivateUser, PublicUser } from '@/features/users/types'
import { publicUserSchema } from '@/features/users/schemas'
import type {
  DemoContribution,
  PublicSupporter,
} from '@/features/fundraising/types'
import { publicSupporterSchema } from '@/features/fundraising/schemas'
import { parseResponse } from '@/lib/api/validation'
import { ApiError } from '@/lib/api/errors'
/** Zod object shapes recursively select only declared public fields. */
export function toPublicAnimal(
  record: AnimalRecord,
  users: PrivateUser[] = [],
  viewerSaved = false,
): AnimalProfile {
  if (record.moderation !== 'published')
    throw new ApiError('NOT_FOUND', 'Animal not found', 404)
  const helpers = record.helperIds.map((id) => {
    const user = users.find((user) => user.id === id)
    const visible =
      user?.settings.discoverable && user.settings.showContributions
    return {
      displayName: visible ? user.displayName : 'Anonymous helper',
      userId: visible ? user.id : null,
    }
  })
  return parseResponse(animalProfileSchema, {
    ...record,
    helpers,
    helperIds: helpers.flatMap((helper) =>
      helper.userId ? [helper.userId] : [],
    ),
    viewerSaved,
  })
}
export function toPublicUser(record: PrivateUser): PublicUser {
  if (!record.settings.discoverable)
    throw new ApiError('NOT_FOUND', 'Profile not found', 404)
  const user = parseResponse(publicUserSchema, record)
  user.location = record.settings.showLocation ? user.location : null
  user.contributionCount = record.settings.showContributions
    ? user.contributionCount
    : null
  return user
}
export function toPublicSupporter(
  record: DemoContribution,
  user: PrivateUser,
): PublicSupporter {
  const visible =
    !record.anonymous &&
    user.settings.showContributions &&
    user.settings.discoverable
  return parseResponse(publicSupporterSchema, {
    id: record.id,
    displayName: visible ? user.displayName : 'Anonymous helper',
    userId: visible ? user.id : null,
    amountMinor: record.amountMinor,
    message: record.message,
    createdAt: record.createdAt,
    provenance: record.provenance,
  })
}
