import { expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { seed } from '@/data/fixtures'
import { toPublicAnimal } from '@/lib/server/projections'
import { animalMetadata } from '@/lib/seo/metadata'
import { animalJsonLd, safeJsonLd } from '@/lib/seo/json-ld'
import { siteOrigin } from '@/lib/seo/origin'
it('selects canonical story metadata and escapes script termination', () => {
  const animal = toPublicAnimal({
    ...seed.animals[0],
    slug: 'mochi-the-void',
    name: '</script><script>alert(1)</script>',
  })
  expect(animalMetadata(animal).alternates?.canonical).toBe(
    `${siteOrigin}/pets/mochi-the-void`,
  )
  expect(animalMetadata(animal).robots).toMatchObject({ index: false })
  expect(JSON.stringify(animalJsonLd(animal))).not.toContain('applicant')
  expect(safeJsonLd(animalJsonLd(animal))).not.toContain('<')
  expect(
    JSON.parse(safeJsonLd(animalJsonLd(animal)))['@graph'][0]['@type'],
  ).toBe('WebPage')
})
it('uses only standard truthful structured-data types and rejects unsafe origins', async () => {
  const animal = toPublicAnimal(seed.animals[0])
  expect(animalJsonLd(animal)['@graph'].map((node) => node['@type'])).toEqual([
    'WebPage',
    'Thing',
    'BreadcrumbList',
  ])
  const { getSiteOrigin } = await import('@/lib/seo/origin')
  for (const unsafe of [
    'javascript:alert(1)',
    'https://user:pass@example.test',
    'https://example.test/private',
    'https://example.test?token=private',
  ])
    expect(() => getSiteOrigin(unsafe)).toThrow()
  expect(getSiteOrigin('https://example.test/')).toBe('https://example.test')
})
