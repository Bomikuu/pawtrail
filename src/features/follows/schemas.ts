import { z } from 'zod'
import { idSchema, listQuerySchema, baseSchema } from '@/lib/api/schemas'

export const followSchema = baseSchema.extend({
  followerId: idSchema,
  target: z.object({ kind: z.enum(['user', 'animal']), id: idSchema }),
})
export const followFiltersSchema = listQuerySchema.extend({
  kind: z.enum(['user', 'animal']).optional(),
})
