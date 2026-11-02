import { describe, expect, it, vi } from 'vitest'
import { dispatchApi } from '@/lib/server/api-registry'
import { createMockApi } from '@/lib/api/adapters/mock'

vi.mock('server-only', () => ({}))
const context = { api: createMockApi(), mode: 'mock' as const }
const request = (path: string, method = 'GET') =>
  new Request(`http://localhost/api/v1${path}`, { method })

describe('explicit BFF registry', () => {
  it('serves public validated reads', async () => {
    const response = await dispatchApi(request('/animals'), context)
    expect(response.status).toBe(200)
    expect((await response.json()).items).toHaveLength(12)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('distinguishes unknown paths from wrong methods', async () => {
    expect((await dispatchApi(request('/unknown'), context)).status).toBe(404)
    const wrong = await dispatchApi(request('/animals', 'DELETE'), context)
    expect(wrong.status).toBe(405)
    expect(wrong.headers.get('allow')).toBe('GET')
    expect(
      (await dispatchApi(request('/https%3A%2F%2Fevil.invalid'), context))
        .status,
    ).toBe(404)
  })
  it('reserves static paths before parameter handlers and rejects unfinished operations', async () => {
    expect(
      (await dispatchApi(request('/fundraisers/drafts'), context)).status,
    ).toBe(501)
    expect((await dispatchApi(request('/auth/session'), context)).status).toBe(
      501,
    )
    expect(
      (
        await dispatchApi(request('/demo/session', 'POST'), {
          ...context,
          mode: 'real',
        })
      ).status,
    ).toBe(403)
  })
})

describe('BFF boundaries', () => {
  it('validates queries and gives explicit empty and missing results', async () => {
    const empty = await dispatchApi(
      request('/animals?q=no-such-animal'),
      context,
    )
    expect(await empty.json()).toEqual({
      items: [],
      count: 0,
      nextCursor: null,
    })
    expect(
      (await dispatchApi(request('/animals?limit=-1'), context)).status,
    ).toBe(400)
    expect(
      (await dispatchApi(request('/animals?adoptable=maybe'), context)).status,
    ).toBe(400)
    expect(
      (await dispatchApi(request('/animals/does-not-exist'), context)).status,
    ).toBe(404)
    expect(
      (await dispatchApi(request('/animals/reports'), context)).status,
    ).toBe(405)
  })
  it('requires same-origin mutations and validates bodies before calling services', async () => {
    const crossOrigin = new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'https://other.invalid' },
    })
    expect((await dispatchApi(crossOrigin, context)).status).toBe(403)
    const valid = new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    })
    expect((await dispatchApi(valid, context)).status).toBe(501)
    const invalid = new Request(
      'http://localhost/api/v1/animals/animal-1/saved',
      {
        method: 'PUT',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ saved: 'yes' }),
      },
    )
    expect((await dispatchApi(invalid, context)).status).toBe(400)
  })
  it('returns 204 for void domain operations and normalizes invalid responses', async () => {
    const api = createMockApi()
    api.auth.logout = async () => undefined
    const valid = new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    })
    const response = await dispatchApi(valid, { ...context, api })
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    api.animals.get = async () => {
      throw new Error('secret upstream body')
    }
    const failure = await dispatchApi(request('/animals/milo'), {
      ...context,
      api,
    })
    expect(failure.status).toBe(500)
    expect(await failure.text()).not.toContain('secret')
  })
  it('makes browser public reads agree with direct server projections', async () => {
    const { getBrowserApi } = await import('@/lib/api/client')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) =>
        dispatchApi(new Request(`http://localhost${url}`, init), context),
      ),
    )
    expect(await getBrowserApi().animals.get('milo')).toEqual(
      await context.api.animals.get('milo'),
    )
    expect(
      await getBrowserApi().animals.list({ species: 'cat', limit: 3 }),
    ).toEqual(await context.api.animals.list({ species: 'cat', limit: 3 }))
    expect(
      await getBrowserApi().fundraisers.supporters('campaign-1', {}),
    ).toEqual(await context.api.fundraisers.supporters('campaign-1', {}))
  })
})
