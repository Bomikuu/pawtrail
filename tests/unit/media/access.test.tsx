// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
vi.mock('server-only', () => ({}))
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import {
  readMedia,
  promoteMedia,
  publicMedia,
} from '@/lib/server/media/delivery'
import { toPublicAnimal } from '@/lib/server/projections'
import { seed } from '@/data/fixtures'
import { sessionId, storage } from '../demo/helpers'
import { png } from './helpers'
const env = storage()
it('persists isolated private files, authorizes owner/org reads, and promotes only reviewed photos', async () => {
  const id = sessionId()
  const repository = await openDemoRepository(id, env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-6')
  const asset = await api.media.upload({
    file: new NodeBlob([png], { type: 'image/png' }) as Blob,
    filename: '../../pet.png',
    alt: 'A sample cat',
    purpose: 'public_image',
    sensitive: false,
  })
  expect(asset).toMatchObject({
    visibility: 'private',
    mimeType: 'image/png',
    alt: 'A sample cat',
  })
  expect(asset).not.toHaveProperty('contentPath')
  expect(
    (await readMedia(repository, asset.id)).headers.get(
      'x-content-type-options',
    ),
  ).toBe('nosniff')
  await api.auth.selectDemoActor('user-1')
  await expect(readMedia(repository, asset.id)).rejects.toMatchObject({
    status: 404,
  })
  await expect(promoteMedia(repository, asset.id)).rejects.toMatchObject({
    status: 403,
  })
  await api.auth.selectDemoActor('user-20')
  const approved = await promoteMedia(repository, asset.id)
  expect(approved.visibility).toBe('public')
  expect(
    await repository.read((state) =>
      publicMedia(state.media.find((item) => item.asset.id === approved.id)!),
    ),
  ).toMatchObject({
    id: asset.id,
    url: `/api/v1/media/${asset.id}/public`,
  })
  await api.auth.logout()
  expect((await readMedia(repository, asset.id, true)).status).toBe(200)
  const other = await openDemoRepository(sessionId(), env.dir)
  await expect(readMedia(other, asset.id)).rejects.toMatchObject({
    status: 404,
  })
  const reopened = await openDemoRepository(id, env.dir)
  expect((await readMedia(reopened, asset.id, true)).status).toBe(200)
})
it('never promotes PDF evidence or projects private URLs in public records', async () => {
  const repository = await openDemoRepository(sessionId(), env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-1')
  const asset = await api.media.upload({
    file: new NodeBlob(['%PDF-1.7\n%%EOF'], {
      type: 'application/pdf',
    }) as Blob,
    filename: 'evidence\r\n.pdf',
    alt: 'Sample receipt',
    purpose: 'private_evidence',
    sensitive: false,
    shelterId: seed.users[0].shelterIds[0],
  })
  const response = await readMedia(repository, asset.id)
  expect(response.headers.get('content-disposition')).toMatch(
    /^attachment; filename="[a-f0-9-]+\.pdf"$/,
  )
  expect(() =>
    publicMedia({
      asset,
      approved: false,
      purpose: 'private_evidence',
    } as Parameters<typeof publicMedia>[0]),
  ).toThrow()
  expect(() =>
    toPublicAnimal({
      ...seed.animals[0],
      gallery: [
        {
          ...seed.animals[0].gallery[0],
          id: asset.id,
          url: asset.url,
          alt: asset.alt,
        },
      ],
    }),
  ).toThrow()
  await api.auth.selectDemoActor('user-20')
  await expect(promoteMedia(repository, asset.id)).rejects.toMatchObject({
    status: 400,
  })
})

it('serves multipart BFF uploads with CSRF, private download and strict method boundaries', async () => {
  const { dispatchApi } = await import('@/lib/server/api-registry')
  const { resolveDemoContext } = await import('@/lib/server/demo/session')
  const id = sessionId()
  const repository = await openDemoRepository(id, env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-6')
  const form = new FormData()
  form.set('file', new Blob([png], { type: 'image/png' }), 'pet.png')
  form.set('filename', '../pet.png')
  form.set('alt', 'A sample cat')
  form.set('purpose', 'public_image')
  form.set('sensitive', 'true')
  const request = new Request('http://localhost/api/v1/media', {
    method: 'POST',
    headers: { origin: 'http://localhost', cookie: `pawtrail_demo=${id}` },
    body: form,
  })
  const response = await dispatchApi(request, await resolveDemoContext(request))
  expect(response.status).toBe(200)
  const asset = await response.json()
  const get = new Request(`http://localhost${asset.url}`, {
    headers: { cookie: `pawtrail_demo=${id}` },
  })
  const download = await dispatchApi(get, await resolveDemoContext(get))
  expect(download.status).toBe(200)
  expect(download.headers.get('cache-control')).toBe('private, no-store')
  expect(new Uint8Array(await download.arrayBuffer()).length).toBe(asset.bytes)
  const denied = new Request(
    `http://localhost/api/v1/media/${asset.id}/public`,
    { headers: { cookie: `pawtrail_demo=${id}` } },
  )
  expect(
    (await dispatchApi(denied, await resolveDemoContext(denied))).status,
  ).toBe(404)
  const wrong = new Request(get.url, {
    method: 'POST',
    headers: { origin: 'http://localhost', cookie: `pawtrail_demo=${id}` },
  })
  expect(
    (await dispatchApi(wrong, await resolveDemoContext(wrong))).status,
  ).toBe(405)
  const cross = new Request('http://localhost/api/v1/media', {
    method: 'POST',
    headers: { origin: 'https://evil.invalid', cookie: `pawtrail_demo=${id}` },
    body: form,
  })
  expect(
    (await dispatchApi(cross, await resolveDemoContext(cross))).status,
  ).toBe(403)
  const huge = new Request('http://localhost/api/v1/media', {
    method: 'POST',
    headers: {
      origin: 'http://localhost',
      cookie: `pawtrail_demo=${id}`,
      'content-length': String(11 * 1024 * 1024),
    },
    body: 'sample',
  })
  expect((await dispatchApi(huge, await resolveDemoContext(huge))).status).toBe(
    413,
  )
  const noLength = new Request('http://localhost/api/v1/media', {
    method: 'POST',
    headers: { origin: 'http://localhost', cookie: `pawtrail_demo=${id}` },
    body: new Uint8Array(11 * 1024 * 1024),
  })
  expect(
    (await dispatchApi(noLength, await resolveDemoContext(noLength))).status,
  ).toBe(413)
  const malformed = new Request('http://localhost/api/v1/media', {
    method: 'POST',
    headers: {
      origin: 'http://localhost',
      cookie: `pawtrail_demo=${id}`,
      'content-type': 'multipart/form-data',
    },
    body: 'broken',
  })
  expect(
    (await dispatchApi(malformed, await resolveDemoContext(malformed))).status,
  ).toBe(400)
  await api.auth.selectDemoActor('user-20')
  await promoteMedia(repository, asset.id)
  expect(
    await repository.read((state) =>
      publicMedia(state.media.find((item) => item.asset.id === asset.id)!),
    ),
  ).toMatchObject({ sensitive: true })
})

it('checks current stored organization memberships and denies forged organization scope', async () => {
  const repository = await openDemoRepository(sessionId(), env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-1')
  const input = {
    file: new NodeBlob(['%PDF-1.7\n%%EOF'], {
      type: 'application/pdf',
    }) as Blob,
    filename: 'sample.pdf',
    alt: 'Sample evidence',
    purpose: 'private_evidence' as const,
    sensitive: false,
    shelterId: 'shelter-1',
  }
  const asset = await api.media.upload(input)
  await repository.transact({
    name: 'test.staff-member',
    input: null,
    execute(draft) {
      draft.data.users
        .find((user) => user.id === 'user-2')!
        .shelterIds.push('shelter-1')
    },
  })
  await api.auth.selectDemoActor('user-2')
  expect((await readMedia(repository, asset.id)).status).toBe(200)
  await repository.transact({
    name: 'test.revoke-membership',
    input: null,
    execute(draft) {
      draft.data.users.find((user) => user.id === 'user-2')!.shelterIds = [
        'shelter-2',
      ]
    },
  })
  await expect(readMedia(repository, asset.id)).rejects.toMatchObject({
    status: 404,
  })
  await expect(api.media.remove(asset.id)).rejects.toMatchObject({
    status: 404,
  })
  await expect(api.media.upload(input)).rejects.toMatchObject({ status: 403 })
})
