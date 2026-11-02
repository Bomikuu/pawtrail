import { expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup, itemFor, reason } from './helpers'
const store = storage()
it('does_not_reveal_removed_record_by_id', async () => {
  const { api } = await setup(store.dir)
  const item = await itemFor(api, 'post-1')
  await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  await api.auth.selectDemoActor('user-2')
  await expect(api.community.get('post-1')).rejects.toMatchObject({
    status: 404,
  })
})
it('applies_review_to_every_public_projection', async () => {
  const { api } = await setup(store.dir)
  const post = await itemFor(api, 'post-1')
  await api.moderation.review({
    id: post.id,
    expectedVersion: post.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  for (const filters of [
    {},
    { q: 'Milo' },
    { authorId: 'user-1' },
    { animalId: 'animal-1' },
  ])
    expect(
      (await api.community.list(filters)).items.map((p) => p.id),
    ).not.toContain('post-1')
  const animal = await itemFor(api, 'animal-1')
  await api.moderation.review({
    id: animal.id,
    expectedVersion: animal.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  expect((await api.animals.list({})).items.map((a) => a.id)).not.toContain(
    'animal-1',
  )
  await expect(api.animals.get('milo')).rejects.toMatchObject({ status: 404 })
})
it('removes withdrawn associations from linked story and shelter/profile projections', async () => {
  const { api } = await setup(store.dir)
  const post = await itemFor(api, 'post-1')
  await api.moderation.review({
    id: post.id,
    expectedVersion: post.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  expect((await api.animals.get('milo')).postIds).not.toContain('post-1')
  const animal = await itemFor(api, 'animal-1')
  await api.moderation.review({
    id: animal.id,
    expectedVersion: animal.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  const shelters = await api.shelters.list({ limit: 50 })
  for (const shelter of shelters.items)
    expect((await api.shelters.get(shelter.slug)).animalIds).not.toContain(
      'animal-1',
    )
  expect((await api.sightings.list({ animalId: 'animal-1' })).items).toEqual([])
})
it('does not expose a withdrawn profile through comment or post author projections', async () => {
  const { api } = await setup(store.dir)
  await api.moderation.report({
    target: { kind: 'user', id: 'user-1' },
    reason: 'privacy',
  })
  const item = await itemFor(api, 'user-1')
  await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  await expect(api.users.get('sample-helper-1')).rejects.toMatchObject({
    status: 404,
  })
  expect((await api.community.get('post-1')).authorId).toBeNull()
  expect(
    (await api.community.comments({ kind: 'post', id: 'post-1' }, {})).items[0]
      .authorId,
  ).toBeNull()
})

it.each(['hidden', 'removed'] as const)(
  'preserves named and anonymous contributions when their contributors are %s',
  async (state) => {
    const { api, repo } = await setup(store.dir)
    for (const index of [1, 2]) {
      const campaignId = `campaign-${index}`
      const userId = `user-${index}`
      const before = await api.fundraisers.supporters(campaignId, {})
      expect(before.items).toHaveLength(1)
      expect(before.items[0].userId).toBe(index === 1 ? null : userId)
      if (state === 'hidden')
        await repo.transact({
          name: 'test.hide-contributor',
          input: { userId },
          execute(d) {
            d.data.users.find(
              (user) => user.id === userId,
            )!.settings.discoverable = false
          },
        })
      else {
        await api.moderation.report({
          target: { kind: 'user', id: userId },
          reason: 'privacy',
        })
        const item = await itemFor(api, userId)
        await api.moderation.review({
          id: item.id,
          expectedVersion: item.version,
          action: 'remove',
          reason,
          evidenceRefs: [],
        })
      }
      await api.auth.logout()
      const after = await api.fundraisers.supporters(campaignId, {})
      expect(after.items).toEqual(
        before.items.map((row) => ({
          ...row,
          displayName: 'Anonymous helper',
          userId: null,
        })),
      )
      await api.auth.selectDemoActor('user-20')
    }
  },
)
