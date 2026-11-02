import { expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup, itemFor, reason } from '../moderation/helpers'
import { createMockApi } from '@/lib/api/adapters/mock'
const store = storage()
const ref = { kind: 'post' as const, id: 'post-1' }
it('rejects_anonymous_comment', async () => {
  await expect(
    createMockApi().community.comment(ref, { text: 'Update' }),
  ).rejects.toMatchObject({ status: 401 })
})
it('persists pending comments, validates text, paginates and projects hidden authors', async () => {
  const { api, repo } = await setup(store.dir, 'user-2')
  for (const text of ['', ' ', 'a'.repeat(1001)])
    await expect(api.community.comment(ref, { text })).rejects.toMatchObject({
      status: 400,
    })
  const created = await api.community.comment(
    ref,
    { text: 'A useful update' },
    { idempotencyKey: 'comment' },
  )
  expect(created.moderation).toBe('pending')
  expect(
    (
      await api.community.comment(
        ref,
        { text: 'A useful update' },
        { idempotencyKey: 'comment' },
      )
    ).id,
  ).toBe(created.id)
  await api.auth.selectDemoActor('user-3')
  expect(
    (await api.community.comments(ref, {})).items.map((c) => c.id),
  ).not.toContain(created.id)
  await api.auth.selectDemoActor('user-20')
  const item = (
    await api.moderation.queue({ limit: 50, state: 'pending' })
  ).items.find((i) => i.commentId === created.id)!
  await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'publish',
    reason,
    evidenceRefs: [],
  })
  await repo.transact({
    name: 'test.hide',
    input: {},
    execute(d) {
      d.data.users[1].settings.discoverable = false
    },
  })
  await api.auth.logout()
  const first = await api.community.comments(ref, { limit: 1 })
  const second = await api.community.comments(ref, {
    limit: 1,
    cursor: first.nextCursor!,
  })
  expect(new Set([...first.items, ...second.items].map((c) => c.id)).size).toBe(
    2,
  )
  const comment = [...first.items, ...second.items].find(
    (c) => c.id === created.id,
  )!
  expect(comment.authorId).toBeNull()
  expect(comment.author.displayName).toBe('Community member')
  expect(
    await repo.read((d) =>
      d.moderation.notifications.some(
        (n) => n.kind === 'comment' && n.recipientId === 'user-1',
      ),
    ),
  ).toBe(true)
})
it('prevents discussion access after parent removal', async () => {
  const { api } = await setup(store.dir)
  const item = await itemFor(api, ref.id)
  await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  await expect(api.community.comments(ref, {})).rejects.toMatchObject({
    status: 404,
  })
  await expect(
    api.community.comment(ref, { text: 'Update' }),
  ).rejects.toMatchObject({ status: 404 })
})
