import { generateMetadata } from '@/app/(marketing)/page'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { LandingPage } from '@/features/marketing/landing-page'
import {
  getCommunitySampleStats,
  loadLandingData,
} from '@/features/marketing/data'
import { createMockApi } from '@/lib/api/adapters/mock'
import { seed } from '@/data/fixtures'

const readyRoutes = new Set([
  '/',
  '/explore',
  '/adopt',
  '/fundraisers',
  '/community',
  '/register',
  '/login',
  '/animals/milo',
  '/animals/luna',
  '/fundraisers/sample-care-1',
])
async function data() {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  return loadLandingData(createMockApi())
}
describe('PawTrail introduction', () => {
  it('introduces every core action with honest sample statistics', async () => {
    render(<LandingPage data={await data()} readyRoutes={readyRoutes} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Every Paw Has a Story.',
    )
    for (const [label, href] of Object.entries({
      'Explore the Map': '/explore',
      'Find Your Companion': '/adopt',
      'Explore Animals': '/explore',
      'Start Matching': '/adopt',
      'Support a Fundraiser': '/fundraisers',
      'Join the Community': '/community',
    }))
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      )
    for (const title of [
      'Discover Animals Near You',
      'Find Your Perfect Companion',
      'Every Paw Deserves Help',
      'Become a PawPal',
      'Stories Worth Sharing',
    ])
      expect(screen.getByRole('heading', { name: title })).toBeVisible()
    expect(screen.getAllByTestId('sample-statistic')).toHaveLength(4)
    for (const stat of screen.getAllByTestId('sample-statistic'))
      expect(stat).toHaveTextContent(/sample/i)
    expect(screen.getByText(/non-cash/)).toBeVisible()
    expect(
      screen
        .getAllByRole('img')
        .every((img) =>
          Boolean(img.getAttribute('alt') || img.getAttribute('aria-label')),
        ),
    ).toBe(true)
  })
  it('keeps unfinished destinations unavailable in production', async () => {
    render(<LandingPage data={await data()} />)
    expect(
      screen.queryByRole('link', { name: 'Explore the Map' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Explore the Map — Coming soon'),
    ).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('link', { name: 'Join PawTrail' })).toHaveAttribute(
      'href',
      '/register',
    )
  })
  it('retains real CTAs when previews are empty or fail', async () => {
    const api = createMockApi({
      ...seed,
      animals: [],
      fundraisers: [],
      posts: [],
    })
    api.fundraisers.list = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
    render(
      <LandingPage
        data={await loadLandingData(api)}
        readyRoutes={readyRoutes}
      />,
    )
    expect(
      screen.getByText('Animal previews are quiet right now.'),
    ).toBeVisible()
    expect(screen.getByText('Campaign previews could not load.')).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Explore Animals' }),
    ).toHaveAttribute('href', '/explore')
    expect(
      screen.getByRole('link', { name: 'Support a Fundraiser' }),
    ).toHaveAttribute('href', '/fundraisers')
    expect(
      screen.getAllByRole('link', { name: 'Reload previews' }).length,
    ).toBeGreaterThan(0)
  })
  it('uses complete fixtures for all four statistics, including honest zero outcomes', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
    expect(await getCommunitySampleStats()).toEqual({
      kind: 'sample',
      animalsDiscovered: 20,
      animalsAdopted: 0,
      communityHelpers: 20,
      successfulFundraisers: 0,
    })
  })
  it('does not invent real totals from paginated records', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'false')
    vi.stubEnv('DJANGO_API_BASE_URL', 'https://backend.example')
    await expect(getCommunitySampleStats()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
    })
  })
})

it('serves real local illustrative pet photos with reserved dimensions', async () => {
  render(<LandingPage data={await data()} readyRoutes={readyRoutes} />)
  const photos = screen
    .getAllByRole('img')
    .filter((image) => image.getAttribute('src')?.startsWith('/images/pets/'))
  expect(new Set(photos.map((image) => image.getAttribute('src')))).toEqual(
    new Set(['/images/pets/milo-dog.jpg', '/images/pets/luna-cat.jpg']),
  )
  for (const image of photos) {
    expect(image).toHaveAttribute('width', '640')
    expect(image).toHaveAttribute('height', '480')
    expect(image.getAttribute('alt')).toMatch(/illustrative stock photograph/)
  }
})
it('maps animal, campaign, and story previews to their specified routes', async () => {
  const routes = new Set([
    ...readyRoutes,
    '/community/post-1',
    '/community/post-2',
    '/community/post-9',
    '/fundraisers/sample-care-2',
  ])
  const { container } = render(
    <LandingPage data={await data()} readyRoutes={routes} />,
  )
  for (const href of [
    '/animals/milo',
    '/animals/luna',
    '/fundraisers/sample-care-1',
    '/community/post-1',
  ])
    expect(container.querySelector(`a[href="${href}"]`)).toBeInTheDocument()
  expect(
    container.querySelector('a[href*="/community/posts/"]'),
  ).not.toBeInTheDocument()
})

it('keeps mock public landing content out of search indexes', () => {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  expect(generateMetadata().robots).toEqual({ index: false, follow: false })
})
