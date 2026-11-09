import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  resourceRefSchema,
  baseSchema,
} from '@/lib/api/schemas'

export const notificationSchema = baseSchema.extend({
  recipientId: idSchema,
  kind: z.enum([
    'moderation',
    'comment',
    'follow',
    'application',
    'mission',
    'fundraiser',
    'event',
    'achievement',
  ]),
  message: z.string(),
  ref: resourceRefSchema.nullable(),
  readAt: timestampSchema.nullable(),
})

export const notificationViewSchema = notificationSchema.extend({
  destinationHref: z.string().startsWith('/').nullable(),
})
