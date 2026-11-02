import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(
      public element: ReactElement,
      public options: unknown,
    ) {}
  },
}))
vi.mock('@/features/animals/server', async () => {
  const { seed } = await import('@/data/fixtures')
  const { toPublicAnimal } = await import('@/lib/server/projections')
  return { getPublicAnimal: async () => toPublicAnimal(seed.animals[0]) }
})
import Image from '@/app/(public)/pets/[slug]/opengraph-image'
it('generates a share image exclusively from projected public identity', async () => {
  const image = (await Image({
    params: Promise.resolve({ slug: 'milo' }),
  })) as unknown as { element: ReactElement; options: unknown }
  expect(image.options).toEqual({ width: 1200, height: 630 })
  const html = renderToStaticMarkup(image.element)
  expect(html).toContain('Milo')
  expect(html).toContain('Illustrative')
  for (const field of [
    'privateNotes',
    'exactLatitude',
    'applicant',
    'ownerId',
    'viewerSaved',
  ])
    expect(html).not.toContain(field)
})
