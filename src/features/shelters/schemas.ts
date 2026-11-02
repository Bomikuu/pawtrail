import { z } from 'zod'
import {
  idSchema,
  verificationSchema,
  imageSchema,
  publicLocationSchema,
  baseSchema,
} from '@/lib/api/schemas'

export const shelterSummarySchema = baseSchema.extend({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  location: publicLocationSchema,
  photo: imageSchema.nullable(),
  verification: verificationSchema,
})
export const shelterProfileSchema = shelterSummarySchema.extend({
  animalIds: z.array(idSchema),
  fundraiserIds: z.array(idSchema),
  eventIds: z.array(idSchema),
  postIds: z.array(idSchema),
  missionIds: z.array(idSchema),
  staffIds: z.array(idSchema),
})
export const shelterDashboardSchema = z.object({
  shelterId: idSchema,
  pendingApplications: z.number().int().nonnegative(),
  pendingEvidence: z.number().int().nonnegative(),
  animalIds: z.array(idSchema),
  fundraiserIds: z.array(idSchema),
  missionIds: z.array(idSchema),
  eventIds: z.array(idSchema),
  volunteerIds: z.array(idSchema),
})
