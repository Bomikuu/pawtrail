import { z } from 'zod'
import { profileBannerIds } from './banner-presets'
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
  bannerId: z.enum(profileBannerIds).default('meadow'),
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
  bannerId: z.enum(profileBannerIds).optional(),
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

export const profileActivitySchema = z.object({
  id: idSchema,
  kind: z.enum(['sighting', 'mission', 'fundraiser']),
  title: z.string(),
  description: z.string(),
  href: z.string().startsWith('/'),
  createdAt: z.iso.datetime({ offset: true }),
})

/** Public activity only. Private records and anonymous contribution identities never enter this DTO. */
export const publicProfileSchema = publicUserSchema.extend({
  activities: z.array(profileActivitySchema).nullable().default(null),
  impact: z
    .object({
      kibbleEarned: z.number().int().nonnegative(),
      eventsJoined: z.number().int().nonnegative(),
      membershipDays: z.number().int().nonnegative(),
      levelProgress: z.number().int().min(0).max(99),
    })
    .nullable()
    .default(null),
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
