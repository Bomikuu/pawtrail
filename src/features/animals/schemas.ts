import { z } from 'zod'
import {
  idSchema,
  moderationStateSchema,
  listQuerySchema,
  verificationSchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
  versionSchema,
} from '@/lib/api/schemas'

export const animalNeedsSchema = z.object({
  suitableHomeTypes: z.array(z.enum(['apartment', 'house', 'farm'])).optional(),
  energy: z.enum(['low', 'medium', 'high']).optional(),
  requiresExperiencedHandler: z.boolean().optional(),
  compatiblePetTypes: z.array(z.enum(['cat', 'dog', 'other'])).optional(),
  incompatiblePetTypes: z.array(z.enum(['cat', 'dog', 'other'])).optional(),
})
export const animalSummarySchema = baseSchema.extend({
  slug: z.string().min(1),
  name: z.string().min(1),
  species: z.enum(['cat', 'dog', 'other']),
  ageMonths: z.number().int().nonnegative(),
  gender: z.enum(['female', 'male', 'unknown']),
  size: z.enum(['small', 'medium', 'large']),
  adoptable: z.boolean(),
  status: z.enum(['community', 'sheltered', 'owned', 'adopted', 'missing']),
  location: publicLocationSchema,
  photo: imageSchema.nullable(),
  shelterId: idSchema.nullable(),
  hordeId: idSchema.nullable(),
  verification: verificationSchema,
})
export const animalProfileSchema = animalSummarySchema.extend({
  description: z.string(),
  appearance: z.string(),
  observedCondition: z.string(),
  personality: z.array(z.string()),
  behavior: z.array(z.string()),
  characteristics: z.array(z.string()),
  badges: z.array(z.string()),
  gallery: z.array(imageSchema),
  needs: animalNeedsSchema,
  postIds: z.array(idSchema),
  sightingIds: z.array(idSchema),
  fundraiserIds: z.array(idSchema),
  missionIds: z.array(idSchema),
  helperIds: z.array(idSchema),
  version: versionSchema,
})
export const animalRecordSchema = animalProfileSchema.extend({
  ownerId: idSchema,
  moderation: moderationStateSchema,
  privateNotes: z.string(),
})
export const animalFiltersSchema = listQuerySchema.extend({
  species: animalSummarySchema.shape.species.optional(),
  adoptable: z.boolean().optional(),
  shelterId: idSchema.optional(),
  hordeId: idSchema.optional(),
  areaId: idSchema.optional(),
})
export const animalReportInputSchema = z.object({
  name: z.string().min(1),
  species: animalSummarySchema.shape.species,
  description: z.string().min(1),
  location: publicLocationSchema,
  mediaIds: z.array(idSchema).max(6),
  shelterId: idSchema.optional(),
})
export const animalUpdateInputSchema = animalReportInputSchema
  .partial()
  .extend({ expectedVersion: versionSchema })
