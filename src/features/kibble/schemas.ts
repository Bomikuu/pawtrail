import { z } from 'zod'
import { achievementSummarySchema } from '@/features/achievements/schemas'
import {
  idSchema,
  provenanceSchema,
  baseSchema,
  imageSchema,
  listQuerySchema,
  pageSchema,
} from '@/lib/api/schemas'

export const kibbleEntrySchema = baseSchema.extend({
  userId: idSchema,
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0),
  reason: z.enum([
    'mission_approved',
    'mission_reversed',
    'sample_naming',
    'achievement_awarded',
    'achievement_reversed',
  ]),
  contributionId: idSchema,
  description: z.string(),
})
export const kibbleWalletSchema = z.object({
  balance: z.number().int().nonnegative(),
  nonCash: z.literal(true),
  provenance: provenanceSchema,
})
export const leaderboardPeriodSchema = z.enum(['all', 'month', 'week'])
export const leaderboardFiltersSchema = listQuerySchema.extend({
  category: z
    .enum(['all', 'missions', 'sightings', 'fundraisers'])
    .default('all'),
})
export type LeaderboardPeriod = z.infer<typeof leaderboardPeriodSchema>
export type LeaderboardFilters = z.infer<typeof leaderboardFiltersSchema>
export const leaderboardEntrySchema = z.object({
  level: z.number().int().positive(),
  avatar: imageSchema.nullable(),
  contributions: z.object({
    missions: z.number().int().nonnegative(),
    sightings: z.number().int().nonnegative(),
    fundraisers: z.number().int().nonnegative(),
  }),
  badges: z.array(z.object({ id: idSchema, label: z.string() })).max(6),
  mastery: achievementSummarySchema.nullable(),
  userId: idSchema,
  username: z.string(),
  displayName: z.string(),
  kibble: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  provenance: provenanceSchema,
})

export const leaderboardPageSchema = pageSchema(leaderboardEntrySchema).extend({
  podium: z.array(leaderboardEntrySchema).max(3),
  summary: z
    .object({
      activeHelpers: z.number().int().nonnegative(),
      kibbleEarned: z.number().int().nonnegative(),
      contributions: z.number().int().nonnegative(),
      animalsHelped: z.number().int().nonnegative(),
    })
    .nullable(),
  offset: z.number().int().nonnegative(),
  previousCursor: z.string().nullable(),
})
