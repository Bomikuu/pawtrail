import { z } from 'zod'
export const idSchema = z.string().min(1).max(120)
export const timestampSchema = z.iso.datetime({ offset: true })
export const moneySchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
export const entityKindSchema = z.enum([
  'animal',
  'horde',
  'fundraiser',
  'mission',
  'event',
  'user',
  'shelter',
  'post',
])
export const resourceRefSchema = z.object({
  kind: entityKindSchema,
  id: idSchema,
})
export const moderationStateSchema = z.enum([
  'pending',
  'published',
  'rejected',
  'removed',
])
export const listQuerySchema = z.object({
  q: z.string().max(200).optional(),
  cursor: z.string().max(2000).optional(),
  limit: z
    .number()
    .int()
    .positive()
    .transform((n) => Math.min(n, 50))
    .default(12),
})
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    count: z.number().int().nonnegative(),
    nextCursor: z.string().nullable(),
  })
export const provenanceSchema = z.object({
  kind: z.enum(['sample', 'demo', 'real']),
  label: z.string().min(1),
})
export const verificationSchema = z.object({
  status: z.enum(['unverified', 'illustrative', 'verified']),
  label: z.string().min(1),
  evidenceRefs: z.array(idSchema),
})
export const imageSchema = z.object({
  id: idSchema,
  url: z.string().min(1),
  alt: z.string().min(1),
  provenance: provenanceSchema,
})
export const publicLocationSchema = z.object({
  areaId: idSchema,
  neighborhood: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  approximateRadiusMeters: z.number().min(500),
})
export const baseSchema = z.object({
  id: idSchema,
  createdAt: timestampSchema,
  provenance: provenanceSchema,
})
export const versionSchema = z.number().int().positive()
export const urgencySchema = z.enum(['critical', 'high', 'normal'])
