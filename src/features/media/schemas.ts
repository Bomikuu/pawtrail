import { z } from 'zod'
import { idSchema } from '@/lib/api/schemas'
export const MAX_ATTACHMENTS = 6
export const mediaUploadSchema = z.object({
  file: z.custom<Blob>(
    (value) =>
      !!value &&
      typeof value === 'object' &&
      'size' in value &&
      'type' in value &&
      'arrayBuffer' in value &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.size === 'number' &&
      Number.isSafeInteger(value.size) &&
      value.size > 0 &&
      typeof value.type === 'string',
  ),
  filename: z.string().min(1).max(255),
  alt: z.string().trim().min(1).max(500),
  purpose: z.enum(['public_image', 'private_evidence']),
  sensitive: z.boolean(),
  shelterId: idSchema.optional(),
})
export const mediaAssetSchema = z.object({
  id: idSchema,
  url: z.string().min(1),
  alt: z.string().min(1),
  visibility: z.enum(['public', 'private']),
  mimeType: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]),
  bytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
})
