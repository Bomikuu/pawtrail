import { z } from 'zod'
import {
  idSchema,
  resourceRefSchema,
  publicLocationSchema,
  urgencySchema,
} from '@/lib/api/schemas'

export const geoAreaSchema = z.object({
  id: idSchema,
  name: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  approximateRadiusMeters: z.number().min(500),
})
export const discoveryQuerySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive().default(5000),
  bounds: z
    .object({
      north: z.number().min(-90).max(90),
      south: z.number().min(-90).max(90),
      east: z.number().min(-180).max(180),
      west: z.number().min(-180).max(180),
    })
    .optional(),
  kinds: z.array(resourceRefSchema.shape.kind).optional(),
})
export const discoveryResultSchema = z.object({
  features: z.array(
    z.object({
      ref: resourceRefSchema,
      title: z.string(),
      location: publicLocationSchema,
      urgency: urgencySchema.optional(),
    }),
  ),
  count: z.number().int().nonnegative(),
})
