import { expect, it, vi } from 'vitest'
import { Blob as NodeBlob } from 'node:buffer'
import { readdir, rename, writeFile } from 'node:fs/promises'
vi.mock('server-only', () => ({}))
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>()
  return { ...original, rename: vi.fn(original.rename) }
})
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { cleanupAbandonedUploads } from '@/lib/server/media/storage'
import { readMedia } from '@/lib/server/media/delivery'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { sessionId, storage } from '../demo/helpers'
const env = storage()
it('removes abandoned uploads and files without touching another session', async () => {
  const repository = await openDemoRepository(sessionId(), env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-6')
  const input = {
    file: new NodeBlob(['%PDF-1.7\n%%EOF'], {
      type: 'application/pdf',
    }) as Blob,
    filename: 'evidence.pdf',
    alt: 'Sample evidence',
    purpose: 'private_evidence' as const,
    sensitive: false,
  }
  const first = await api.media.upload(input)
  await api.media.remove(first.id)
  await expect(readMedia(repository, first.id)).rejects.toMatchObject({
    status: 404,
  })
  const second = await api.media.upload(input)
  await cleanupAbandonedUploads(repository, Date.now() + 2 * 86400000)
  await expect(readMedia(repository, second.id)).rejects.toMatchObject({
    status: 404,
  })
  expect(await readdir(repository.mediaRoot)).toEqual([])
})

it('keeps attached evidence and approved images during cleanup and replays upload safely', async () => {
  const { attachMedia } = await import('@/lib/server/media/storage')
  const repository = await openDemoRepository(sessionId(), env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-6')
  const input = {
    file: new NodeBlob(['%PDF-1.7\n%%EOF'], {
      type: 'application/pdf',
    }) as Blob,
    filename: 'sample.pdf',
    alt: 'Sample evidence',
    purpose: 'private_evidence' as const,
    sensitive: false,
  }
  const asset = await api.media.upload(input, {
    idempotencyKey: 'single-upload',
  })
  expect(
    await api.media.upload(input, { idempotencyKey: 'single-upload' }),
  ).toEqual(asset)
  expect(await readdir(repository.mediaRoot)).toHaveLength(1)
  await repository.transact({
    name: 'test.attach',
    input: null,
    execute(draft) {
      attachMedia(draft, [asset.id])
    },
  })
  await cleanupAbandonedUploads(repository, Date.now() + 2 * 86400000)
  expect((await readMedia(repository, asset.id)).status).toBe(200)
  await expect(api.media.remove(asset.id)).rejects.toMatchObject({
    status: 409,
  })
})

it('preserves files if expiry metadata cannot commit, sweeps orphans and clears only this session on reset', async () => {
  const { resetDemoSession } = await import('@/lib/server/demo/session')
  const id = sessionId()
  const repository = await openDemoRepository(id, env.dir)
  const api = createMockApi(undefined, repository)
  await api.auth.selectDemoActor('user-6')
  const input = {
    file: new NodeBlob(['%PDF-1.7\n%%EOF'], {
      type: 'application/pdf',
    }) as Blob,
    filename: 'sample.pdf',
    alt: 'Sample evidence',
    purpose: 'private_evidence' as const,
    sensitive: false,
  }
  const asset = await api.media.upload(input)
  vi.mocked(rename).mockRejectedValueOnce(new Error('Synthetic disk failure'))
  await expect(
    cleanupAbandonedUploads(repository, Date.now() + 2 * 86400000),
  ).rejects.toThrow('Synthetic disk failure')
  expect((await readMedia(repository, asset.id)).status).toBe(200)
  await writeFile(join(repository.mediaRoot, `${randomUUID()}.pdf`), 'orphan', {
    mode: 0o600,
  })
  const other = await openDemoRepository(sessionId(), env.dir)
  const otherApi = createMockApi(undefined, other)
  await otherApi.auth.selectDemoActor('user-6')
  const otherAsset = await otherApi.media.upload(input)
  await cleanupAbandonedUploads(repository, Date.now() + 2 * 86400000)
  expect(await readdir(repository.mediaRoot)).toEqual([])
  await api.media.upload(input)
  await resetDemoSession(id)
  await expect(readdir(repository.mediaRoot)).rejects.toMatchObject({
    code: 'ENOENT',
  })
  expect((await readMedia(other, otherAsset.id)).status).toBe(200)
})
