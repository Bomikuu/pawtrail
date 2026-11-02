import 'server-only'
import type { ModerationStore } from '@/features/moderation/types'
import type { ResourceRef } from '@/types/common'
import type { StoredMedia } from '@/lib/server/media/storage'
import type { FixtureSeed } from '@/data/fixtures'
import type { WorkflowStore } from '@/lib/server/workflow-store'
import type { Clock } from './clock'
import { ApiError } from '@/lib/api/errors'

export interface DemoDraft {
  workflow?: WorkflowStore
  moderation: ModerationStore
  community: {
    follows: { actorId: string; ref: ResourceRef; createdAt: string }[]
    reactions: { actorId: string; postId: string }[]
    saved: { actorId: string; postId: string }[]
    attachments: { postId: string; mediaIds: string[] }[]
  }
  media: StoredMedia[]
  savedAnimals: { actorId: string; animalId: string }[]
  data: FixtureSeed
  auth: { actorId: string | null; cacheScope: string }
}
export type DemoQuery<T> = (snapshot: DemoDraft) => T | Promise<T>
export interface DemoCommand<T> {
  /** Stable operation name. Repository receipts automatically include the current actor. */
  name: string
  input: unknown
  idempotencyKey?: string
  /** Validate permissions and domain invariants here before changing this private draft. */
  execute(draft: DemoDraft, clock: Clock): T | Promise<T>
}

// Shared across repository handles and development module reloads, within one process.
const processState = globalThis as typeof globalThis & {
  __pawtrailDemoQueues?: Map<string, Promise<void>>
}
const queues = (processState.__pawtrailDemoQueues ??= new Map())
export async function serialize<T>(
  path: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  queues.set(path, current)
  await previous
  try {
    return await action()
  } finally {
    release()
    if (queues.get(path) === current) queues.delete(path)
  }
}

/** Reject values JSON would silently coerce or discard. Sort keys for stable fingerprints. */
export function canonicalJson(value: unknown): string {
  const active = new Set<object>()
  function normalize(item: unknown): unknown {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return item
    if (typeof item === 'number' && Number.isFinite(item)) return item
    if (typeof item !== 'object' || item === null || active.has(item))
      throw new ApiError(
        'INVALID_DEMO_DATA',
        'Demo data must be JSON serializable',
        400,
      )
    const prototype = Object.getPrototypeOf(item)
    if (
      !Array.isArray(item) &&
      prototype !== Object.prototype &&
      prototype !== null
    )
      throw new ApiError(
        'INVALID_DEMO_DATA',
        'Demo data must contain plain records',
        400,
      )
    active.add(item)
    const result = Array.isArray(item)
      ? Array.from(item, normalize)
      : Object.fromEntries(
          Object.entries(item)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, child]) => [key, normalize(child)]),
        )
    active.delete(item)
    return result
  }
  return JSON.stringify(normalize(value))
}
