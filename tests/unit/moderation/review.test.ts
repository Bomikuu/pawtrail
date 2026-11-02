import { expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup, itemFor, reason } from './helpers'
const store = storage()
it('prevents_stale_review_overwrite and appends immutable audit + author notification', async () => {
  const { api, repo } = await setup(store.dir)
  const item = await itemFor(api, 'post-1')
  const input = {
    id: item.id,
    expectedVersion: item.version,
    action: 'remove' as const,
    reason,
    evidenceRefs: [],
  }
  await api.moderation.review(input)
  const original = await repo.read((d) => d.moderation.audit)
  await expect(api.moderation.review(input)).rejects.toMatchObject({
    code: 'CONFLICT',
  })
  expect(await repo.read((d) => d.moderation.audit)).toEqual(original)
  expect(original).toHaveLength(1)
  expect(await repo.read((d) => d.moderation.notifications)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ recipientId: 'user-1', kind: 'moderation' }),
    ]),
  )
})

it('publishes eligible photos atomically and grants reviewers only attached-resource media access', async () => {
  const { api, repo } = await setup(store.dir, 'user-1')
  const { png } = await import('../media/helpers')
  const { readMedia } = await import('@/lib/server/media/delivery')
  const upload = () =>
    api.media.upload({
      file: new Blob([png], { type: 'image/png' }),
      filename: 'cat.png',
      alt: 'Sample cat',
      purpose: 'public_image',
      sensitive: true,
    })
  const attached = await upload()
  const orphan = await upload()
  const post = await api.community.create({
    text: 'Photo update',
    type: 'photo',
    refs: [],
    mediaIds: [attached.id],
  })
  await api.auth.selectDemoActor('user-20')
  expect((await readMedia(repo, attached.id)).status).toBe(200)
  await expect(readMedia(repo, orphan.id)).rejects.toMatchObject({
    status: 404,
  })
  await expect(readMedia(repo, attached.id, true)).rejects.toMatchObject({
    status: 404,
  })
  const pending = await itemFor(api, post.id)
  expect(pending.media[0]).toMatchObject({
    id: attached.id,
    sensitive: true,
    visibility: 'private',
  })
  await api.moderation.review({
    id: pending.id,
    expectedVersion: pending.version,
    action: 'publish',
    reason,
    evidenceRefs: [],
  })
  await api.auth.logout()
  expect((await api.community.get(post.id)).media[0].url).toMatch(/\/public$/)
  expect((await readMedia(repo, attached.id, true)).status).toBe(200)
  await api.auth.selectDemoActor('user-20')
  await api.moderation.review({
    id: pending.id,
    expectedVersion: pending.version + 1,
    action: 'remove',
    reason,
    evidenceRefs: [],
  })
  await expect(readMedia(repo, attached.id, true)).rejects.toMatchObject({
    status: 404,
  })
  await expect(readMedia(repo, attached.id)).rejects.toMatchObject({
    status: 404,
  })
})
it('verifies only attached subject evidence, preserves private IDs, and revokes independently', async () => {
  const { api, repo } = await setup(store.dir, 'user-1')
  const { png } = await import('../media/helpers')
  const evidence = await api.media.upload({
    file: new Blob([png], { type: 'image/png' }),
    filename: 'evidence.png',
    alt: 'Private sample evidence',
    purpose: 'private_evidence',
    sensitive: false,
  })
  await repo.transact({
    name: 'test.register-evidence',
    input: {},
    execute(d) {
      d.media[0].attached = true
      d.moderation.subjects.push({
        ref: { kind: 'animal', id: 'animal-1' },
        creatorIds: ['user-1'],
        evidenceIds: [evidence.id],
        version: 1,
        state: 'published',
      })
    },
  })
  await api.auth.selectDemoActor('user-20')
  const item = await itemFor(api, 'animal-1', 'verification')
  expect(item.evidenceIds).toEqual([evidence.id])
  await expect(
    api.moderation.review({
      id: item.id,
      expectedVersion: item.version,
      action: 'verify',
      reason,
      evidenceRefs: ['unrelated'],
    }),
  ).rejects.toMatchObject({ status: 400 })
  const reviewed = await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'verify',
    reason,
    evidenceRefs: [evidence.id],
  })
  expect((await api.animals.get('milo')).verification).toMatchObject({
    status: 'illustrative',
    evidenceRefs: [],
  })
  expect(await repo.read((d) => d.media[0].approved)).toBe(false)
  await api.moderation.review({
    id: reviewed.id,
    expectedVersion: reviewed.version,
    action: 'revoke_verification',
    reason,
    evidenceRefs: [evidence.id],
  })
  expect((await api.animals.get('milo')).verification.status).toBe('unverified')
  expect(await repo.read((d) => d.moderation.audit)).toHaveLength(2)
})
it('rolls back all photos and audit when any publication attachment is ineligible', async () => {
  const { api, repo } = await setup(store.dir, 'user-1')
  const { png } = await import('../media/helpers')
  const photo = await api.media.upload({
    file: new Blob([png], { type: 'image/png' }),
    filename: 'cat.png',
    alt: 'Sample cat',
    purpose: 'public_image',
    sensitive: false,
  })
  const post = await api.community.create({
    text: 'Photo update',
    type: 'photo',
    refs: [],
    mediaIds: [photo.id],
  })
  await repo.transact({
    name: 'test.invalid-reference',
    input: {},
    execute(d) {
      d.community.attachments[0].mediaIds.push('missing')
    },
  })
  await api.auth.selectDemoActor('user-20')
  const item = await itemFor(api, post.id)
  await expect(
    api.moderation.review({
      id: item.id,
      expectedVersion: item.version,
      action: 'publish',
      reason,
      evidenceRefs: [],
    }),
  ).rejects.toMatchObject({ status: 404 })
  expect(
    await repo.read((d) => ({
      approved: d.media[0].approved,
      audit: d.moderation.audit,
      state: d.data.posts.find((p) => p.id === post.id)!.moderation,
    })),
  ).toEqual({ approved: false, audit: [], state: 'pending' })
})
it('retains rejected photos privately for the author to correct and resubmit', async () => {
  const { api } = await setup(store.dir, 'user-1')
  const { png } = await import('../media/helpers')
  const media = await api.media.upload({
    file: new Blob([png], { type: 'image/png' }),
    filename: 'cat.png',
    alt: 'Cat photograph',
    purpose: 'public_image',
    sensitive: false,
  })
  const post = await api.community.create({
    text: 'Needs a clearer observation',
    type: 'photo',
    mediaIds: [media.id],
    refs: [],
  })
  await api.auth.selectDemoActor('user-20')
  const item = await itemFor(api, post.id)
  await api.moderation.review({
    id: item.id,
    expectedVersion: item.version,
    action: 'reject',
    reason,
    evidenceRefs: [],
  })
  await api.auth.selectDemoActor('user-2')
  await expect(api.community.get(post.id)).rejects.toMatchObject({
    status: 404,
  })
  await api.auth.selectDemoActor('user-1')
  const rejected = await api.community.get(post.id)
  expect(rejected).toMatchObject({
    moderation: 'rejected',
    ownerMedia: [{ id: media.id, visibility: 'private' }],
    media: [],
  })
  const corrected = await api.community.update(post.id, {
    text: 'A corrected observation',
    type: 'photo',
    mediaIds: rejected.ownerMedia!.map((m) => m.id),
    refs: [],
    expectedVersion: rejected.version,
  })
  expect(corrected).toMatchObject({
    moderation: 'pending',
    ownerMedia: [{ id: media.id }],
  })
})

it.each([
  ['delete', false],
  ['detach', false],
  ['retain', false],
  ['delete', true],
  ['detach', true],
  ['retain', true],
] as const)(
  'reconciles public photos after author %s with shared reference %s',
  async (action, shared) => {
    const { api, repo } = await setup(store.dir, 'user-1')
    const { png } = await import('../media/helpers')
    const { readMedia } = await import('@/lib/server/media/delivery')
    const media = await api.media.upload({
      file: new Blob([png], { type: 'image/png' }),
      filename: 'cat.png',
      alt: 'Shared sample cat',
      purpose: 'public_image',
      sensitive: false,
    })
    const publish = async () => {
      await api.auth.selectDemoActor('user-1')
      const post = await api.community.create({
        text: 'A photograph for review',
        type: 'photo',
        mediaIds: [media.id],
        refs: [],
      })
      await api.auth.selectDemoActor('user-20')
      const item = await itemFor(api, post.id)
      await api.moderation.review({
        id: item.id,
        expectedVersion: item.version,
        action: 'publish',
        reason,
        evidenceRefs: [],
      })
      return api.community.get(post.id)
    }
    const post = await publish()
    const second = shared ? await publish() : undefined
    await api.auth.selectDemoActor('user-1')
    if (action === 'delete') await api.community.remove(post.id)
    else {
      const updated = await api.community.update(post.id, {
        text: 'Corrected observation awaiting review',
        type: 'story',
        mediaIds: action === 'retain' ? [media.id] : [],
        refs: [],
        expectedVersion: post.version,
      })
      expect(updated.moderation).toBe('pending')
      if (action === 'retain' && !shared)
        expect(updated).toMatchObject({
          media: [],
          ownerMedia: [{ id: media.id, visibility: 'private' }],
        })
    }
    await api.auth.logout()
    if (second) {
      expect((await readMedia(repo, media.id, true)).status).toBe(200)
      expect((await api.community.get(second.id)).media[0].id).toBe(media.id)
      await api.auth.selectDemoActor('user-1')
      await api.community.remove(second.id)
      await api.auth.logout()
    }
    await expect(readMedia(repo, media.id, true)).rejects.toMatchObject({
      status: 404,
    })
    await expect(readMedia(repo, media.id)).rejects.toMatchObject({
      status: 404,
    })
    expect(await repo.read((d) => d.media[0])).toMatchObject({
      approved: false,
      asset: {
        visibility: 'private',
        url: `/api/v1/media/${media.id}/content`,
      },
    })
    if (action === 'retain') {
      await api.auth.selectDemoActor('user-1')
      expect(await api.community.get(post.id)).toMatchObject({
        media: [],
        ownerMedia: [{ id: media.id, visibility: 'private' }],
      })
      await api.auth.selectDemoActor('user-20')
      const item = await itemFor(api, post.id)
      await api.moderation.review({
        id: item.id,
        expectedVersion: item.version,
        action: 'publish',
        reason,
        evidenceRefs: [],
      })
      await api.auth.logout()
      expect((await readMedia(repo, media.id, true)).status).toBe(200)
      expect((await api.community.get(post.id)).media[0].id).toBe(media.id)
    }
  },
)
