import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, vi } from 'vitest'
import type { DemoCommand } from '@/lib/server/demo/transactions'
import type { FixtureSeed } from '@/data/fixtures'
vi.mock('server-only', () => ({}))

export const sessionId = () => randomBytes(32).toString('hex')
export function storage() {
  const value = { dir: '' }
  beforeEach(async () => {
    value.dir = await mkdtemp(join(tmpdir(), 'pawtrail-demo-'))
    vi.stubEnv('DEMO_DATA_DIR', value.dir)
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
    vi.stubEnv('DEMO_ALLOW_RESET', 'true')
  })
  afterEach(async () => {
    await rm(value.dir, { recursive: true, force: true })
  })
  return value
}
export function addPost(
  id: string,
  key?: string,
): DemoCommand<FixtureSeed['posts'][number]> {
  return {
    name: 'test.add-post',
    input: { id },
    idempotencyKey: key,
    execute: (draft, clock) => {
      const post = {
        ...draft.data.posts[0],
        id,
        text: 'New sample post',
        createdAt: clock.now().toISOString(),
      }
      draft.data.posts.push(post)
      return post
    },
  }
}
export const postById = (id: string) => (snapshot: { data: FixtureSeed }) =>
  snapshot.data.posts.find((post) => post.id === id) ?? null
export function request(
  path: string,
  id?: string,
  method = 'GET',
  origin = 'http://localhost',
) {
  return new Request(`http://localhost/api/v1${path}`, {
    method,
    headers: { ...(id ? { cookie: `pawtrail_demo=${id}` } : {}), origin },
  })
}
