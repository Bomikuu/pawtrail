import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  resourceRefSchema,
  listQuerySchema,
} from '@/lib/api/schemas'

export const achievementClaimSchema = z.object({
  id: idSchema,
  userId: idSchema,
  badgeId: idSchema,
  state: z.enum(['active', 'revoked']),
  claimedAt: timestampSchema,
  rewardKibble: z.number().int().positive(),
  version: z.number().int().positive(),
})
export const achievementActivitySchema = z.object({
  id: idSchema,
  userId: idSchema,
  kind: z.enum(['daily', 'discovery', 'share']),
  ref: resourceRefSchema.nullable(),
  createdAt: timestampSchema,
})
export const achievementProofInputSchema = z.object({
  id: idSchema.optional(),
  expectedVersion: z.number().int().positive().optional(),
  badgeId: idSchema,
  ref: resourceRefSchema,
  occurredAt: timestampSchema,
  details: z.string().trim().min(20).max(2000),
  mediaIds: z.array(idSchema).max(6),
})
export const achievementProofSchema = z.object({
  submitterName: z.string().optional(),
  id: idSchema,
  userId: idSchema,
  badgeId: idSchema,
  ref: resourceRefSchema,
  occurredAt: timestampSchema,
  details: z.string(),
  mediaIds: z.array(idSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  dedupKey: z.string(),
  state: z.enum(['pending', 'approved', 'rejected']),
  reviewerId: idSchema.nullable(),
  reason: z.string().nullable(),
  version: z.number().int().positive(),
})
export const achievementStoreSchema = z.object({
  claims: z.array(achievementClaimSchema).default([]),
  activities: z.array(achievementActivitySchema).default([]),
  proofs: z.array(achievementProofSchema).default([]),
  showcases: z
    .array(
      z.object({
        userId: idSchema,
        badgeIds: z.array(idSchema).max(6),
        showMastery: z.boolean(),
      }),
    )
    .default([]),
})
export const achievementSummarySchema = z.object({
  unlocked: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  tier: z.string(),
  nextMilestone: z.number().int().positive().nullable(),
  kibbleEarned: z.number().int().nonnegative(),
})
export const achievementProgressSchema = z.object({
  criteria: z
    .array(
      z.object({
        label: z.string(),
        current: z.number().nonnegative(),
        target: z.number().positive(),
      }),
    )
    .default([]),
  id: idSchema,
  current: z.number().nonnegative(),
  target: z.number().positive(),
  percent: z.number().min(0).max(100),
  state: z.enum(['locked', 'ready', 'unlocked', 'revoked']),
  claimedAt: timestampSchema.nullable(),
  rewardKibble: z.number().int().positive(),
})
export const achievementOverviewSchema = z.object({
  items: z.array(achievementProgressSchema),
  summary: achievementSummarySchema,
  showcase: z.object({
    badgeIds: z.array(idSchema).max(6),
    showMastery: z.boolean(),
  }),
  pendingProofs: z.number().int().nonnegative(),
  checkedInToday: z.boolean(),
})
export const achievementShowcaseInputSchema = z.object({
  badgeIds: z
    .array(idSchema)
    .max(6)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Choose each badge once.',
    ),
  showMastery: z.boolean(),
})
export const achievementRecordInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('daily') }),
  z.object({ kind: z.literal('discovery'), ref: resourceRefSchema }),
  z.object({ kind: z.literal('share'), ref: resourceRefSchema }),
])
export const achievementReviewInputSchema = z.object({
  id: idSchema,
  expectedVersion: z.number().int().positive(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(5).max(2000),
})
export const achievementProofFiltersSchema = listQuerySchema.extend({
  scope: z.enum(['mine', 'review']).optional(),
  state: z.enum(['pending', 'approved', 'rejected']).optional(),
  badgeId: idSchema.optional(),
})
export type AchievementOverview = z.infer<typeof achievementOverviewSchema>
export type AchievementSummary = z.infer<typeof achievementSummarySchema>
export type AchievementProof = z.infer<typeof achievementProofSchema>
export type AchievementProofInput = z.infer<typeof achievementProofInputSchema>
export type AchievementReviewInput = z.infer<
  typeof achievementReviewInputSchema
>
export type AchievementShowcaseInput = z.infer<
  typeof achievementShowcaseInputSchema
>
export type AchievementRecordInput = z.infer<
  typeof achievementRecordInputSchema
>
export type AchievementProofFilters = z.infer<
  typeof achievementProofFiltersSchema
>
export type AchievementStore = z.infer<typeof achievementStoreSchema>
