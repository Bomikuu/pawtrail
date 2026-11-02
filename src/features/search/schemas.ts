import { z } from 'zod'
import { resourceRefSchema, listQuerySchema } from '@/lib/api/schemas'

export const searchQuerySchema = listQuerySchema.extend({
  kinds: z.array(resourceRefSchema.shape.kind).optional(),
})
export const searchResultsSchema = z.object({
  items: z.array(
    z.object({
      ref: resourceRefSchema,
      title: z.string(),
      path: z.string(),
      excerpt: z.string(),
    }),
  ),
  count: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
})
