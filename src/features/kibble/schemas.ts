import { z } from 'zod'
import { idSchema, provenanceSchema, baseSchema } from '@/lib/api/schemas'

export const kibbleEntrySchema = baseSchema.extend({
  userId: idSchema,
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0),
  reason: z.enum(['mission_approved', 'mission_reversed', 'sample_naming']),
  contributionId: idSchema,
  description: z.string(),
})
export const kibbleWalletSchema = z.object({
  balance: z.number().int().nonnegative(),
  nonCash: z.literal(true),
  provenance: provenanceSchema,
})
export const leaderboardEntrySchema = z.object({
  userId: idSchema,
  username: z.string(),
  displayName: z.string(),
  kibble: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  provenance: provenanceSchema,
})
