import { z } from 'zod'
import {
  idSchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
} from '@/lib/api/schemas'

export const hordeSummarySchema = baseSchema.extend({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  location: publicLocationSchema,
  photo: imageSchema.nullable(),
  animalIds: z.array(idSchema),
  contributorIds: z.array(idSchema).default([]),
})
export const hordeProfileSchema = hordeSummarySchema.extend({
  sightingIds: z.array(idSchema),
  postIds: z.array(idSchema),
  fundraiserIds: z.array(idSchema),
  missionIds: z.array(idSchema),
})
