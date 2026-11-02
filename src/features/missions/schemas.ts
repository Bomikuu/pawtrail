import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  listQuerySchema,
  publicLocationSchema,
  baseSchema,
  versionSchema,
  urgencySchema,
} from '@/lib/api/schemas'

export const missionSummarySchema = baseSchema.extend({
  slug: z.string(),
  title: z.string(),
  kind: z.enum(['mission', 'quest']),
  urgency: urgencySchema,
  state: z.enum(['open', 'closed']),
  deadline: timestampSchema,
  rewardKibble: z.number().int().nonnegative(),
  location: publicLocationSchema,
  animalId: idSchema.nullable(),
  shelterId: idSchema.nullable(),
  organizerId: idSchema,
})
export const missionDetailSchema = missionSummarySchema.extend({
  description: z.string(),
  evidenceRequirements: z.array(z.string()),
  version: versionSchema,
})
export const missionInputSchema = missionDetailSchema.pick({
  title: true,
  kind: true,
  urgency: true,
  deadline: true,
  rewardKibble: true,
  location: true,
  animalId: true,
  shelterId: true,
  description: true,
  evidenceRequirements: true,
})
export const missionFiltersSchema = listQuerySchema.extend({
  kind: missionSummarySchema.shape.kind.optional(),
  urgency: urgencySchema.optional(),
  areaId: idSchema.optional(),
})
export const missionEvidenceInputSchema = z.object({
  text: z.string().min(1),
  mediaIds: z.array(idSchema),
  expectedVersion: versionSchema,
})
export const missionReviewInputSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().min(1),
  expectedVersion: versionSchema,
})
export const missionParticipationSchema = baseSchema.extend({
  missionId: idSchema,
  volunteerId: idSchema,
  state: z.enum(['accepted', 'submitted', 'approved', 'rejected']),
  evidence: missionEvidenceInputSchema.nullable(),
  reviewerId: idSchema.nullable(),
  reviewReason: z.string().nullable(),
  version: versionSchema,
})
export const participationFiltersSchema = listQuerySchema.extend({
  missionId: idSchema.optional(),
  scope: z.enum(['mine', 'organization']).optional(),
  state: missionParticipationSchema.shape.state.optional(),
})
