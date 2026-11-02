import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/server', async () => {
  const { createMockApi } = await import('@/lib/api/adapters/mock')
  return { getServerApi: async () => createMockApi() }
})
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
import Page, { generateMetadata } from '@/app/(public)/pets/[slug]/page'
import { Providers } from '@/components/providers'
import { guest } from '../layout/helpers'
import { getPublicAnimal } from '@/features/animals/server'
it('server renders the complete public route with list, help and discussion targets', async () => {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  const props = {
    params: Promise.resolve({ slug: 'milo' }),
    searchParams: Promise.resolve({ period: 'week' }),
  }
  const page = await Page(props)
  const html = renderToStaticMarkup(
    <Providers initialSession={guest}>{page}</Providers>,
  )
  expect(html).toContain('Milo')
  for (const id of ['help', 'sightings', 'discussion'])
    expect(html).toContain(`id="${id}"`)
  expect(html).toContain('application/ld+json')
  expect(html).toContain('Sign in to save')
  expect(html).toContain('Illustrative')
  expect(html).not.toContain('exactLatitude')
  expect((await generateMetadata(props)).alternates?.canonical).toContain(
    '/pets/milo',
  )
})
it('routes absent public records through notFound for pages and metadata', async () => {
  await expect(getPublicAnimal('absent')).rejects.toThrow('NEXT_NOT_FOUND')
  await expect(
    generateMetadata({
      params: Promise.resolve({ slug: 'absent' }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow('NEXT_NOT_FOUND')
})
