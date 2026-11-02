import { z } from 'zod'
import { MAX_ATTACHMENTS } from '@/features/media/schemas'
import {
  idSchema,
  timestampSchema,
  moneySchema,
  listQuerySchema,
  provenanceSchema,
  verificationSchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
  versionSchema,
  urgencySchema,
} from '@/lib/api/schemas'

export const campaignSummarySchema = baseSchema.extend({
  hordeId: idSchema.nullable().default(null),
  slug: z.string(),
  title: z.string(),
  category: z.enum(['medical', 'food', 'rescue', 'shelter', 'community']),
  urgency: urgencySchema,
  state: z.enum([
    'draft',
    'pending_review',
    'active',
    'completed',
    'closed',
    'rejected',
  ]),
  currency: z.literal('PHP'),
  goalMinor: moneySchema.positive(),
  raisedMinor: moneySchema,
  organizerId: idSchema,
  shelterId: idSchema.nullable(),
  animalId: idSchema.nullable(),
  location: publicLocationSchema,
  photo: imageSchema.nullable(),
  verification: verificationSchema,
})
export const campaignStoryUpdateInputSchema = z.object({
  text: z.string().min(1),
  mediaIds: z.array(idSchema).max(6),
})
export const campaignStoryUpdateSchema = baseSchema.extend({
  publicationPostId: idSchema.nullable().default(null),
  campaignId: idSchema,
  authorId: idSchema,
  text: z.string(),
  media: z.array(imageSchema),
})
export const expenseInputSchema = z.object({
  receiptIds: z.array(idSchema).max(6).default([]),
  amountMinor: moneySchema.positive(),
  description: z.string().min(1),
  correctsEntryId: idSchema.optional(),
})
export const expenseEntrySchema = baseSchema.extend({
  campaignId: idSchema,
  amountMinor: moneySchema.positive(),
  description: z.string(),
  correctsEntryId: idSchema.nullable(),
  authorId: idSchema,
})
export const campaignDetailSchema = campaignSummarySchema.extend({
  budget: z
    .array(
      z.object({
        description: z.string().min(1),
        amountMinor: moneySchema.positive(),
      }),
    )
    .default([]),
  timeline: z.string().max(2000).default(''),
  story: z.string(),
  gallery: z.array(imageSchema),
  updates: z.array(campaignStoryUpdateSchema),
  expenses: z.array(expenseEntrySchema),
  balanceMinor: moneySchema,
  supporterCount: z.number().int().nonnegative(),
  payoutStatus: z.enum(['demo_no_payout', 'not_requested', 'pending', 'paid']),
  version: versionSchema,
})
const campaignFieldsSchema = z.object({
  hordeId: idSchema.nullable().default(null),
  budget: z
    .array(
      z.object({
        description: z.string().min(1),
        amountMinor: moneySchema.positive(),
      }),
    )
    .default([]),
  timeline: z.string().max(2000).default(''),
  title: z.string().min(1),
  story: z.string().min(1),
  category: campaignSummarySchema.shape.category,
  urgency: urgencySchema,
  goalMinor: moneySchema.positive(),
  currency: z.literal('PHP'),
  animalId: idSchema.nullable(),
  shelterId: idSchema.nullable(),
  location: publicLocationSchema,
  mediaIds: z.array(idSchema).max(6),
  privateEvidenceIds: z.array(idSchema).max(MAX_ATTACHMENTS),
  draftId: idSchema.optional(),
  expectedVersion: versionSchema.optional(),
})
function withinAttachmentBudget(values: {
  mediaIds?: string[]
  privateEvidenceIds?: string[]
}) {
  return (
    (values.mediaIds?.length ?? 0) + (values.privateEvidenceIds?.length ?? 0) <=
    MAX_ATTACHMENTS
  )
}
const attachmentBudgetIssue = {
  message:
    'Choose up to six public photos and private evidence attachments in total',
  path: ['privateEvidenceIds'],
}
export const campaignInputSchema = campaignFieldsSchema.refine(
  withinAttachmentBudget,
  attachmentBudgetIssue,
)
export const campaignUpdateInputSchema = campaignFieldsSchema
  .omit({ draftId: true })
  .partial()
  .extend({ expectedVersion: versionSchema })
  .refine(withinAttachmentBudget, attachmentBudgetIssue)
export const campaignDraftSchema = z.object({
  id: idSchema.optional(),
  expectedVersion: versionSchema.optional(),
  values: campaignFieldsSchema
    .omit({ draftId: true, expectedVersion: true })
    .partial()
    .refine(withinAttachmentBudget, attachmentBudgetIssue),
})
export const campaignDraftSummarySchema = baseSchema.extend({
  title: z.string(),
  version: versionSchema,
})
export const campaignFiltersSchema = listQuerySchema.extend({
  category: campaignSummarySchema.shape.category.optional(),
  state: campaignSummarySchema.shape.state.optional(),
  urgency: urgencySchema.optional(),
  nearlyFunded: z.boolean().optional(),
  areaId: idSchema.optional(),
  sort: z.enum(['recent', 'urgent']).optional(),
})
export const demoDonationInputSchema = z.object({
  amountMinor: moneySchema.min(100),
  message: z.string().max(1000),
  anonymous: z.boolean(),
})
export const demoContributionSchema = baseSchema.extend({
  campaignId: idSchema,
  contributorId: idSchema,
  amountMinor: moneySchema.min(100),
  currency: z.literal('PHP'),
  message: z.string(),
  anonymous: z.boolean(),
  simulated: z.literal(true),
})
export const publicSupporterSchema = z.object({
  id: idSchema,
  displayName: z.string(),
  userId: idSchema.nullable(),
  amountMinor: moneySchema.min(100),
  message: z.string(),
  createdAt: timestampSchema,
  provenance: provenanceSchema,
})
export const fundraisingDashboardSchema = z.object({
  receipts: z
    .array(z.object({ expenseId: idSchema, mediaIds: z.array(idSchema) }))
    .default([]),
  campaigns: z.array(campaignSummarySchema),
  contributionCount: z.number().int().nonnegative(),
  totalRaisedMinor: moneySchema,
})
