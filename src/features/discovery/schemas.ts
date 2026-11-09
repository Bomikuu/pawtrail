import { z } from 'zod'
import { animalFiltersSchema } from '@/features/animals/schemas'
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
  filters: animalFiltersSchema.optional(),
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
      href: z
        .string()
        .refine((p) => /^\/(?!\/)/.test(p) && !/[\\\u0000-\u001f]/.test(p))
        .optional(),
      title: z.string(),
      location: publicLocationSchema,
      urgency: urgencySchema.optional(),
    }),
  ),
  count: z.number().int().nonnegative(),
})

const communityAreaStatisticsSchema = z.object({
    id: idSchema, provinceId: idSchema, name: z.string(), province: z.string(),
    center: z.tuple([z.number(), z.number()]), bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    animals: z.number().int().nonnegative(), events: z.number().int().nonnegative(),
    shelters: z.number().int().nonnegative(), hordes: z.number().int().nonnegative(), help: z.number().int().nonnegative(),
    images: z.object({ animals: z.string().nullable(), shelters: z.string().nullable() }),
})
export const communityStatisticsSchema = z.object({
  generatedAt: z.iso.datetime({ offset: true }),
  cities: z.array(communityAreaStatisticsSchema),
  provinces: z.array(communityAreaStatisticsSchema),
})
