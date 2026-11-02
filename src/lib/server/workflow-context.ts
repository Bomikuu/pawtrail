import 'server-only'
import { randomUUID, createHash } from 'node:crypto'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from './demo/repository'
import type { DemoDraft } from './demo/transactions'
import type { PrivateUser } from '@/features/users/types'
import type { ListQuery, RequestOptions, ResourceRef } from '@/types/common'
import { currentUser, fixtureDraft } from '@/features/users/service'
import { emptyWorkflow } from './workflow-store'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { paginate } from '@/lib/api/pagination'
import { attachMedia, ownsMedia } from './media/storage'
import { can } from './permissions'

export const provenance = {
  kind: 'demo' as const,
  label: 'Local demonstration — no real-world action',
}
export const stamp = (now: string) => ({
  id: randomUUID(),
  createdAt: now,
  provenance,
})
export const workflows = (draft: DemoDraft) =>
  (draft.workflow ??= emptyWorkflow())
export function fail(message: string, status = 400): never {
  throw new ApiError(
    status === 403
      ? 'FORBIDDEN'
      : status === 404
        ? 'NOT_FOUND'
        : status === 409
          ? 'CONFLICT'
          : 'VALIDATION_ERROR',
    message,
    status,
  )
}
export function found<T>(row: T | undefined): T {
  if (!row) fail('Record not found', 404)
  return row
}
export function version(
  row: { version: number },
  expected: number | undefined,
) {
  if (row.version !== expected)
    fail('This record changed. Reload before saving.', 409)
}
export function manage(
  user: PrivateUser,
  ownerId: string,
  shelterId?: string | null,
) {
  if (!can(user, 'manage_resource', { ownerId, shelterId }))
    fail('This action belongs to the owner or responsible shelter.', 403)
}
export function staff(user: PrivateUser, shelterId: string | null) {
  if (!can(user, 'manage_shelter', { shelterId }))
    fail('Responsible shelter staff access is required.', 403)
}
export function context(data: FixtureSeed, repository?: DemoRepository) {
  return {
    read: <T>(fn: (draft: DemoDraft) => T | Promise<T>): Promise<T> =>
      repository
        ? repository.read(fn)
        : Promise.resolve(fn(fixtureDraft(data))),
    write: <T>(
      name: string,
      input: unknown,
      options: RequestOptions | undefined,
      fn: (draft: DemoDraft, user: PrivateUser, now: string) => T | Promise<T>,
    ): Promise<T> => {
      if (!repository)
        return Promise.reject(
          new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401),
        )
      return repository.transact({
        name,
        input: JSON.parse(JSON.stringify(input ?? null)),
        idempotencyKey: options?.idempotencyKey,
        execute(draft, clock) {
          checkCancelled(options?.signal)
          return fn(draft, currentUser(draft), clock.now().toISOString())
        },
      })
    },
  }
}
export function page<T extends { id: string; createdAt: string }>(
  rows: T[],
  query: ListQuery,
  scope: string,
) {
  const q = query.q?.trim().toLowerCase()
  return paginate(
    q
      ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
      : rows,
    query,
    `${scope}:${q ?? ''}`,
  )
}
export function filterScope(query: object) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(query)
            .filter(([k]) => !['cursor', 'limit'].includes(k))
            .sort(([a], [b]) => a.localeCompare(b)),
        ),
      ),
    )
    .digest('hex')
}
export function orderedPage<T extends { id: string }>(
  rows: T[],
  query: ListQuery,
  scope: string,
) {
  const limit = Math.min(query.limit ?? 12, 50)
  let offset = 0
  if (query.cursor) {
    try {
      const [saved, last] = JSON.parse(
        Buffer.from(query.cursor, 'base64url').toString('utf8'),
      )
      if (saved !== scope) throw new Error()
      const index = rows.findIndex((r) => r.id === last)
      if (index < 0) throw new Error()
      offset = index + 1
    } catch {
      fail(
        'This page cursor does not belong to the current results. Reload the first page.',
      )
    }
  }
  const items = rows.slice(offset, offset + limit),
    last = items.at(-1)
  return {
    items,
    count: rows.length,
    nextCursor:
      last && offset + items.length < rows.length
        ? Buffer.from(JSON.stringify([scope, last.id])).toString('base64url')
        : null,
  }
}
export function areaLocation(draft: DemoDraft, areaId: string) {
  const a = found(draft.data.areas.find((a) => a.id === areaId))
  return {
    areaId: a.id,
    neighborhood: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    approximateRadiusMeters: a.approximateRadiusMeters,
  }
}
export function attachments(
  draft: DemoDraft,
  ids: string[],
  purpose: 'private_evidence' | 'public_image',
) {
  if (
    ids.some((id) => {
      const m = draft.media.find((m) => m.asset.id === id)
      return !m || !ownsMedia(draft, m) || m.purpose !== purpose
    })
  )
    fail('Choose your own attachments with the correct purpose.', 403)
  attachMedia(draft, ids)
}
export function registerSubject(
  draft: DemoDraft,
  ref: ResourceRef,
  creatorIds: string[],
  evidenceIds: string[],
  photoIds: string[],
  state: 'pending' | 'published',
  recordVersion: number,
) {
  const existing = draft.moderation.subjects.find(
    (s) => s.ref.kind === ref.kind && s.ref.id === ref.id,
  )
  if (
    evidenceIds.length + photoIds.length > 6 ||
    new Set([...evidenceIds, ...photoIds]).size !==
      evidenceIds.length + photoIds.length
  )
    fail(
      'Choose up to six distinct photograph and evidence attachments in total.',
    )
  attachments(
    draft,
    evidenceIds.filter((id) => !existing?.evidenceIds.includes(id)),
    'private_evidence',
  )
  attachments(
    draft,
    photoIds.filter((id) => !existing?.photoIds?.includes(id)),
    'public_image',
  )
  const row =
    ref.kind === 'animal'
      ? draft.data.animals.find((a) => a.id === ref.id)
      : ref.kind === 'fundraiser'
        ? draft.data.fundraisers.find((f) => f.id === ref.id)
        : null
  const responsible = row?.shelterId
    ? draft.data.users
        .filter(
          (u) =>
            u.roles.includes('shelter_staff') &&
            u.shelterIds.includes(row.shelterId!),
        )
        .map((u) => u.id)
    : []
  const value = {
    ref,
    creatorIds: [
      ...new Set([
        ...creatorIds,
        ...(existing?.creatorIds ?? []),
        ...responsible,
      ]),
    ],
    evidenceIds,
    photoIds,
    state,
    version: recordVersion,
  }
  if (existing) Object.assign(existing, value)
  else draft.moderation.subjects.push(value)
}
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180
  const h =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
}
