import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  moderationStateSchema,
  listQuerySchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
} from '@/lib/api/schemas'

export const sightingSchema = baseSchema.extend({
  animalId: idSchema,
  hordeId: idSchema.nullable(),
  reporterId: idSchema,
  observedAt: timestampSchema,
  location: publicLocationSchema,
  observation: z.string(),
  media: z.array(imageSchema),
  moderation: moderationStateSchema,
})
export const sightingInputSchema = z.object({
  animalId: idSchema,
  hordeId: idSchema.optional(),
  observedAt: timestampSchema,
  areaId: idSchema,
  exactLatitude: z.number().min(-90).max(90).optional(),
  exactLongitude: z.number().min(-180).max(180).optional(),
  observation: z.string().min(1),
  mediaIds: z.array(idSchema).max(6),
})
export const privateSightingSchema = sightingSchema.extend({
  exactLatitude: z.number().min(-90).max(90),
  exactLongitude: z.number().min(-180).max(180),
})
export const sightingFiltersSchema = listQuerySchema.extend({
  scope: z.enum(['public', 'mine']).optional(),
  animalId: idSchema.optional(),
  hordeId: idSchema.optional(),
  since: timestampSchema.optional(),
})
