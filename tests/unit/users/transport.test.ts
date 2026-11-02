// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { storage, sessionId } from '../demo/helpers'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { dispatchApi } from '@/lib/server/api-registry'
import { getBrowserApi } from '@/lib/api/client'
const disk = storage()
it('serializes profile, follow and owner-scoped notification views through the real BFF/browser boundary', async () => {
  const id = sessionId()
  const repo = await openDemoRepository(id, disk.dir)
  const api = createMockApi(undefined, repo)
  let session = await api.auth.selectDemoActor('user-1')
  vi.stubGlobal(
    'fetch',
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), 'http://localhost')
      const headers = new Headers(init?.headers)
      headers.set('origin', 'http://localhost')
      return dispatchApi(new Request(url, { ...init, headers }), {
        api,
        mode: 'mock',
        actor: session.actor,
        demo: { repository: repo, sessionId: id },
      })
    },
  )
  const browser = getBrowserApi()
  expect((await browser.users.get('sample-helper-2')).summary).toMatchObject({
    donations: 1,
  })
  await browser.follows.set({ kind: 'user', id: 'user-2' }, true)
  expect((await browser.follows.list({ kind: 'user' })).items[0]).toMatchObject(
    {
      followerId: 'user-1',
      target: { kind: 'user', id: 'user-2' },
      createdAt: '2026-11-01T16:00:00.000Z',
    },
  )
  expect(await browser.notifications.unreadCount()).toBe(0)
  session = await api.auth.selectDemoActor('user-2')
  expect(await browser.notifications.unreadCount()).toBe(1)
  const note = (await browser.notifications.list({})).items[0]
  expect(note.destinationHref).toBe('/users/sample-helper-1')
  await browser.notifications.markRead([note.id])
  expect(await browser.notifications.unreadCount()).toBe(0)
  session = await api.auth.selectDemoActor('user-1')
  await expect(browser.notifications.markRead([note.id])).rejects.toMatchObject(
    { status: 403 },
  )
  await browser.follows.set({ kind: 'user', id: 'user-2' }, false)
  expect((await browser.community.list({ tab: 'following' })).items).toEqual([])
})
