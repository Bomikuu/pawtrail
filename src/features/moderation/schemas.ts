import { z } from 'zod'
import {
  idSchema,
  resourceRefSchema,
  moderationStateSchema,
  listQuerySchema,
  baseSchema,
  versionSchema,
} from '@/lib/api/schemas'

export const reportInputSchema = z.object({
  ref: resourceRefSchema,
  reason: z.string().min(1),
  details: z.string().max(2000),
})
export const reportSchema = baseSchema.extend({
  reporterId: idSchema,
  ref: resourceRefSchema,
  reason: z.string(),
  details: z.string(),
})
export const moderationItemSchema = baseSchema.extend({
  ref: resourceRefSchema,
  creatorId: idSchema,
  state: moderationStateSchema,
  version: versionSchema,
  reportIds: z.array(idSchema),
})
export const moderationFiltersSchema = listQuerySchema.extend({
  state: moderationStateSchema.optional(),
})
export const moderationDecisionSchema = z.object({
  id: idSchema,
  expectedVersion: versionSchema,
  action: z.enum([
    'publish',
    'reject',
    'remove',
    'verify',
    'revoke_verification',
  ]),
  reason: z.string().min(1),
  evidenceRefs: z.array(idSchema),
})
