import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, it, vi } from 'vitest'
import { storage, sessionId } from '../demo/helpers'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { createRefreshCoordinator } from '@/lib/server/auth'
import { ApiError } from '@/lib/api/errors'
vi.mock('server-only', () => ({}))
const temp = storage()
it('persists sanitized sessions, isolates actor receipts, and stores no submitted passwords', async () => {
  const id = sessionId()
  const repository = await openDemoRepository(id, temp.dir)
  const api = createMockApi(undefined, repository)
  expect((await api.auth.session()).actor).toBeNull()
  const first = await api.auth.selectDemoActor('user-6')
  expect(first).toMatchObject({ demo: true, actor: { id: 'user-6' } })
  expect(first.cacheScope).not.toContain(id)
  const command = {
    name: 'private.result',
    input: null,
    idempotencyKey: 'same',
    execute: (draft: { auth: { actorId: string | null } }) =>
      draft.auth.actorId,
  }
  expect(await repository.transact(command)).toBe('user-6')
  const second = await api.auth.selectDemoActor('user-7')
  expect(second.cacheScope).not.toBe(first.cacheScope)
  expect(await repository.transact(command)).toBe('user-7')
  const registered = await api.auth.register({
    email: 'sample@example.invalid',
    username: 'new-helper',
    displayName: 'New Helper',
    password: 'not-a-real-password',
  })
  expect(registered.actor?.roles).toEqual(['member'])
  await api.auth.logout()
  expect((await api.auth.session()).actor).toBeNull()
  const loggedIn = await api.auth.login({
    email: 'sample@example.invalid',
    password: 'any-demo-value',
  })
  expect(loggedIn.actor?.id).toBe(registered.actor?.id)
  const stored = await readFile(join(temp.dir, `${id}.json`), 'utf8')
  expect(stored).not.toMatch(/password|not-a-real|any-demo-value/)
  expect(
    await createMockApi(
      undefined,
      await openDemoRepository(id, temp.dir),
    ).auth.session(),
  ).toEqual(loggedIn)
})
it('serializes concurrent expired credential refresh and replays once', async () => {
  const refresh = vi.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5))
  })
  const logout = vi.fn(async () => undefined)
  const coordinator = createRefreshCoordinator({ refresh, logout })
  const request = vi
    .fn()
    .mockRejectedValueOnce(new ApiError('EXPIRED', 'Expired', 401))
    .mockRejectedValueOnce(new ApiError('EXPIRED', 'Expired', 401))
    .mockResolvedValue('ok')
  expect(
    await Promise.all([coordinator.run(request), coordinator.run(request)]),
  ).toEqual(['ok', 'ok'])
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(request).toHaveBeenCalledTimes(4)
  expect(logout).not.toHaveBeenCalled()
})
it('logs out once on failed refresh or repeated 401, never loops', async () => {
  const logout = vi.fn(async () => undefined)
  const refresh = vi.fn(async () => {
    throw new Error('Refresh expired')
  })
  const coordinator = createRefreshCoordinator({ refresh, logout })
  const request = vi.fn(async () => {
    throw new ApiError('EXPIRED', 'Expired', 401)
  })
  await Promise.allSettled([coordinator.run(request), coordinator.run(request)])
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(logout).toHaveBeenCalledTimes(1)
  const refreshOk = vi.fn(async () => undefined)
  const retry = createRefreshCoordinator({ refresh: refreshOk, logout })
  await expect(retry.run(request)).rejects.toMatchObject({ status: 401 })
  expect(refreshOk).toHaveBeenCalledTimes(1)
  expect(logout).toHaveBeenCalledTimes(2)
})
it('initializes authentication through the BFF with an HttpOnly cookie and resumes it', async () => {
  const { dispatchApi } = await import('@/lib/server/api-registry')
  const { resolveDemoContext } = await import('@/lib/server/demo/session')
  const login = new Request('https://pawtrail.test/api/v1/demo/actor', {
    method: 'POST',
    headers: {
      origin: 'https://pawtrail.test',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ actorId: 'user-6' }),
  })
  const response = await dispatchApi(login, await resolveDemoContext(login))
  expect(response.status).toBe(200)
  const cookie = response.headers.get('set-cookie')!
  expect(cookie).toMatch(/HttpOnly; SameSite=Lax; Secure/)
  const read = new Request('https://pawtrail.test/api/v1/auth/session', {
    headers: { cookie: cookie.split(';')[0] },
  })
  const context = await resolveDemoContext(read)
  expect(context.actor?.id).toBe('user-6')
  const session = await (await dispatchApi(read, context)).json()
  expect(session.actor.id).toBe('user-6')
  expect(Object.keys(session.actor).sort()).toEqual([
    'displayName',
    'id',
    'roles',
    'shelterIds',
    'username',
  ])
  expect(JSON.stringify(session)).not.toContain(
    cookie.split('=')[1].split(';')[0],
  )
})
