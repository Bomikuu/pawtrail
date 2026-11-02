import { describe, expect, it } from 'vitest'
import { storage, sessionId } from '../demo/helpers'
import { png } from '../media/helpers'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
const store = storage()
const input = {
  text: 'A quiet afternoon with Milo',
  type: 'photo' as const,
  mediaIds: [],
  refs: [{ kind: 'animal' as const, id: 'animal-1' }],
}
async function setup() {
  const id = sessionId()
  const repo = await openDemoRepository(id, store.dir)
  const api = createMockApi(undefined, repo)
  await api.auth.selectDemoActor('user-1')
  return { id, repo, api }
}
describe('community persistence and privacy', () => {
  it('creates_pending_photo_post_and_survives_refresh', async () => {
    const { id, repo, api } = await setup()
    const media = await api.media.upload({
      file: new Blob([png], { type: 'image/png' }),
      filename: 'cat.png',
      alt: 'Cat resting',
      purpose: 'public_image',
      sensitive: false,
    })
    const created = await api.community.create({
      ...input,
      mediaIds: [media.id],
    })
    expect(created.moderation).toBe('pending')
    const reopened = createMockApi(
      undefined,
      await openDemoRepository(id, store.dir),
    )
    expect(await reopened.community.get(created.id)).toMatchObject({
      id: created.id,
      ownerMedia: [{ id: media.id, visibility: 'private' }],
    })
    expect(created.media).toEqual([])
    expect(await repo.read((d) => d.media[0].attached)).toBe(true)
    await reopened.auth.selectDemoActor('user-2')
    expect(
      (await reopened.community.list({})).items.map((p) => p.id),
    ).not.toContain(created.id)
    await expect(reopened.community.get(created.id)).rejects.toMatchObject({
      status: 404,
    })
  })
  it('retries_create_without_duplicate', async () => {
    const { api } = await setup()
    const created = await api.community.create(input, {
      idempotencyKey: 'same-post',
    })
    const retried = await api.community.create(input, {
      idempotencyKey: 'same-post',
    })
    expect(retried.id).toBe(created.id)
    expect(
      (await api.community.list({})).items.filter((p) => p.id === created.id),
    ).toHaveLength(1)
  })
  it('validates references, text and image purpose before attaching', async () => {
    const { api } = await setup()
    await expect(
      api.community.create({ ...input, text: 'a'.repeat(2001) }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      api.community.create({
        ...input,
        refs: [{ kind: 'animal', id: 'missing' }],
      }),
    ).rejects.toMatchObject({ status: 404 })
    const media = await api.media.upload({
      file: new Blob([png], { type: 'image/png' }),
      filename: 'private.png',
      alt: 'Evidence',
      purpose: 'private_evidence',
      sensitive: false,
    })
    await expect(
      api.community.create({ ...input, mediaIds: [media.id] }),
    ).rejects.toMatchObject({ status: 400 })
  })
  it('enforces ownership/version and single reactions/saves', async () => {
    const { api } = await setup()
    expect(
      (await api.community.setReaction('post-1', true)).reactionCount,
    ).toBe(1)
    expect(
      (await api.community.setReaction('post-1', true)).reactionCount,
    ).toBe(1)
    expect(
      (await api.community.setReaction('post-1', false)).reactionCount,
    ).toBe(0)
    await api.community.setSaved('post-1', true)
    expect(
      (await api.community.list({ saved: true })).items.map((p) => p.id),
    ).toEqual(['post-1'])
    await api.auth.selectDemoActor('user-2')
    expect((await api.community.list({ saved: true })).items).toEqual([])
    await expect(api.community.remove('post-1')).rejects.toMatchObject({
      status: 403,
    })
    await api.auth.selectDemoActor('user-1')
    await expect(
      api.community.update('post-1', { ...input, expectedVersion: 9 }),
    ).rejects.toMatchObject({ status: 409 })
    expect(
      (await api.community.update('post-1', { ...input, expectedVersion: 1 }))
        .moderation,
    ).toBe('pending')
    await api.community.remove('post-1')
    await expect(api.community.get('post-1')).rejects.toMatchObject({
      status: 404,
    })
  })
})
