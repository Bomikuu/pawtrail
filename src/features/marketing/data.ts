import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import { getApiConfig } from '@/lib/api/config'
import { ApiError } from '@/lib/api/errors'
import type { AnimalSummary } from '@/features/animals/types'
import type { CampaignSummary } from '@/features/fundraising/types'
import type { Post } from '@/features/community/types'

export interface CommunitySampleStats {
  kind: 'sample'
  animalsDiscovered: number
  animalsAdopted: number
  communityHelpers: number
  successfulFundraisers: number
}
export type Preview<T> = { state: 'ready' | 'empty' | 'error'; items: T[] }
export interface LandingData {
  sample: boolean
  stats: CommunitySampleStats | null
  animals: Preview<AnimalSummary>
  adoption: Preview<AnimalSummary>
  campaigns: Preview<CampaignSummary>
  stories: Preview<Post>
}
/** Complete baseline fixtures, never a paginated list or a visitor's mutable demo session.
 * Discovered: published animal records. Adopted: published animals with status adopted.
 * Helpers: unique helper IDs attached to published animals and present in fixture users.
 * Successful fundraisers: completed campaigns whose simulated raised amount meets goal.
 * These are illustrative counts, not independently verified outcomes or transferred funds.
 * Real mode must implement a backend aggregate with agreed definitions before displaying totals.
 */
export async function getCommunitySampleStats(): Promise<CommunitySampleStats> {
  if (getApiConfig().mode !== 'mock')
    throw new ApiError(
      'NOT_IMPLEMENTED',
      'Community totals require a backend summary endpoint.',
      501,
    )
  const { seed } = await import('@/data/fixtures')
  const animals = seed.animals.filter(
    (animal) => animal.moderation === 'published',
  )
  const userIds = new Set(seed.users.map((user) => user.id))
  return {
    kind: 'sample',
    animalsDiscovered: animals.length,
    animalsAdopted: animals.filter((animal) => animal.status === 'adopted')
      .length,
    communityHelpers: new Set(
      animals
        .flatMap((animal) => animal.helperIds)
        .filter((id) => userIds.has(id)),
    ).size,
    successfulFundraisers: seed.fundraisers.filter(
      (campaign) =>
        campaign.state === 'completed' &&
        campaign.raisedMinor >= campaign.goalMinor,
    ).length,
  }
}
async function preview<T extends { photo?: unknown; media?: unknown[] }>(
  read: () => Promise<{ items: T[] }>,
  limit = 2,
): Promise<Preview<T>> {
  try {
    const { items } = await read()
    const illustrated = (item: T) => Boolean(item.photo || item.media?.length)
    const selected = [...items]
      .sort((a, b) => Number(illustrated(b)) - Number(illustrated(a)))
      .slice(0, limit)
    return { state: items.length ? 'ready' : 'empty', items: selected }
  } catch {
    return { state: 'error', items: [] }
  }
}
export async function loadLandingData(api: PawTrailApi): Promise<LandingData> {
  const sample = getApiConfig().mode === 'mock'
  const [animals, adoption, campaigns, stories, stats] = await Promise.all([
    preview(() => api.animals.list({ limit: 20 })),
    preview(() => api.animals.list({ adoptable: true, limit: 20 })),
    preview(() => api.fundraisers.list({ state: 'active', limit: 20 })),
    preview(() => api.community.list({ limit: 20 }), 3),
    getCommunitySampleStats().catch(() => null),
  ])
  return { sample, animals, adoption, campaigns, stories, stats }
}
