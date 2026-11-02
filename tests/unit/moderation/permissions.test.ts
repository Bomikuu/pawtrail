import { expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup, itemFor, reason } from './helpers'
const store = storage()
it('denies ordinary members queue and review', async () => {
  const { api } = await setup(store.dir, 'user-1')
  await expect(api.moderation.queue({})).rejects.toMatchObject({ status: 403 })
  await expect(
    api.moderation.review({
      id: 'publication:post:post-1',
      expectedVersion: 1,
      action: 'remove',
      reason,
      evidenceRefs: [],
    }),
  ).rejects.toMatchObject({ status: 403 })
})
it('keeps reports confidential without removing or verifying their target', async () => {
  const { api, repo } = await setup(store.dir, 'user-1')
  const target = { kind: 'post' as const, id: 'post-1' }
  const receipt = await api.moderation.report({
    target,
    reason: 'misinformation',
  })
  expect(receipt).not.toHaveProperty('reporterId')
  expect((await api.community.get(target.id)).moderation).toBe('published')
  expect(await repo.read((d) => d.moderation.reports[0].reporterId)).toBe(
    'user-1',
  )
  await api.auth.selectDemoActor('user-20')
  const item = await itemFor(api, target.id)
  expect(item.reportCount).toBe(1)
  expect(JSON.stringify(item)).not.toContain('reporterId')
})
it('separates verification and publication and denies creator verification', async () => {
  const { api, repo } = await setup(store.dir)
  const publication = await itemFor(api, 'animal-1')
  await expect(
    api.moderation.review({
      id: publication.id,
      expectedVersion: publication.version,
      action: 'verify',
      reason,
      evidenceRefs: ['unknown'],
    }),
  ).rejects.toMatchObject({ status: 400 })
  await repo.transact({
    name: 'test.creator',
    input: {},
    execute(d) {
      d.data.animals[0].ownerId = 'user-20'
    },
  })
  const verification = await itemFor(api, 'animal-1', 'verification')
  await expect(
    api.moderation.review({
      id: verification.id,
      expectedVersion: verification.version,
      action: 'verify',
      reason,
      evidenceRefs: ['unknown'],
    }),
  ).rejects.toMatchObject({ status: 403 })
})
it('rejects shelter staff verifying their own organization even when they are moderators', async () => {
  const { api, repo } = await setup(store.dir, 'user-20')
  await repo.transact({
    name: 'test.organization-conflict',
    input: {},
    execute(d) {
      d.data.users[19].shelterIds.push('shelter-1')
      d.data.users[19].roles.push('shelter_staff')
    },
  })
  const item = await itemFor(api, 'shelter-1', 'verification')
  expect(item.canVerify).toBe(false)
  await expect(
    api.moderation.review({
      id: item.id,
      expectedVersion: item.version,
      action: 'verify',
      reason,
      evidenceRefs: ['evidence'],
    }),
  ).rejects.toMatchObject({ status: 403 })
})
