import 'server-only'
import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, unlink } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import sharp from 'sharp'
import { z } from 'zod'
import { actorSchema } from '@/features/auth/schemas'
import { mediaAssetSchema, mediaUploadSchema } from '@/features/media/schemas'
import type { MediaAsset } from '@/features/media/types'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { parseInput } from '@/lib/api/validation'
import { can } from '@/lib/server/permissions'
import { validateUpload, MAX_UPLOAD_BYTES } from './validation'

const storageKeySchema = z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/)
export const storedMediaSchema = z
  .object({
    asset: mediaAssetSchema,
    storageKey: storageKeySchema,
    ownerId: z.string().min(1),
    shelterId: z.string().nullable(),
    purpose: z.enum(['public_image', 'private_evidence']),
    sensitive: z.boolean(),
    approved: z.boolean(),
    attached: z.boolean(),
    createdAt: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (item) =>
      item.asset.url ===
        `/api/v1/media/${item.asset.id}/${item.approved ? 'public' : 'content'}` &&
      (item.asset.visibility === 'public') === item.approved &&
      (!item.approved ||
        (item.purpose === 'public_image' &&
          item.asset.mimeType !== 'application/pdf')),
    'Invalid media visibility',
  )
export type StoredMedia = z.infer<typeof storedMediaSchema>
export const ABANDONED_UPLOAD_TTL = 24 * 60 * 60 * 1000
export function mediaActor(draft: DemoDraft) {
  const user = draft.data.users.find((user) => user.id === draft.auth.actorId)
  if (!user)
    throw new ApiError('UNAUTHENTICATED', 'Sign in to upload media', 401)
  return actorSchema.parse(user)
}
export function ownsMedia(draft: DemoDraft, item: StoredMedia) {
  if (!draft.auth.actorId) return false
  return can(mediaActor(draft), 'manage_resource', {
    ownerId: item.ownerId,
    shelterId: item.shelterId,
  })
}
export function missingMedia(): never {
  throw new ApiError('NOT_FOUND', 'Media not found', 404)
}
async function safeRoot(repository: DemoRepository) {
  await mkdir(repository.mediaRoot, { recursive: true, mode: 0o700 })
  const stat = await lstat(repository.mediaRoot)
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new ApiError('INVALID_MEDIA_STORAGE', 'Unsafe media storage', 400)
  return repository.mediaRoot
}
export async function readStoredFile(
  repository: DemoRepository,
  key: string,
): Promise<Buffer> {
  const path = join(await safeRoot(repository), storageKeySchema.parse(key))
  let file
  try {
    file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch {
    return missingMedia()
  }
  try {
    const stat = await file.stat()
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > MAX_UPLOAD_BYTES)
      return missingMedia()
    return await file.readFile()
  } finally {
    await file.close()
  }
}
async function removeFile(repository: DemoRepository, key: string) {
  const path = join(await safeRoot(repository), storageKeySchema.parse(key))
  await unlink(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
  })
}
/** Future domain commands call this within their transaction, after validating their own record permissions. */
export function attachMedia(draft: DemoDraft, ids: string[]) {
  if (ids.length > 6 || new Set(ids).size !== ids.length)
    throw new ApiError(
      'VALIDATION_ERROR',
      'Choose up to six different attachments',
      400,
    )
  for (const id of ids) {
    const item = draft.media.find((item) => item.asset.id === id)
    if (!item || !ownsMedia(draft, item)) missingMedia()
    item.attached = true
  }
}
/** Sweep pending, unattached uploads plus old orphan files left by an interrupted disk transaction. */
export async function cleanupAbandonedUploads(
  repository: DemoRepository,
  now = Date.now(),
) {
  const expiredKeys = await repository.transact({
    name: 'media.cleanup',
    input: { now },
    execute(draft) {
      const expired = draft.media.filter(
        (item) =>
          !item.attached &&
          !item.approved &&
          item.createdAt + ABANDONED_UPLOAD_TTL <= now,
      )
      draft.media = draft.media.filter((item) => !expired.includes(item))
      return expired.map((item) => item.storageKey)
    },
  })
  // Commit metadata removal first: failed repository writes must never destroy retained content.
  for (const key of expiredKeys) await removeFile(repository, key)
  const kept = new Set(
    await repository.read((draft) =>
      draft.media.map((item) => item.storageKey),
    ),
  )
  const root = await safeRoot(repository)
  for (const key of await readdir(root)) {
    if (!storageKeySchema.safeParse(key).success || kept.has(key)) continue
    const stat = await lstat(join(root, key))
    if (stat.mtimeMs + ABANDONED_UPLOAD_TTL <= now)
      await removeFile(repository, key)
  }
}
export function createDemoMedia(
  repository?: DemoRepository,
): PawTrailApi['media'] {
  function writable() {
    if (!repository)
      throw new ApiError(
        'UNAUTHENTICATED',
        'Initialize a demo session and sign in first',
        401,
      )
    return repository
  }
  return {
    async upload(input, options) {
      checkCancelled(options?.signal)
      const repo = writable()
      await repo.read(mediaActor)
      const valid = parseInput(mediaUploadSchema, input)
      // Bound memory before reading the candidate; never trust only the supplied MIME or name.
      if (valid.file.size > MAX_UPLOAD_BYTES)
        throw new ApiError(
          'VALIDATION_ERROR',
          'Files must be at most 10 MiB',
          400,
        )
      const candidate = validateUpload(
        {
          bytes: new Uint8Array(await valid.file.arrayBuffer()),
          mimeType: valid.file.type,
          filename: valid.filename,
        },
        valid.purpose === 'public_image' ? 'photo' : 'evidence',
      )
      let bytes = Buffer.from(candidate.bytes)
      if (candidate.extension !== 'pdf') {
        try {
          // Decode and re-encode: strips EXIF coordinates, metadata, appended payloads and animation.
          bytes = await sharp(bytes, {
            limitInputPixels: 40_000_000,
            failOn: 'warning',
            animated: false,
          })
            .rotate()
            .toFormat(
              candidate.extension === 'jpg' ? 'jpeg' : candidate.extension,
            )
            .toBuffer()
        } catch {
          throw new ApiError(
            'VALIDATION_ERROR',
            'This image could not be safely decoded',
            400,
          )
        }
      }
      if (bytes.length > MAX_UPLOAD_BYTES)
        throw new ApiError(
          'VALIDATION_ERROR',
          'Processed image exceeds 10 MiB',
          400,
        )
      await cleanupAbandonedUploads(repo)
      let written: string | undefined
      let result: MediaAsset
      try {
        result = await repo.transact({
          name: 'media.upload',
          idempotencyKey: options?.idempotencyKey,
          input: {
            digest: createHash('sha256').update(bytes).digest('hex'),
            alt: valid.alt,
            purpose: valid.purpose,
            sensitive: valid.sensitive,
            shelterId: valid.shelterId ?? null,
            verificationShelterId: valid.verificationShelterId ?? null,
          },
          async execute(draft) {
            const actor = mediaActor(draft)
            if (
              valid.verificationShelterId &&
              (valid.purpose !== 'private_evidence' ||
                valid.shelterId !== valid.verificationShelterId ||
                !can(actor, 'manage_shelter', {
                  shelterId: valid.verificationShelterId,
                }))
            )
              throw new ApiError(
                'FORBIDDEN',
                'Only current responsible staff may submit private shelter verification evidence',
                403,
              )
            if (
              valid.shelterId &&
              !can(actor, 'manage_shelter', { shelterId: valid.shelterId })
            )
              throw new ApiError(
                'FORBIDDEN',
                'This organization is unavailable',
                403,
              )
            const id = randomUUID()
            const storageKey = `${randomUUID()}.${candidate.extension}`
            const file = await open(
              join(await safeRoot(repo), storageKey),
              'wx',
              0o600,
            )
            written = storageKey
            try {
              await file.writeFile(bytes)
              await file.sync()
            } finally {
              await file.close()
            }
            checkCancelled(options?.signal)
            const asset: MediaAsset = {
              id,
              url: `/api/v1/media/${id}/content`,
              alt: valid.alt,
              visibility: 'private',
              mimeType: candidate.mimeType as MediaAsset['mimeType'],
              bytes: bytes.length,
            }
            draft.media.push({
              asset,
              storageKey,
              ownerId: actor.id,
              shelterId: valid.shelterId ?? null,
              purpose: valid.purpose,
              sensitive: valid.sensitive,
              approved: false,
              attached: !!valid.verificationShelterId,
              createdAt: Date.now(),
            })
            if (valid.verificationShelterId) {
              const shelter = draft.data.shelters.find(
                (s) => s.id === valid.verificationShelterId,
              )
              if (!shelter)
                throw new ApiError('NOT_FOUND', 'Shelter not found', 404)
              let subject = draft.moderation.subjects.find(
                (s) => s.ref.kind === 'shelter' && s.ref.id === shelter.id,
              )
              if (!subject) {
                subject = {
                  ref: { kind: 'shelter', id: shelter.id },
                  creatorIds: draft.data.users
                    .filter((u) => u.shelterIds.includes(shelter.id))
                    .map((u) => u.id),
                  evidenceIds: [],
                  version: 1,
                  state: 'published',
                }
                draft.moderation.subjects.push(subject)
              }
              if (subject.evidenceIds.length >= 6)
                throw new ApiError(
                  'VALIDATION_ERROR',
                  'This shelter already has six evidence attachments',
                  400,
                )
              subject.evidenceIds.push(id)
              subject.version++
              shelter.verification = {
                status: 'unverified',
                label: 'New private evidence awaiting independent review',
                evidenceRefs: [],
              }
            }
            return asset
          },
        })
      } catch (error) {
        if (written) await removeFile(repo, written)
        throw error
      }
      // Receipts outlive pending upload retention. Return only a currently available, authorized asset.
      return repo.read(async (draft) => {
        const unavailable = () =>
          new ApiError(
            'UPLOAD_EXPIRED',
            'This upload is no longer available. Upload the file again.',
            410,
          )
        const item = draft.media.find((item) => item.asset.id === result.id)
        if (!item) throw unavailable()
        if (!ownsMedia(draft, item)) missingMedia()
        try {
          await readStoredFile(repo, item.storageKey)
        } catch (error) {
          if (error instanceof ApiError && error.status === 404)
            throw unavailable()
          throw error
        }
        return item.asset
      })
    },
    async remove(id, options) {
      checkCancelled(options?.signal)
      const repo = writable()
      const removed = await repo.transact({
        name: 'media.remove',
        input: { id },
        async execute(draft) {
          const item = draft.media.find((item) => item.asset.id === id)
          if (!item || !ownsMedia(draft, item)) missingMedia()
          if (item.attached || item.approved)
            throw new ApiError(
              'CONFLICT',
              'Remove media from its record before deleting it',
              409,
            )
          draft.media = draft.media.filter((entry) => entry !== item)
          return item.storageKey
        },
      })
      await removeFile(repo, removed)
    },
  }
}
