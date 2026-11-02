import { z } from 'zod'
import { idSchema, timestampSchema } from '@/lib/api/schemas'

export const actorSchema = z.object({
  id: idSchema,
  username: z.string().min(1),
  displayName: z.string().min(1),
  roles: z.array(z.enum(['member', 'shelter_staff', 'moderator'])),
  shelterIds: z.array(idSchema),
})
export const sessionSchema = z.object({
  actor: actorSchema.nullable(),
  cacheScope: z.string().min(1),
  mode: z.enum(['mock', 'real']),
  expiresAt: timestampSchema.nullable(),
})
export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
export const registerInputSchema = loginInputSchema.extend({
  username: z.string().min(3),
  displayName: z.string().min(1),
})
