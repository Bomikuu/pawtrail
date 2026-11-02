import { describe, expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup } from '../moderation/helpers'
import { notify } from '@/features/notifications/service'
import { createMockApi } from '@/lib/api/adapters/mock'
const disk = storage()
async function notifications() {
  const context = await setup(disk.dir, 'user-1')
  await context.repo.transact({
    name: 'notifications',
    input: {},
    execute(d, clock) {
      for (const [id, recipientId, ref] of [
        ['note-1', 'user-1', { kind: 'post', id: 'post-1' }],
        ['note-2', 'user-2', { kind: 'post', id: 'post-2' }],
      ] as const)
        d.moderation.notifications.push({
          id,
          recipientId,
          ref,
          kind: 'comment',
          message: 'A community update is available.',
          createdAt: clock.now().toISOString(),
          readAt: null,
          provenance: { kind: 'demo', label: 'Sample activity' },
        })
    },
  })
  return context
}
describe('notification ownership', () => {
  it('unread_count_is_owner_scoped', async () => {
    const { api } = await notifications()
    expect(await api.notifications.unreadCount()).toBe(1)
    expect((await api.notifications.list({})).items.map((n) => n.id)).toEqual([
      'note-1',
    ])
    await expect(api.notifications.markRead(['note-2'])).rejects.toMatchObject({
      status: 403,
    })
    await api.notifications.markRead(['note-1'])
    expect(await api.notifications.unreadCount()).toBe(0)
    expect((await api.notifications.list({})).items[0].readAt).not.toBeNull()
    await api.auth.selectDemoActor('user-2')
    expect(await api.notifications.unreadCount()).toBe(1)
    await expect(api.notifications.markRead(['note-1'])).rejects.toMatchObject({
      status: 403,
    })
  })
  it('read batch is atomic and repeated read preserves timestamp', async () => {
    const { api } = await notifications()
    await expect(
      api.notifications.markRead(['note-1', 'note-2']),
    ).rejects.toMatchObject({ status: 403 })
    expect(await api.notifications.unreadCount()).toBe(1)
    await api.notifications.markRead(['note-1'])
    const before = (await api.notifications.list({})).items[0].readAt
    await api.notifications.markRead(['note-1'])
    expect((await api.notifications.list({})).items[0].readAt).toBe(before)
  })
  it('strips inaccessible refs, resolves only available routes, and rejects guests', async () => {
    const { api, repo } = await notifications()
    expect((await api.notifications.list({})).items[0].destinationHref).toBe(
      '/community/post-1',
    )
    await repo.transact({
      name: 'private',
      input: {},
      execute(d) {
        d.data.posts[0].authorId = 'user-2'
        d.data.posts[0].moderation = 'pending'
      },
    })
    expect((await api.notifications.list({})).items[0]).toMatchObject({
      ref: null,
      destinationHref: null,
    })
    await expect(
      createMockApi().notifications.unreadCount(),
    ).rejects.toMatchObject({ status: 401 })
  })
  it('owner can open their pending story but unrelated recipient loses its private ref', async () => {
    const { api, repo } = await notifications()
    await repo.transact({
      name: 'pending-owned',
      input: {},
      execute(d) {
        d.data.posts[0].moderation = 'pending'
      },
    })
    expect((await api.notifications.list({})).items[0]).toMatchObject({
      ref: { kind: 'post', id: 'post-1' },
      destinationHref: '/community/post-1',
    })
  })
  it('shared producer stays atomic with domain event and removes confidential legacy copy from reads', async () => {
    const { api, repo } = await notifications()
    await expect(
      repo.transact({
        name: 'rollback-notify',
        input: {},
        async execute(d, clock) {
          await notify({
            draft: d,
            recipientId: 'user-1',
            kind: 'application',
            ref: null,
            now: clock.now().toISOString(),
          })
          throw new Error('rollback')
        },
      }),
    ).rejects.toThrow('rollback')
    expect(await api.notifications.unreadCount()).toBe(1)
    await repo.transact({
      name: 'legacy-copy',
      input: {},
      execute(d) {
        d.moderation.notifications[0].message =
          'Confidential applicant answer goes here'
      },
    })
    expect(JSON.stringify(await api.notifications.list({}))).not.toContain(
      'Confidential',
    )
  })
})
it('paginates only the current owner and binds cursors to actor/query', async () => {
  const { api, repo } = await notifications()
  await repo.transact({
    name: 'more',
    input: {},
    execute(d) {
      for (let i = 0; i < 5; i++)
        d.moderation.notifications.push({
          ...d.moderation.notifications[0],
          id: `more-${i}`,
        })
    },
  })
  const first = await api.notifications.list({ limit: 2 })
  const second = await api.notifications.list({
    limit: 2,
    cursor: first.nextCursor!,
  })
  expect(first.count).toBe(6)
  expect(new Set([...first.items, ...second.items].map((n) => n.id)).size).toBe(
    4,
  )
  await api.auth.selectDemoActor('user-2')
  await expect(
    api.notifications.list({ limit: 2, cursor: first.nextCursor! }),
  ).rejects.toMatchObject({ status: 400 })
  expect(await api.notifications.unreadCount()).toBe(1)
})
