import { z } from 'zod'
import { idSchema, timestampSchema, imageSchema } from '@/lib/api/schemas'
import { getAvatarPreset } from '@/features/users/avatar-presets'

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
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
export const googleLoginInputSchema = z.object({
  code: z.string().min(1).max(8192),
})
export const registerInputSchema = loginInputSchema.extend({
  username: z
    .string()
    .min(3, 'Use at least 3 characters for your username')
    .max(40, 'Keep your username to 40 characters or fewer')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Use letters, numbers, underscores or hyphens'),
  displayName: z.string().min(1, 'Enter your display name'),
  avatarId: z
    .string()
    .refine((id) => !!getAvatarPreset(id), 'Choose an available profile avatar')
    .optional(),
})
