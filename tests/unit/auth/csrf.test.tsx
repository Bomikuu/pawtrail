import { expect, it, vi } from 'vitest'
import { assertSameOrigin } from '@/lib/server/csrf'
import { dispatchApi } from '@/lib/server/api-registry'
import { createMockApi } from '@/lib/api/adapters/mock'
vi.mock('server-only', () => ({}))
it('rejects absent or cross-origin mutation origins and cross-site fetch metadata', () => {
  for (const headers of [
    {},
    { origin: 'https://evil.test' },
    { origin: 'https://pawtrail.test', 'sec-fetch-site': 'cross-site' },
  ] as Record<string, string>[]) {
    expect(() =>
      assertSameOrigin(
        new Request('https://pawtrail.test/api/v1/auth/logout', {
          method: 'POST',
          headers,
        }),
      ),
    ).toThrow()
  }
  expect(() =>
    assertSameOrigin(
      new Request('https://pawtrail.test/api/v1/auth/logout', {
        method: 'POST',
        headers: { origin: 'https://pawtrail.test' },
      }),
    ),
  ).not.toThrow()
})
it('disables actor selection in real mode and protects moderation server-side', async () => {
  const api = createMockApi()
  const req = (path: string) =>
    new Request(`https://pawtrail.test/api/v1${path}`, {
      method: 'POST',
      headers: { origin: 'https://pawtrail.test' },
    })
  expect(
    (await dispatchApi(req('/demo/actor'), { api, mode: 'real' })).status,
  ).toBe(403)
  expect(
    (await dispatchApi(req('/moderation/item/review'), { api, mode: 'mock' }))
      .status,
  ).toBe(401)
})
