import type { z } from 'zod'
import type * as schemas from './schemas'
export type MediaUpload = z.infer<typeof schemas.mediaUploadSchema>
export type MediaAsset = z.infer<typeof schemas.mediaAssetSchema>
export type MediaPurpose = 'photo' | 'evidence'
export interface UploadCandidate {
  bytes: Uint8Array
  mimeType: string
  filename: string
}
export interface ValidatedUpload extends UploadCandidate {
  extension: 'jpg' | 'png' | 'webp' | 'pdf'
}
