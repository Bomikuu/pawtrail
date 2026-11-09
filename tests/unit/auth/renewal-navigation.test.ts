import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { expect, it, vi } from 'vitest'
import { realSessionNeedsRenewal } from '@/lib/server/real-session'
import { validateReturnPath } from '@/features/auth/return-path'
import { proxy } from '@/proxy'

vi.mock('server-only', () => ({}))

it('renews an authenticated cookie before expiry and ignores absent or tampered cookies', () => {
  const secret = 'renewal-test-secret-with-at-least-32-characters'
  vi.stubEnv('SESSION_SECRET', secret)
  const now = Date.now()
  const cookie = (expires: number) => {
    const iv = randomBytes(12)
    const cipher = createCipheriv(
      'aes-256-gcm',
      createHash('sha256').update(secret).digest(),
      iv,
    )
    const access =
      'header.' +
      Buffer.from(JSON.stringify({ exp: expires })).toString('base64url') +
      '.signature'
    const body = Buffer.concat([
      cipher.update(
        JSON.stringify({ access, refresh: 'refresh', scope: 'member' }),
      ),
      cipher.final(),
    ])
    return [iv, cipher.getAuthTag(), body]
      .map((value) => value.toString('base64url'))
      .join('.')
  }
  expect(
    realSessionNeedsRenewal(cookie(Math.floor(now / 1000) + 30), now),
  ).toBe(true)
  expect(
    realSessionNeedsRenewal(cookie(Math.floor(now / 1000) + 900), now),
  ).toBe(false)
  expect(realSessionNeedsRenewal()).toBe(false)
  expect(realSessionNeedsRenewal('tampered')).toBe(false)
  const request = new NextRequest('http://127.0.0.1:3000/play?map=community', {
    headers: {
      host: '127.0.0.1:3000',
      cookie: 'pawtrail_session=' + cookie(Math.floor(now / 1000) - 1),
    },
  })
  const response = proxy(request)
  expect(response.status).toBe(307)
  expect(response.headers.get('location')).toBe(
    'http://127.0.0.1:3000/auth/renew?returnTo=%2Fplay%3Fmap%3Dcommunity',
  )
  expect(response.headers.get('cache-control')).toBe('no-store')
})

it('preserves Play destinations and prevents renewal loops or external redirects', () => {
  expect(validateReturnPath('/play?map=community')).toBe('/play?map=community')
  expect(validateReturnPath('/play?home=system%3Ahub')).toBe(
    '/play?home=system%3Ahub',
  )
  for (const path of [
    '/auth/renew?returnTo=/auth/renew',
    '//example.com',
    '/api/v1/auth/refresh',
  ]) {
    expect(validateReturnPath(path)).toBe('/community')
  }
})
