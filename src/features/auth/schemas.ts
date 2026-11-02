import { z } from 'zod'
import { idSchema, timestampSchema, imageSchema } from '@/lib/api/schemas'

export const actorSchema = z.object({
  id: idSchema,
  username: z.string().min(1),
  displayName: z.string().min(1),
  avatar: imageSchema.nullable().optional(),
  roles: z.array(z.enum(['member', 'shelter_staff', 'moderator'])),
  shelterIds: z.array(idSchema),
})
export const sessionSchema = z.object({
  actor: actorSchema.nullable(),
  roles: actorSchema.shape.roles,
  demo: z.boolean(),
  cacheScope: z.string().min(1),
  mode: z.enum(['mock', 'real']),
  expiresAt: timestampSchema.nullable(),
})
export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
export const registerInputSchema = loginInputSchema.extend({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, underscores or hyphens'),
  displayName: z.string().min(1),
})
