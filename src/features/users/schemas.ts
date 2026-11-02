import { z } from 'zod'
import { leaderboardRankSchema } from '@/features/kibble/recognition-schema'
import { achievementSummarySchema } from '@/features/achievements/schemas'
import { animalSummarySchema } from '@/features/animals/schemas'
import { postViewSchema } from '@/features/community/schemas'
import {
  idSchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
} from '@/lib/api/schemas'

export const privacySettingsSchema = z.object({
  showLocation: z.boolean(),
  showContributions: z.boolean(),
  discoverable: z.boolean(),
})
export const publicUserSchema = baseSchema.extend({
  username: z.string().min(1),
  displayName: z.string().min(1),
  bio: z.string(),
  avatar: imageSchema.nullable(),
  location: publicLocationSchema.nullable(),
  contributionCount: z.number().int().nonnegative().nullable(),
})
export const privateUserSchema = publicUserSchema.extend({
  email: z.email(),
  settings: privacySettingsSchema,
  roles: z.array(z.enum(['member', 'shelter_staff', 'moderator'])),
  shelterIds: z.array(idSchema),
})
export const profileInputSchema = z.object({
  displayName: z.string().min(1),
  bio: z.string().max(1000),
  avatarId: idSchema.nullable(),
  areaId: idSchema.nullable(),
})
export const dashboardSummarySchema = z.object({
  animals: z.number().int().nonnegative(),
  sightings: z.number().int().nonnegative(),
  applications: z.number().int().nonnegative(),
  unreadNotifications: z.number().int().nonnegative(),
  kibbleBalance: z.number().int().nonnegative(),
})

/** Public activity only. Private records and anonymous contribution identities never enter this DTO. */
export const publicProfileSchema = publicUserSchema.extend({
  leaderboardRank: leaderboardRankSchema,
  mastery: achievementSummarySchema.nullable().default(null),
  level: z.number().int().positive().nullable(),
  badges: z.array(z.object({ id: idSchema, label: z.string().min(1) })),
  summary: z
    .object({
      stories: z.number().int().nonnegative(),
      sightings: z.number().int().nonnegative(),
      missions: z.number().int().nonnegative(),
      donations: z.number().int().nonnegative(),
    })
    .nullable(),
  animalsHelped: z.array(animalSummarySchema),
  stories: z.array(postViewSchema),
})
