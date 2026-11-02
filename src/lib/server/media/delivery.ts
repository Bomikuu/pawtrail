import 'server-only'
import { mayReviewMedia } from '@/features/moderation/service'
import type { MediaAsset } from '@/features/media/types'
import type { DemoRepository } from '@/lib/server/demo/repository'
import { can } from '@/lib/server/permissions'
import { ApiError } from '@/lib/api/errors'
import {
  mediaActor,
  ownsMedia,
  missingMedia,
  readStoredFile,
  type StoredMedia,
} from './storage'
/** ID-only private download. The public route additionally requires explicit approval. */
export async function readMedia(
  repository: DemoRepository,
  id: string,
  publicOnly = false,
): Promise<Response> {
  return repository.read(async (draft) => {
    const item = draft.media.find((item) => item.asset.id === id)
    if (
      !item ||
      (publicOnly
        ? !item.approved || item.asset.visibility !== 'public'
        : item.asset.visibility !== 'public' &&
          !ownsMedia(draft, item) &&
          !mayReviewMedia(draft, id))
    )
      return missingMedia()
    const bytes = await readStoredFile(repository, item.storageKey)
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': item.asset.mimeType,
        'Content-Length': String(bytes.length),
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${item.asset.mimeType === 'application/pdf' ? 'attachment' : 'inline'}; filename="${item.storageKey}"`,
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  })
}
/** Called by an authorized domain review, never an upload request. Private evidence cannot be promoted. */
export async function promoteMedia(
  repository: DemoRepository,
  id: string,
): Promise<MediaAsset> {
  return repository.transact({
    name: 'media.approve',
    input: { id },
    execute(draft) {
      const actor = mediaActor(draft)
      if (!can(actor, 'moderate'))
        throw new ApiError(
          'FORBIDDEN',
          'An authorized media review is required',
          403,
        )
      const item = draft.media.find((item) => item.asset.id === id)
      if (!item) missingMedia()
      if (
        item.purpose !== 'public_image' ||
        item.asset.mimeType === 'application/pdf'
      )
        throw new ApiError(
          'VALIDATION_ERROR',
          'Private evidence cannot be published',
          400,
        )
      item.approved = true
      item.attached = true
      item.asset.visibility = 'public'
      item.asset.url = `/api/v1/media/${id}/public`
      return item.asset
    },
  })
}
/** Explicit allowlist for a public record. Never pass upload results straight into public DTOs. */
export function publicMedia(item: StoredMedia) {
  const { asset } = item
  if (
    !item.approved ||
    item.purpose !== 'public_image' ||
    asset.visibility !== 'public' ||
    asset.mimeType === 'application/pdf' ||
    asset.url !== `/api/v1/media/${asset.id}/public`
  )
    throw new ApiError(
      'INVALID_MEDIA',
      'Only approved photographs may be public',
      400,
    )
  return {
    id: asset.id,
    url: asset.url,
    alt: asset.alt,
    sensitive: item.sensitive,
    provenance: { kind: 'demo' as const, label: 'Illustrative demo upload' },
  }
}
