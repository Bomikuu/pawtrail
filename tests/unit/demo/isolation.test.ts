import { readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
const cookieStore = vi.hoisted(() => ({
  value: undefined as string | undefined,
  set: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => (cookieStore.value ? { value: cookieStore.value } : undefined),
    set: cookieStore.set,
  }),
}))
import { openDemoRepository } from '@/lib/server/demo/repository'
import { resolveDemoContext, resetDemoSession } from '@/lib/server/demo/session'
import { dispatchApi } from '@/lib/server/api-registry'
import { getServerApi } from '@/lib/api/server'
import { addPost, postById, request, sessionId, storage } from './helpers'

describe('session isolation and lifecycle', () => {
  const env = storage()
  it('keeps writes and resets private to one session', async () => {
    const id = sessionId()
    const otherId = sessionId()
    const a = await openDemoRepository(id, env.dir)
    const b = await openDemoRepository(otherId, env.dir)
    await a.transact(addPost('mine'))
    await b.transact(addPost('theirs'))
    expect(await b.read(postById('mine'))).toBeNull()
    await resetDemoSession(id)
    expect(await a.read(postById('mine'))).toBeNull()
    expect(await b.read(postById('theirs'))).not.toBeNull()
  })
  it('serves anonymous fixtures without writing a session or cookie', async () => {
    const req = request('/community/posts')
    const response = await dispatchApi(req, await resolveDemoContext(req))
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBeNull()
    expect((await response.json()).count).toBe(10)
    expect(await readdir(env.dir)).toEqual([])
  })
  it('sets an opaque HttpOnly cookie only in an initialization response and reuses it', async () => {
    const req = request('/demo/session', undefined, 'POST')
    const response = await dispatchApi(req, await resolveDemoContext(req))
    expect(response.status).toBe(204)
    const cookie = response.headers.get('set-cookie')!
    expect(cookie).toMatch(/^pawtrail_demo=[a-f0-9]{64};/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    const id = cookie.split(';')[0].split('=')[1]
    await (await openDemoRepository(id, env.dir)).transact(addPost('keep'))
    const repeat = request('/demo/session', id, 'POST')
    expect(
      (await dispatchApi(repeat, await resolveDemoContext(repeat))).status,
    ).toBe(204)
    expect(
      await (await openDemoRepository(id, env.dir)).read(postById('keep')),
    ).not.toBeNull()
    const secure = new Request('https://pawtrail.example/api/v1/demo/session', {
      method: 'POST',
      headers: { origin: 'https://pawtrail.example' },
    })
    expect(
      (await dispatchApi(secure, await resolveDemoContext(secure))).headers.get(
        'set-cookie',
      ),
    ).toContain('Secure')
  })
  it('makes BFF and RSC reads resolve the current overlay without RSC cookie writes', async () => {
    const id = sessionId()
    await (await openDemoRepository(id, env.dir)).transact(addPost('rsc-post'))
    cookieStore.value = id
    try {
      const server = await getServerApi()
      const req = request('/community/posts/rsc-post', id)
      const response = await dispatchApi(req, await resolveDemoContext(req))
      expect(await response.json()).toEqual(
        await server.community.get('rsc-post'),
      )
      expect(cookieStore.set).not.toHaveBeenCalled()
      expect(response.headers.get('cache-control')).toBe('no-store')
    } finally {
      cookieStore.value = undefined
    }
  })
  it('keeps unpublished overlay posts out of the public API', async () => {
    const id = sessionId()
    const repo = await openDemoRepository(id, env.dir)
    const command = addPost('private-pending')
    await repo.transact({
      ...command,
      execute: (draft, clock) => {
        const post = command.execute(
          draft,
          clock,
        ) as (typeof draft.data.posts)[number]
        post.moderation = 'pending'
        return post
      },
    })
    const req = request('/community/posts/private-pending', id)
    expect((await dispatchApi(req, await resolveDemoContext(req))).status).toBe(
      404,
    )
  })
  it('requires same origin, reset opt-in and an existing session for reset', async () => {
    const foreign = request(
      '/demo/session',
      undefined,
      'POST',
      'https://evil.example',
    )
    expect(
      (await dispatchApi(foreign, await resolveDemoContext(foreign))).status,
    ).toBe(403)
    const noSession = request('/demo/reset', undefined, 'POST')
    expect(
      (await dispatchApi(noSession, await resolveDemoContext(noSession)))
        .status,
    ).toBe(401)
    vi.stubEnv('DEMO_ALLOW_RESET', 'false')
    const disabled = request('/demo/reset', sessionId(), 'POST')
    expect(
      (await dispatchApi(disabled, await resolveDemoContext(disabled))).status,
    ).toBe(403)
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'false')
    vi.stubEnv('DJANGO_API_BASE_URL', 'https://backend.example')
    const real = request('/demo/session', undefined, 'POST')
    expect(
      (await dispatchApi(real, await resolveDemoContext(real))).status,
    ).toBe(403)
  })
  it.each([
    '../outside',
    '/tmp/outside',
    '..%2foutside',
    'short',
    'a'.repeat(64) + '/child',
  ])('rejects unsafe session IDs: %s', async (id) => {
    await expect(openDemoRepository(id, env.dir)).rejects.toMatchObject({
      code: 'INVALID_DEMO_SESSION',
    })
    expect(await readdir(env.dir)).toEqual([])
  })
  it('refuses session symlinks without reading or changing their targets', async () => {
    const id = sessionId()
    const target = join(env.dir, 'protected.json')
    await writeFile(target, 'protected')
    await symlink(target, join(env.dir, `${id}.json`))
    await expect(openDemoRepository(id, env.dir)).rejects.toMatchObject({
      code: 'INVALID_DEMO_SESSION',
    })
    await expect(resetDemoSession(id)).rejects.toMatchObject({
      code: 'INVALID_DEMO_SESSION',
    })
    expect(await readFile(target, 'utf8')).toBe('protected')
  })
})
