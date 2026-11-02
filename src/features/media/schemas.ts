import { z } from 'zod'
import { baseSchema } from '@/lib/api/schemas'

export const mediaUploadSchema = z.object({
  file: z.instanceof(Blob),
  filename: z.string().min(1),
  alt: z.string().min(1),
  purpose: z.enum(['public_image', 'private_evidence']),
  sensitive: z.boolean(),
})
export const mediaAssetSchema = baseSchema.extend({
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  alt: z.string().min(1),
  visibility: z.enum(['public', 'private']),
  contentPath: z.string(),
  sensitive: z.boolean(),
})
