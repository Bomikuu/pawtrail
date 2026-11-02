import 'server-only'
import { ApiError } from '@/lib/api/errors'
import type {
  MediaPurpose,
  UploadCandidate,
  ValidatedUpload,
} from '@/features/media/types'
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export function validateUpload(
  file: UploadCandidate,
  purpose: MediaPurpose,
): ValidatedUpload {
  const bytes = Buffer.from(file.bytes)
  const fail = () => {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Choose a JPEG, PNG or WebP image, or a private PDF document, up to 10 MiB',
      400,
    )
  }
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) return fail()
  let extension: ValidatedUpload['extension'] | undefined
  if (
    file.mimeType === 'image/jpeg' &&
    bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) &&
    bytes.subarray(-2).equals(Buffer.from([0xff, 0xd9]))
  )
    extension = 'jpg'
  if (
    file.mimeType === 'image/png' &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.subarray(-8).equals(Buffer.from([73, 69, 78, 68, 174, 66, 96, 130]))
  )
    extension = 'png'
  if (
    file.mimeType === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP' &&
    bytes.length >= 16 &&
    bytes.readUInt32LE(4) === bytes.length - 8
  )
    extension = 'webp'
  if (
    purpose === 'evidence' &&
    file.mimeType === 'application/pdf' &&
    /^%PDF-1\.[0-7]/.test(bytes.toString('ascii', 0, 8)) &&
    bytes.subarray(-1024).toString('ascii').trimEnd().endsWith('%%EOF')
  )
    extension = 'pdf'
  if (!extension) return fail()
  return { ...file, bytes, extension }
}
