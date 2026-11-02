import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { openDemoRepository } from '@/lib/server/demo/repository'
import { addPost, postById, sessionId, storage } from './helpers'

describe('serialized idempotent transactions', () => {
  const env = storage()
  it('runs concurrent idempotent commands once and replays their receipt after reopening', async () => {
    const id = sessionId()
    const a = await openDemoRepository(id, env.dir)
    const b = await openDemoRepository(id, env.dir)
    const command = addPost('once', 'repeat-key')
    const execute = vi.fn(command.execute)
    const [first, second] = await Promise.all([
      a.transact({ ...command, execute }),
      b.transact({ ...command, execute }),
    ])
    expect(first).toEqual(second)
    expect(execute).toHaveBeenCalledTimes(1)
    const reopened = await openDemoRepository(id, env.dir)
    expect(await reopened.transact({ ...command, execute })).toEqual(first)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(
      await a.read((state) =>
        state.data.posts.filter((post) => post.id === 'once'),
      ),
    ).toHaveLength(1)
    const disk = JSON.parse(await readFile(join(env.dir, `${id}.json`), 'utf8'))
    expect(disk.receipts).toHaveLength(1)
    await expect(
      a.transact(addPost('changed-payload', 'repeat-key')),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })
  it('does not lose different concurrent writes from independent handles', async () => {
    const id = sessionId()
    const a = await openDemoRepository(id, env.dir)
    const b = await openDemoRepository(id, env.dir)
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        (i % 2 ? a : b).transact(addPost(`concurrent-${i}`)),
      ),
    )
    for (let i = 0; i < 12; i++)
      expect(await a.read(postById(`concurrent-${i}`))).not.toBeNull()
  })
})
