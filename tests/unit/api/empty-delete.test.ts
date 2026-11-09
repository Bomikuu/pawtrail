import { expect, it, vi } from 'vitest'
import { dispatchApi } from '@/lib/server/api-registry'
import type { PawTrailApi } from '@/lib/api/contracts'

vi.mock('server-only', () => ({}))

it('accepts an empty DELETE stream while still rejecting malformed nonempty JSON', async () => {
  const remove = vi.fn(async () => undefined)
  const context = {
    mode: 'real' as const,
    api: { community: { remove } } as unknown as PawTrailApi,
  }
  const request = (body: string) =>
    new Request('http://127.0.0.1:3000/api/v1/community/posts/test-post', {
      method: 'DELETE',
      headers: { origin: 'http://127.0.0.1:3000' },
      body,
    })
  expect((await dispatchApi(request(''), context)).status).toBe(204)
  expect(remove).toHaveBeenCalledTimes(1)
  expect((await dispatchApi(request('{'), context)).status).toBe(400)
  expect(remove).toHaveBeenCalledTimes(1)
})

it('accepts bodyless mission actions using an empty POST stream', async () => {
  const accept = vi.fn(async () => ({
    id: 'participation',
    createdAt: '2026-11-08T00:00:00Z',
    provenance: { kind: 'real', label: 'Generated unit record' },
    missionId: 'mission',
    volunteerId: 'member',
    state: 'accepted',
    evidence: null,
    reviewerId: null,
    reviewReason: null,
    version: 1,
  }))
  const response = await dispatchApi(
    new Request('http://127.0.0.1:3000/api/v1/missions/mission/accept', {
      method: 'POST',
      headers: { origin: 'http://127.0.0.1:3000' },
      body: '',
    }),
    { mode: 'real', api: { missions: { accept } } as unknown as PawTrailApi },
  )
  expect(response.status).toBe(200)
  expect(accept).toHaveBeenCalledTimes(1)
  expect((await response.json()).state).toBe('accepted')
})
