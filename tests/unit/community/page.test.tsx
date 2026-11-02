import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/server', async () => {
  const { createMockApi } = await import('@/lib/api/adapters/mock')
  return { getServerApi: async () => createMockApi() }
})
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
import Page from '@/app/(public)/community/page'
import Detail from '@/app/(public)/community/[id]/page'
import { Providers } from '@/components/providers'
import { guest } from '../layout/helpers'
it('server renders the first stories and connected pet identity before hydration', async () => {
  const page = await Page()
  const html = renderToStaticMarkup(
    <Providers initialSession={{ ...guest, cacheScope: 'anonymous:mock' }}>
      {page}
    </Providers>,
  )
  expect(html).toContain('The community journal')
  expect(html).toContain('Sample rescue story')
  expect(html.indexOf('Sample rescue story')).toBeLessThan(
    html.indexOf('Sample update 4'),
  )
  expect(html).toContain('/images/pets/milo-dog.jpg')
  expect(html).toContain('/pets/milo')
  expect(html).toContain('For you is a chronological feed')
})
it('uses a real not-found response for absent detail IDs', async () => {
  await expect(
    Detail({ params: Promise.resolve({ id: 'absent' }) }),
  ).rejects.toThrow('NEXT_NOT_FOUND')
})
