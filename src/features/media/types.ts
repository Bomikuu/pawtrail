import type { z } from 'zod'
import type * as schemas from './schemas'
export type MediaUpload = z.infer<typeof schemas.mediaUploadSchema>
export type MediaAsset = z.infer<typeof schemas.mediaAssetSchema>
