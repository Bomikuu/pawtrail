import { describe, expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup } from '../moderation/helpers'
import { createMockApi } from '@/lib/api/adapters/mock'
const disk = storage()
describe('following', () => {
  it('repeat_follow_is_idempotent', async () => {
    const { api, repo } = await setup(disk.dir, 'user-1')
    const target = { kind: 'user' as const, id: 'user-2' }
    await Promise.all([
      api.follows.set(target, true),
      api.follows.set(target, true),
    ])
    expect((await api.follows.list({})).items).toHaveLength(1)
    expect(await repo.read((d) => d.community.follows)).toHaveLength(1)
    expect(
      await repo.read((d) =>
        d.moderation.notifications.filter((n) => n.kind === 'follow'),
      ),
    ).toHaveLength(1)
    await api.auth.selectDemoActor('user-2')
    expect((await api.follows.list({})).items).toHaveLength(0)
    await api.auth.selectDemoActor('user-1')
    await api.follows.set(target, false)
    expect((await api.follows.list({})).items).toHaveLength(0)
  })
  it('persists follow creation time independently of target and preserves it on repeat', async () => {
    const { api, repo } = await setup(disk.dir, 'user-1')
    await repo.transact({
      name: 'older-target',
      input: {},
      execute(d) {
        d.data.users[1].createdAt = '2020-01-01T00:00:00Z'
      },
    })
    await api.follows.set({ kind: 'user', id: 'user-2' }, true)
    const first = (await api.follows.list({})).items[0]
    expect(first.createdAt).toBe('2026-11-01T16:00:00.000Z')
    expect(await repo.read((d) => d.community.follows[0].createdAt)).toBe(
      first.createdAt,
    )
    await api.follows.set({ kind: 'user', id: 'user-2' }, true)
    expect((await api.follows.list({})).items[0].createdAt).toBe(
      first.createdAt,
    )
  })
  it('following_feed_uses_followed_targets', async () => {
    const { api } = await setup(disk.dir, 'user-1')
    await api.follows.set({ kind: 'user', id: 'user-2' }, true)
    await api.follows.set({ kind: 'animal', id: 'animal-3' }, true)
    const following = await api.community.list({ tab: 'following', limit: 50 })
    expect(following.items.length).toBeGreaterThan(0)
    expect(
      following.items.every(
        (p) =>
          p.authorId === 'user-2' ||
          p.refs.some((r) => r.kind === 'animal' && r.id === 'animal-3'),
      ),
    ).toBe(true)
  })
  it('validates target kind, self, current visibility, guest and paging ownership', async () => {
    const { api, repo } = await setup(disk.dir, 'user-1')
    await expect(
      api.follows.set({ kind: 'post', id: 'post-1' }, true),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      api.follows.set({ kind: 'user', id: 'user-1' }, true),
    ).rejects.toMatchObject({ status: 400 })
    for (const id of ['animal-1', 'animal-2'])
      await api.follows.set({ kind: 'animal', id }, true)
    const first = await api.follows.list({ limit: 1 })
    expect(first.nextCursor).not.toBeNull()
    expect(
      (await api.follows.list({ limit: 1, cursor: first.nextCursor! })).items[0]
        .id,
    ).not.toBe(first.items[0].id)
    await repo.transact({
      name: 'hide',
      input: {},
      execute(d) {
        d.data.animals[0].moderation = 'removed'
      },
    })
    expect((await api.follows.list({})).count).toBe(1)
    await expect(
      api.follows.set({ kind: 'animal', id: 'animal-1' }, true),
    ).rejects.toMatchObject({ status: 404 })
    await api.follows.set({ kind: 'animal', id: 'animal-1' }, false)
    await expect(createMockApi().follows.list({})).rejects.toMatchObject({
      status: 401,
    })
  })
})
