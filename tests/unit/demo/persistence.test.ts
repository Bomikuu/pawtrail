import { readFile, readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:fs/promises')>()
  return { ...original, rename: vi.fn(original.rename) }
})
import { openDemoRepository } from '@/lib/server/demo/repository'
import { DEMO_NOW } from '@/lib/api/clock'
import { addPost, postById, sessionId, storage } from './helpers'

describe('persistent demo repository', () => {
  const env = storage()
  it('persists a sample post across repository instances without mutating fixtures', async () => {
    const id = sessionId()
    const repository = await openDemoRepository(id, env.dir)
    const created = await repository.transact(addPost('created-post'))
    expect(created.createdAt).toBe(new Date(DEMO_NOW).toISOString())
    const reopened = await openDemoRepository(id, env.dir)
    expect(await reopened.read(postById(created.id))).toEqual(created)
    const document = JSON.parse(
      await readFile(join(env.dir, `${id}.json`), 'utf8'),
    )
    expect(Object.keys(document.overlay)).toEqual(['posts'])
    expect(document.schemaVersion).toBe(2)
    expect(document.fixtureVersion).toBe(1)
  })
  it('preserves the committed file and removes temporary files when atomic replacement fails', async () => {
    const id = sessionId()
    const repo = await openDemoRepository(id, env.dir)
    await repo.transact(addPost('committed'))
    const before = await readFile(join(env.dir, `${id}.json`), 'utf8')
    vi.mocked(rename).mockRejectedValueOnce(new Error('Synthetic disk failure'))
    await expect(
      repo.transact(addPost('uncommitted', 'retryable')),
    ).rejects.toThrow('Synthetic disk failure')
    expect(await readFile(join(env.dir, `${id}.json`), 'utf8')).toBe(before)
    expect(await readdir(env.dir)).toEqual([`${id}.json`])
    expect(await repo.read(postById('uncommitted'))).toBeNull()
    await repo.transact(addPost('uncommitted', 'retryable'))
    expect(await repo.read(postById('uncommitted'))).not.toBeNull()
  })
  it('isolates query and returned command objects from persisted state', async () => {
    const repo = await openDemoRepository(sessionId(), env.dir)
    const created = await repo.transact(addPost('created-post'))
    created.text = 'outside write'
    await repo.read((snapshot) => {
      snapshot.data.posts.length = 0
    })
    expect(await repo.read(postById('created-post'))).toMatchObject({
      text: 'New sample post',
    })
  })
  it('leaves the old file byte-for-byte valid after a failed command or unserializable result', async () => {
    const id = sessionId()
    const repo = await openDemoRepository(id, env.dir)
    await repo.transact(addPost('first'))
    const before = await readFile(join(env.dir, `${id}.json`), 'utf8')
    await expect(
      repo.transact({
        name: 'fail',
        input: null,
        execute: (draft) => {
          draft.data.posts.length = 0
          throw new Error('Synthetic failure')
        },
      }),
    ).rejects.toThrow('Synthetic failure')
    await expect(
      repo.transact({ name: 'invalid', input: null, execute: () => BigInt(1) }),
    ).rejects.toThrow()
    expect(await readFile(join(env.dir, `${id}.json`), 'utf8')).toBe(before)
    await repo.transact(addPost('after-failure'))
    expect(await repo.read(postById('after-failure'))).not.toBeNull()
  })
})
