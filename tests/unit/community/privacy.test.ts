import { expect, it } from 'vitest'
import { storage, sessionId, request } from '../demo/helpers'
import { png } from '../media/helpers'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { dispatchApi } from '@/lib/server/api-registry'
import { resolveDemoContext } from '@/lib/server/demo/session'
import { postSchema } from '@/features/community/schemas'
const store = storage()
it('omits private previews from published and nonowner projections even when stored fields are contaminated', async () => {
  const repo = await openDemoRepository(sessionId(), store.dir)
  const api = createMockApi(undefined, repo)
  await api.auth.selectDemoActor('user-1')
  const asset = await api.media.upload({
    file: new Blob([png], { type: 'image/png' }),
    filename: 'cat.png',
    alt: 'Resting cat',
    purpose: 'public_image',
    sensitive: true,
  })
  const post = await api.community.create({
    text: 'Quiet afternoon',
    type: 'photo',
    refs: [],
    mediaIds: [asset.id],
  })
  expect(post.ownerMedia).toMatchObject([{ sensitive: true }])
  expect(postSchema.parse(post)).not.toHaveProperty('ownerMedia')
  await api.auth.selectDemoActor('user-20')
  expect(await api.community.get(post.id)).not.toHaveProperty('ownerMedia')
  await repo.transact({
    name: 'test.public-fixture',
    input: {},
    execute(draft) {
      const row = draft.data.posts.find((row) => row.id === post.id)!
      Object.assign(row, {
        moderation: 'published',
        ownerMedia: [asset],
        privateNotes: 'hidden',
      })
    },
  })
  await api.auth.selectDemoActor('user-1')
  expect(await api.community.get(post.id)).not.toHaveProperty('ownerMedia')
  await api.auth.logout()
  const dto = await api.community.get(post.id)
  expect(JSON.stringify(dto)).not.toContain('/content')
  expect(dto).not.toHaveProperty('privateNotes')
  expect(
    (await api.community.list({})).items.every((row) => !row.ownerMedia),
  ).toBe(true)
})
it('redacts hidden contributor identity in author and reference associations', async () => {
  const repo = await openDemoRepository(sessionId(), store.dir)
  await repo.transact({
    name: 'test.hide',
    input: {},
    execute(draft) {
      draft.data.users[0].settings.discoverable = false
      draft.data.posts[0].refs.push({ kind: 'user', id: 'user-1' })
    },
  })
  const api = createMockApi(undefined, repo)
  const post = await api.community.get('post-1')
  expect(post.authorId).toBeNull()
  expect(post.author).toEqual({
    displayName: 'Community member',
    username: null,
  })
  expect(post.refs.some((ref) => ref.kind === 'user')).toBe(false)
  expect((await api.community.list({ authorId: 'user-1' })).items).toEqual([])
})
it('uses the browser/BFF contract for private pending reload and saved boolean filtering', async () => {
  const id = sessionId()
  const repo = await openDemoRepository(id, store.dir)
  const api = createMockApi(undefined, repo)
  await api.auth.selectDemoActor('user-1')
  await api.community.setSaved('post-1', true)
  const media = await api.media.upload({
    file: new Blob([png], { type: 'image/png' }),
    filename: 'cat.png',
    alt: 'Cat',
    purpose: 'public_image',
    sensitive: false,
  })
  const pending = await api.community.create({
    text: 'Private photo',
    type: 'photo',
    refs: [],
    mediaIds: [media.id],
  })
  const detail = request(`/community/posts/${pending.id}`, id)
  const pendingResponse = await dispatchApi(
    detail,
    await resolveDemoContext(detail),
  )
  expect(await pendingResponse.json()).toMatchObject({
    id: pending.id,
    ownerMedia: [{ id: media.id }],
  })
  const req = request('/community/posts?saved=true', id)
  const response = await dispatchApi(req, await resolveDemoContext(req))
  expect(response.status).toBe(200)
  expect(
    (await response.json()).items.map((row: { id: string }) => row.id),
  ).toEqual(['post-1'])
})
it('resolves current actor inside commands and rejects invalid sessions/media ownership', async () => {
  const repo = await openDemoRepository(sessionId(), store.dir)
  const first = createMockApi(undefined, repo)
  await first.auth.selectDemoActor('user-1')
  const second = createMockApi(undefined, repo)
  await second.auth.selectDemoActor('user-2')
  const created = await first.community.create({
    text: 'Second actor story',
    type: 'story',
    refs: [],
    mediaIds: [],
  })
  expect(created.authorId).toBe('user-2')
  await second.auth.logout()
  await expect(
    first.community.create({
      text: 'Signed out',
      type: 'story',
      refs: [],
      mediaIds: [],
    }),
  ).rejects.toMatchObject({ status: 401 })
})
it('does not reveal withdrawn linked records through feed filters', async () => {
  const repo = await openDemoRepository(sessionId(), store.dir)
  await repo.transact({
    name: 'test.withdraw-animal',
    input: {},
    execute(draft) {
      draft.data.animals[0].moderation = 'pending'
    },
  })
  const api = createMockApi(undefined, repo)
  expect((await api.community.get('post-1')).refs).not.toContainEqual({
    kind: 'animal',
    id: 'animal-1',
  })
  expect((await api.community.list({ animalId: 'animal-1' })).items).toEqual([])
})
