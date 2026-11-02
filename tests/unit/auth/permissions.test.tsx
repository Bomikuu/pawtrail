import { expect, it, vi } from 'vitest'
import { can } from '@/lib/server/permissions'
import { requireActor } from '@/lib/server/auth'
import { validateReturnPath, loginPath } from '@/features/auth/return-path'
import { createMockApi } from '@/lib/api/adapters/mock'
vi.mock('server-only', () => ({}))
const member = {
  id: 'member',
  username: 'member',
  displayName: 'Member',
  roles: ['member'] as const,
  shelterIds: [],
}
const actor = { ...member, roles: [...member.roles] }
it('denies cross-scope access and requires an actor', () => {
  expect(can(actor, 'review_application', { shelterId: 'other' })).toBe(false)
  expect(can(actor, 'view_application', { applicantId: 'someone-else' })).toBe(
    false,
  )
  expect(can(actor, 'view_application', { applicantId: actor.id })).toBe(true)
  expect(
    can(
      { ...actor, roles: ['shelter_staff'], shelterIds: ['one'] },
      'manage_shelter',
      { shelterId: 'two' },
    ),
  ).toBe(false)
  expect(can(actor, 'moderate')).toBe(false)
  expect(can({ ...actor, roles: ['moderator'] }, 'moderate')).toBe(true)
  expect(() => requireActor({ api: createMockApi(), mode: 'mock' })).toThrow(
    'Sign in',
  )
})
it.each([
  'https://external.example',
  '//evil.test',
  '/\\evil.test',
  '/%2f%2fevil.test',
  '/%5cevil.test',
  '/api/v1/auth/logout',
  '/login',
  '/register',
  '/community\n',
])('rejects unsafe return %s', (value) => {
  expect(validateReturnPath(value)).toBe('/community')
})
it('preserves local navigation for protected actions', () => {
  expect(validateReturnPath('/adopt/applications/new?animal=one')).toBe(
    '/adopt/applications/new?animal=one',
  )
  expect(loginPath('/dashboard/saved')).toBe(
    '/login?returnTo=%2Fdashboard%2Fsaved',
  )
})
it('redirects an anonymous protected route to login with a validated return path', async () => {
  vi.doMock('@/lib/api/server', () => ({
    getServerApi: async () => createMockApi(),
  }))
  const redirect = vi.fn((path: string) => {
    throw new Error(path)
  })
  vi.doMock('next/navigation', () => ({ redirect }))
  const { RequireSession } = await import('@/features/auth/require-session')
  await expect(
    RequireSession({ children: null, returnTo: '/dashboard/saved' }),
  ).rejects.toThrow('/login?returnTo=%2Fdashboard%2Fsaved')
  expect(redirect).toHaveBeenCalledTimes(1)
})
