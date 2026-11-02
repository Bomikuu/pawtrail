import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { openDemoRepository } from '@/lib/server/demo/repository'
import { resetDemoSession, resolveDemoContext } from '@/lib/server/demo/session'
import { dispatchApi } from '@/lib/server/api-registry'
import { GET } from '@/app/api/v1/[...path]/route'
import { addPost, request, sessionId, storage } from './helpers'

describe('recoverable schema state', () => {
  const env = storage()
  it.each(['schemaVersion', 'fixtureVersion'])(
    'rejects mismatched %s without deleting data and permits explicit session reset',
    async (field) => {
      const id = sessionId()
      const repo = await openDemoRepository(id, env.dir)
      await repo.transact(addPost('old'))
      const path = join(env.dir, `${id}.json`)
      const document = JSON.parse(await readFile(path, 'utf8'))
      document[field] = 0
      const old = JSON.stringify(document)
      await writeFile(path, old)
      await expect(openDemoRepository(id, env.dir)).rejects.toMatchObject({
        code: 'DEMO_RESET_REQUIRED',
        status: 409,
      })
      expect(await readFile(path, 'utf8')).toBe(old)
      const failedRead = await GET(request('/community/posts', id))
      expect(failedRead.status).toBe(409)
      expect(await failedRead.json()).toMatchObject({
        code: 'DEMO_RESET_REQUIRED',
      })
      expect(failedRead.headers.get('cache-control')).toBe('no-store')
      const reset = request('/demo/reset', id, 'POST')
      const response = await dispatchApi(reset, await resolveDemoContext(reset))
      expect(response.status).toBe(204)
      expect(
        await (
          await openDemoRepository(id, env.dir)
        ).read((state) => state.data.posts),
      ).toHaveLength(10)
    },
  )
  it('requires an explicit reset for schema3 rather than dropping old state', async () => {
    const id = sessionId()
    const repo = await openDemoRepository(id, env.dir)
    await repo.transact(addPost('schema3-story'))
    const path = join(env.dir, `${id}.json`)
    const document = JSON.parse(await readFile(path, 'utf8'))
    document.schemaVersion = 3
    delete document.savedAnimals
    const old = JSON.stringify(document)
    await writeFile(path, old)
    await expect(openDemoRepository(id, env.dir)).rejects.toMatchObject({
      code: 'DEMO_RESET_REQUIRED',
    })
    expect(await readFile(path, 'utf8')).toBe(old)
  })
  it('treats corrupt JSON as reset-required, preserving it until reset', async () => {
    const id = sessionId()
    const path = join(env.dir, `${id}.json`)
    await writeFile(path, '{broken')
    await expect(openDemoRepository(id, env.dir)).rejects.toMatchObject({
      code: 'DEMO_RESET_REQUIRED',
    })
    expect(await readFile(path, 'utf8')).toBe('{broken')
    await resetDemoSession(id)
    expect(
      await (
        await openDemoRepository(id, env.dir)
      ).read((state) => state.data.posts),
    ).toHaveLength(10)
  })
})
