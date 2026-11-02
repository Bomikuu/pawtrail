import { z } from 'zod'
import { mediaAssetSchema } from '@/features/media/schemas'
import { notificationSchema } from '@/features/notifications/schemas'
import {
  idSchema,
  resourceRefSchema,
  moderationStateSchema,
  listQuerySchema,
  baseSchema,
  versionSchema,
  verificationSchema,
  imageSchema,
} from '@/lib/api/schemas'
export const reportReasonSchema = z.enum([
  'animal_welfare',
  'harassment',
  'misinformation',
  'spam',
  'privacy',
  'other',
])
export const reportInputSchema = z.object({
  target: resourceRefSchema,
  reason: reportReasonSchema,
  details: z.string().trim().max(2000).optional(),
})
/** Receipt contains only the submitter's own report, never reporter identity. */
export const reportSchema = baseSchema.extend({
  target: resourceRefSchema,
  reason: reportReasonSchema,
  details: z.string(),
})
export const storedReportSchema = reportSchema.extend({ reporterId: idSchema })
export const reviewKindSchema = z.enum(['publication', 'verification'])
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
  reason: z.string().trim().min(1).max(2000),
  evidenceRefs: z.array(idSchema).max(6).default([]),
})
export const moderationItemSchema = baseSchema.extend({
  sightingId: idSchema.optional(),
  ref: resourceRefSchema,
  commentId: idSchema.optional(),
  creatorId: idSchema.nullable(),
  kind: reviewKindSchema,
  state: moderationStateSchema,
  version: versionSchema,
  reportCount: z.number().int().nonnegative(),
  reports: z.array(
    z.object({ reason: reportReasonSchema, details: z.string() }),
  ),
  title: z.string(),
  text: z.string(),
  publicImages: z.array(imageSchema),
  media: z.array(mediaAssetSchema.extend({ sensitive: z.boolean() })),
  evidenceIds: z.array(idSchema),
  canVerify: z.boolean(),
  verification: verificationSchema.nullable(),
})
export const moderationFiltersSchema = listQuerySchema.extend({
  state: moderationStateSchema.optional(),
  kind: reviewKindSchema.optional(),
})
export const auditSchema = baseSchema.extend({
  sightingId: idSchema.optional(),
  itemId: idSchema,
  ref: resourceRefSchema,
  commentId: idSchema.optional(),
  reviewerId: idSchema,
  action: moderationDecisionSchema.shape.action,
  reason: z.string(),
  evidenceRefs: z.array(idSchema),
  previousVersion: versionSchema,
  version: versionSchema,
  previousState: moderationStateSchema,
  state: moderationStateSchema,
})
/** Only trusted domain commands register evidence. Public report input cannot grant access. */
export const reviewSubjectSchema = z.object({
  photoIds: z.array(idSchema).max(6).optional(),
  ref: resourceRefSchema,
  creatorIds: z.array(idSchema),
  evidenceIds: z.array(idSchema).max(6),
  version: versionSchema,
  state: moderationStateSchema,
})
export const moderationStoreSchema = z
  .object({
    reports: z.array(storedReportSchema),
    audit: z.array(auditSchema),
    notifications: z.array(notificationSchema),
    subjects: z.array(reviewSubjectSchema),
  })
  .strict()
