import { z } from 'zod'
import {
  adoptionApplicationSchema,
  adoptionPreferencesSchema,
} from '@/features/adoption/schemas'
import { campaignDraftSchema } from '@/features/fundraising/schemas'

export const workflowStoreSchema = z.object({
  expenseReceipts: z
    .array(
      z.object({
        expenseId: z.string(),
        campaignId: z.string(),
        mediaIds: z.array(z.string()),
      }),
    )
    .default([]),
  preferences: z
    .array(z.object({ actorId: z.string(), values: adoptionPreferencesSchema }))
    .default([]),
  interests: z
    .array(
      z.object({
        actorId: z.string(),
        animalId: z.string(),
        createdAt: z.string(),
      }),
    )
    .default([]),
  applications: z.array(adoptionApplicationSchema).default([]),
  campaignDrafts: z
    .array(
      z.object({
        id: z.string(),
        actorId: z.string(),
        createdAt: z.string(),
        version: z.number().int().positive(),
        values: campaignDraftSchema.shape.values,
      }),
    )
    .default([]),
  preciseSightings: z
    .array(
      z.object({
        id: z.string(),
        ownerId: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        photoIds: z.array(z.string()).optional(),
      }),
    )
    .default([]),
})
export type WorkflowStore = z.infer<typeof workflowStoreSchema>
export const emptyWorkflow = (): WorkflowStore => workflowStoreSchema.parse({})
