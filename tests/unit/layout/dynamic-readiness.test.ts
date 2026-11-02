import { describe, expect, it } from 'vitest'
import { isRouteReady } from '@/lib/route-readiness'
const routes = new Set(['/', '/login', '/pets/[slug]'])
describe('explicit implemented route patterns', () => {
  it.each([
    '/pets/milo',
    '/pets/mochi-the-void?period=all#sightings',
    '/login?next=%2Fpets%2Fmilo',
    '/',
  ])('accepts safe implemented %s', (href) =>
    expect(isRouteReady(href, routes)).toBe(true),
  )
  it.each([
    '/pets',
    '/pets/',
    '/pets/milo/edit',
    '/pets/milo/',
    '/pets//',
    '/fundraisers/milo',
    '//evil.test/pets/milo',
    'https://evil.test/pets/milo',
    '/pets/../login',
    '/pets/%2e%2e',
    '/pets/%2Flogin',
    '/pets/%5clogin',
    '/pets/%00',
    '/pets/%252f',
    '/pets/[slug]',
    '/pets/ bad',
    '/pets/%20bad',
    '/pets/%23bad',
    '/pets/%ZZ',
  ])('rejects unsafe or absent %s', (href) =>
    expect(isRouteReady(href, routes)).toBe(false),
  )
})
it('activates dynamic profiles consistently in navigation and marketing', async () => {
  const { destinationHref } = await import('@/components/layout/navigation')
  const { MarketingDestination } =
    await import('@/features/marketing/destination')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { createElement } = await import('react')
  const { guest } = await import('./helpers')
  const { PawPrint } = await import('lucide-react')
  expect(
    destinationHref(
      { href: '/pets/milo?period=week', label: 'Milo', icon: PawPrint },
      guest,
      routes,
    ),
  ).toBe('/pets/milo?period=week')
  expect(
    renderToStaticMarkup(
      createElement(MarketingDestination, {
        href: '/pets/milo',
        children: 'Meet Milo',
      }),
    ),
  ).toContain('href="/pets/milo"')
  expect(
    renderToStaticMarkup(
      createElement(MarketingDestination, {
        href: '/pets/milo/edit',
        children: 'Edit Milo',
      }),
    ),
  ).not.toContain('href=')
})
