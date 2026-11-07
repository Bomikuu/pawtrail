import { expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderSession, guest } from '../layout/helpers'
import { createMockApi } from '@/lib/api/adapters/mock'
import UserPage, {
  generateMetadata,
} from '@/app/(public)/users/[username]/page'
import { READY_ROUTES } from '@/components/layout/navigation'
import { isRouteReady } from '@/lib/route-readiness'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/server', () => ({
  getServerApi: async () => createMockApi(),
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  useRouter: () => ({ refresh: vi.fn() }),
}))
it('renders identity and stories from the server, returns 404 and activates only implemented public/notification routes', async () => {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  renderSession(
    await UserPage({
      params: Promise.resolve({ username: 'sample-helper-2' }),
      searchParams: Promise.resolve({}),
    }),
    guest,
  )
  expect(
    screen.getByRole('heading', { name: 'Sample Helper 2', level: 1 }),
  ).toBeInTheDocument()
  expect(screen.getByText(/Sample adoption story/)).toBeInTheDocument()
  await expect(
    UserPage({
      params: Promise.resolve({ username: 'missing' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND')
  const metadata = await generateMetadata({
    params: Promise.resolve({ username: 'sample-helper-2' }),
  })
  expect(metadata.robots).toEqual({ index: false, follow: false })
  expect(metadata.alternates.canonical).toMatch(/\/users\/sample-helper-2$/)
  expect(isRouteReady('/users/sample-helper-2', READY_ROUTES)).toBe(true)
  expect(isRouteReady('/dashboard/notifications', READY_ROUTES)).toBe(true)
  expect(isRouteReady('/users/sample-helper-2/edit', READY_ROUTES)).toBe(false)
  expect(isRouteReady('/dashboard/profile', READY_ROUTES)).toBe(false)
})
