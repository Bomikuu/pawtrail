import { beforeEach, expect, it, vi } from 'vitest'
import { createDjangoApi } from '@/lib/api/adapters/django'

const sessions = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/server/real-session', () => ({
  readRealSession: sessions.read,
  writeRealSession: sessions.write,
  assertRealSessionConfiguration: vi.fn(),
}))

beforeEach(() => {
  sessions.read.mockResolvedValue({
    access: 'expired',
    refresh: 'prior',
    scope: 'member',
  })
  sessions.write.mockReset()
})

it('does not consume a rotating refresh token in a read-only page render', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
  vi.stubGlobal('fetch', fetch)
  expect(
    (await createDjangoApi('https://api.example.invalid').auth.session()).actor,
  ).toBeNull()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(sessions.write).not.toHaveBeenCalled()
})

it('saves rotated credentials before a cookie-writable request retries', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    .mockResolvedValueOnce(
      Response.json({ access: 'renewed', refresh: 'rotated' }),
    )
    .mockResolvedValueOnce(
      Response.json({
        actor: {
          id: 'member',
          username: 'member',
          display_name: 'Member',
          roles: ['member'],
          shelter_ids: [],
        },
        roles: ['member'],
        expires_at: '2026-11-08T08:00:00Z',
      }),
    )
  vi.stubGlobal('fetch', fetch)
  const api = createDjangoApi('https://api.example.invalid', {
    allowCookieWrites: true,
  })
  expect((await api.auth.session()).actor?.id).toBe('member')
  expect(sessions.write).toHaveBeenCalledWith({
    access: 'renewed',
    refresh: 'rotated',
    scope: 'member',
  })
  expect(new Headers(fetch.mock.calls[2][1].headers).get('Authorization')).toBe(
    'Bearer renewed',
  )
})
