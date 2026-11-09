import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { FixtureSeed } from '@/data/fixtures'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import type { ResourceRef } from '@/types/common'
import { publicResource } from '@/features/moderation/service'
import { currentUser, fixtureDraft } from '@/features/users/service'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { getApiConfig } from '@/lib/api/config'
import { idSchema, listQuerySchema } from '@/lib/api/schemas'
import { parseInput, parseResponse } from '@/lib/api/validation'
import { paginate } from '@/lib/api/pagination'
import { isRouteReady } from '@/lib/route-readiness'
import { READY_ROUTES } from '@/components/layout/navigation'
import { notificationSchema, notificationViewSchema } from './schemas'
import type { NotificationInput } from './types'
const messages: Record<NotificationInput['kind'], string> = {
  moderation: 'A community review update is available.',
  comment: 'A reviewed comment was added to your story.',
  follow: 'A community member started following you.',
  application: 'Your adoption application has an update.',
  mission: 'Your mission activity has an update.',
  fundraiser: 'A fundraiser you support has an update.',
  event: 'An event you follow has an update.',
  achievement: 'Your achievements have an update.',
}
/** Append on the caller's draft. Never opens a transaction or accepts confidential message text. */
export function notify({
  draft,
  recipientId,
  kind,
  ref,
  now,
}: NotificationInput): Promise<void> {
  if (!draft.data.users.some((u) => u.id === recipientId))
    throw new ApiError('NOT_FOUND', 'Notification recipient not found', 404)
  draft.moderation.notifications.push(
    parseResponse(notificationSchema, {
      id: randomUUID(),
      recipientId,
      kind,
      ref,
      message: messages[kind],
      createdAt: now,
      readAt: null,
      provenance: { kind: 'demo', label: 'Illustrative in-app activity' },
    }),
  )
  return Promise.resolve()
}
function destination(draft: DemoDraft, ref: ResourceRef | null) {
  if (!ref) return { ref: null, destinationHref: null }
  let row: ReturnType<typeof publicResource>['row']
  try {
    row = publicResource(draft, ref).row
  } catch {
    // Community detail supports the author's own pending/rejected story. Other public
    // detail routes cannot render unpublished records, so no private fallback applies.
    const owned =
      ref.kind === 'post'
        ? draft.data.posts.find(
            (p) =>
              p.id === ref.id &&
              p.authorId === draft.auth.actorId &&
              p.moderation !== 'removed',
          )
        : undefined
    if (!owned) return { ref: null, destinationHref: null }
    row = owned
  }
  const paths = {
    animal: 'pets',
    post: 'community',
    user: 'users',
    horde: 'hordes',
    shelter: 'shelters',
    fundraiser: 'fundraisers',
    mission: 'missions',
    event: 'events',
  }
  const key =
    ref.kind === 'post'
      ? row.id
      : ref.kind === 'user' && 'username' in row
        ? row.username
        : 'slug' in row
          ? row.slug
          : null
  const href = key ? `/${paths[ref.kind]}/${encodeURIComponent(key)}` : null
  return {
    ref,
    destinationHref: href && isRouteReady(href, READY_ROUTES) ? href : null,
  }
}

export function createNotificationService(
  data: FixtureSeed,
  repository?: DemoRepository,
): PawTrailApi['notifications'] {
  const read = <T>(query: (draft: DemoDraft) => T) =>
    repository
      ? repository.read(query)
      : Promise.resolve(query(fixtureDraft(data)))
  return {
    async list(filters, options) {
      checkCancelled(options?.signal)
      const query = parseInput(listQuerySchema, filters)
      return read((draft) => {
        const actor = currentUser(draft)
        const rows = draft.moderation.notifications
          .filter(
            (n) =>
              n.recipientId === actor.id &&
              (!query.q ||
                messages[n.kind].toLowerCase().includes(query.q.toLowerCase())),
          )
          .map((n) =>
            parseResponse(notificationViewSchema, {
              ...n,
              message: messages[n.kind],
              ...destination(draft, n.ref),
            }),
          )
        return paginate(
          rows,
          query,
          `notifications:${actor.id}:${query.q ?? ''}`,
        )
      })
    },
    async unreadCount(options) {
      checkCancelled(options?.signal)
      return read((draft) => {
        const actor = currentUser(draft)
        return draft.moderation.notifications.filter(
          (n) => n.recipientId === actor.id && !n.readAt,
        ).length
      })
    },
    async markRead(ids, options) {
      checkCancelled(options?.signal)
      const valid = parseInput(z.array(idSchema), ids)
      if (getApiConfig().mode !== 'mock')
        throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
      if (!repository)
        throw new ApiError('UNAUTHENTICATED', 'Sign in to read activity', 401)
      await repository.transact({
        name: 'notifications.markRead',
        input: valid,
        idempotencyKey: options?.idempotencyKey,
        execute(draft, clock) {
          checkCancelled(options?.signal)
          const actor = currentUser(draft)
          const rows = valid.map((id) =>
            draft.moderation.notifications.find((n) => n.id === id),
          )
          if (rows.some((n) => !n || n.recipientId !== actor.id))
            throw new ApiError(
              'FORBIDDEN',
              'Only your activity can be marked read',
              403,
            )
          for (const row of rows)
            if (row && !row.readAt) row.readAt = clock.now().toISOString()
        },
      })
    },
  }
}
