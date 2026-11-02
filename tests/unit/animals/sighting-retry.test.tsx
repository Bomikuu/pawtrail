import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/server', async () => {
  const { createMockApi } = await import('@/lib/api/adapters/mock')
  return {
    getServerApi: async () => {
      const api = createMockApi()
      api.sightings.list = async () => {
        throw new Error('offline')
      }
      return api
    },
  }
})
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: state.refresh }),
}))
import Page from '@/app/(public)/pets/[slug]/page'
import { Providers } from '@/components/providers'
import { guest } from '../layout/helpers'
it('retries failed server sightings with router refresh instead of fragment navigation', async () => {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  const page = await Page({
    params: Promise.resolve({ slug: 'milo' }),
    searchParams: Promise.resolve({ period: 'week' }),
  })
  render(<Providers initialSession={guest}>{page}</Providers>)
  expect(screen.getByRole('alert')).toHaveTextContent('Sightings couldn’t load')
  fireEvent.click(screen.getByRole('button', { name: 'Reload sightings' }))
  expect(state.refresh).toHaveBeenCalledOnce()
  expect(
    screen.queryByRole('link', { name: 'Reload sightings' }),
  ).not.toBeInTheDocument()
})
