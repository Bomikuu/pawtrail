import type {
  MapEntity,
  MapSources,
  PublicRecords,
  Proximity,
  SourceIssue,
} from './types'
import type { PlatformBridge } from '../platform'
import { validCoordinates } from '../community'
import { loadHomePlaces, housingFailure } from '../housing/client'
const cache = new Map<string, { at: number; value: PublicRecords }>()
export function invalidatePublicRecords() {
  cache.clear()
}
export async function publicRecords(
  bounds: number[] | null,
  signal: AbortSignal,
  near?: Proximity,
): Promise<PublicRecords> {
  const query = new URLSearchParams(
    bounds ? { bbox: bounds.map((n) => n.toFixed(4)).join(',') } : {},
  )
  if (near) {
    query.set('longitude', String(near.center[0]))
    query.set('latitude', String(near.center[1]))
    query.set('radius', String(near.radius))
  }
  const key = query.toString(),
    old = cache.get(key)
  if (old && Date.now() - old.at < 30000) return old.value
  const url =
    window.location.pathname === '/'
      ? 'http://127.0.0.1:8001/api/v1/map/entities/?sample=false&' + key
      : '/api/game/community-records?' + key
  const response = await fetch(url, { signal, cache: 'no-store' })
  if (!response.ok)
    throw new Error('Published community reports could not load.')
  const value = (await response.json()) as PublicRecords
  if (!Array.isArray(value.entities) || !value.summaries)
    throw new Error('The community report response was incomplete.')
  if (cache.size > 24) cache.delete(cache.keys().next().value!)
  cache.set(key, { at: Date.now(), value })
  return value
}
export async function loadSources(
  platform: PlatformBridge | undefined,
  signal: AbortSignal,
): Promise<MapSources> {
  const results = await Promise.allSettled([
    loadHomePlaces(signal),
    platform?.discovery?.(signal) ??
      (platform?.places?.(signal) ?? Promise.resolve([])).then((entities) => ({
        entities,
        warnings: [],
        truncated: false,
      })),
  ])
  const entities = new Map<string, MapEntity>()
  const warnings: string[] = []
  const issues: SourceIssue[] = []
  if (signal.aborted) throw signal.reason
  const [homes, publicData] = results
  if (publicData.status === 'fulfilled') {
    for (const e of publicData.value.entities) entities.set(e.id, { ...e })
    warnings.push(...publicData.value.warnings)
  } else
    warnings.push(
      'Some public animal, shelter or activity records could not load.',
    )
  if (homes.status === 'fulfilled')
    for (const e of homes.value) {
      const existing = entities.get(e.id)
      entities.set(e.id, {
        ...existing,
        ...e,
        membership: e.membership ?? existing?.membership,
      })
    }
  else {
    const failure = housingFailure(homes.reason)
    const kind =
      failure === 'auth' || failure === 'forbidden' ? failure : 'unavailable'
    issues.push({
      source: 'homes',
      kind,
      message:
        kind === 'auth'
          ? 'Sign in to discover member homes shared with your account. Public records are still available.'
          : kind === 'forbidden'
            ? 'Your account cannot access member homes. Public records are still available.'
            : 'Member homes could not load. Public records are still available.',
    })
  }
  return {
    entities: [...entities.values()].filter(
      (e) => !e.sample && !e.demo && validCoordinates(e.coordinates),
    ),
    warnings,
    issues,
    truncated: publicData.status === 'fulfilled' && publicData.value.truncated,
  }
}
