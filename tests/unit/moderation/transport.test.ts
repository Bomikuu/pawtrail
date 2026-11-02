// @vitest-environment node
import { expect, it, vi } from 'vitest'
import { storage, request, sessionId } from '../demo/helpers'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { POST } from '@/app/api/v1/[...path]/route'
import { dispatchApi } from '@/lib/server/api-registry'
import { getBrowserApi } from '@/lib/api/client'
import { itemFor, reason } from './helpers'
const invalidate = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({ revalidatePath: invalidate }))
const store = storage()
it('validates report/comment/review transport and invalidates paths only after a successful review', async () => {
  const id = sessionId()
  const repo = await openDemoRepository(id, store.dir)
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
  const target = { kind: 'animal' as const, id: 'animal-1' }
  expect(
    await browser.community.comment(target, { text: 'Helpful observation' }),
  ).toMatchObject({
    moderation: 'pending',
    author: { displayName: 'Sample Helper 1' },
  })
  expect(
    await browser.moderation.report({ target, reason: 'privacy' }),
  ).toMatchObject({ target, reason: 'privacy', details: '' })
  await expect(browser.moderation.queue({})).rejects.toMatchObject({
    status: 403,
  })
  session = await api.auth.selectDemoActor('user-20')
  const item = await itemFor(api, 'animal-1')
  const command = new Request(
    request(`/moderation/${encodeURIComponent(item.id)}/review`, id, 'POST'),
    {
      headers: {
        cookie: `pawtrail_demo=${id}`,
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        expectedVersion: item.version,
        action: 'remove',
        reason,
        evidenceRefs: [],
      }),
    },
  )
  const response = await POST(command)
  expect(response.status).toBe(200)
  expect(invalidate).toHaveBeenCalledExactlyOnceWith('/', 'layout')
  await expect(browser.animals.get('milo')).rejects.toMatchObject({
    status: 404,
  })
})
