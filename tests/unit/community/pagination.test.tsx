import { expect, it } from 'vitest'
import { storage, sessionId } from '../demo/helpers'
import { createMockApi } from '@/lib/api/adapters/mock'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { deduplicatePosts } from '@/features/community/queries'
const store = storage()
it('deduplicates_cursor_items', async () => {
  const api = createMockApi()
  const first = await api.community.list({ limit: 3 })
  const second = await api.community.list({
    limit: 3,
    cursor: first.nextCursor!,
  })
  const ids = deduplicatePosts([first, second, first]).map((post) => post.id)
  expect(ids).toHaveLength(6)
  expect(new Set(ids).size).toBe(ids.length)
})
it('supports following and explicit nearby without inferring profile location', async () => {
  const repo = await openDemoRepository(sessionId(), store.dir)
  const api = createMockApi(undefined, repo)
  await api.auth.selectDemoActor('user-1')
  expect((await api.community.list({ tab: 'following' })).items).toEqual([])
  await repo.transact({
    name: 'test.follow',
    input: {},
    execute(d) {
      d.community.follows.push({
        createdAt: '2026-11-02T00:00:00+08:00',
        actorId: 'user-1',
        ref: { kind: 'animal', id: 'animal-1' },
      })
    },
  })
  expect(
    (await api.community.list({ tab: 'following' })).items.map((p) => p.id),
  ).toEqual(['post-1'])
  await expect(api.community.list({ tab: 'nearby' })).rejects.toMatchObject({
    status: 400,
  })
  const [area] = await api.discovery.searchAreas('')
  expect(
    (await api.community.list({ tab: 'nearby', areaId: area.id })).items.length,
  ).toBeGreaterThan(0)
})
