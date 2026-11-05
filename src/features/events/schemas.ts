import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  listQuerySchema,
  baseSchema,
  versionSchema,
  imageSchema,
} from '@/lib/api/schemas'

export const eventAttendeeSchema = z.object({
  id: idSchema,
  username: z.string(),
  displayName: z.string(),
  avatar: imageSchema.nullable(),
})

export const eventInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    intentionallyPublic: z.literal(true),
  }),
  capacity: z.number().int().positive(),
  shelterId: idSchema.nullable(),
  state: z.enum(['scheduled', 'cancelled']),
  expectedVersion: versionSchema.optional(),
})
export const eventSummarySchema = baseSchema.extend({
  slug: z.string(),
  title: z.string(),
  startsAt: timestampSchema,
  endsAt: timestampSchema,
  venue: eventInputSchema.shape.venue,
  capacity: z.number().int().positive(),
  attendanceCount: z.number().int().nonnegative(),
  shelterId: idSchema.nullable(),
  state: z.enum(['scheduled', 'cancelled']),
  organizerId: idSchema,
  attendees: z.array(eventAttendeeSchema).max(4).default([]),
  publicAttendeeCount: z.number().int().nonnegative().default(0),
})
export const eventDetailSchema = eventSummarySchema.extend({
  viewerAttending: z.boolean().default(false),
  viewerCanManage: z.boolean().default(false),
  rsvpOpen: z.boolean().default(false),
  attendees: z.array(eventAttendeeSchema).default([]),
  publicAttendeeCount: z.number().int().nonnegative().default(0),
  host: z
    .object({
      kind: z.enum(['user', 'shelter']),
      id: idSchema,
      name: z.string(),
      href: z.string().regex(/^\/(?:users|shelters)\/[A-Za-z0-9_%.-]+$/),
      avatar: imageSchema.nullable(),
    })
    .nullable()
    .default(null),
  description: z.string(),
  version: versionSchema,
})
export const eventFiltersSchema = listQuerySchema.extend({
  scope: z.enum(['public', 'mine']).optional(),
  shelterId: idSchema.optional(),
  state: eventSummarySchema.shape.state.optional(),
  from: timestampSchema.optional(),
  to: timestampSchema.optional(),
})
