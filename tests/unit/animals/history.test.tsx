import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))
import { seed } from '@/data/fixtures'
import { SightingHistory } from '@/features/animals/activity-timeline'
import { createMockApi } from '@/lib/api/adapters/mock'
it('keeps time filtering and historical list independent of maps', async () => {
  const api = createMockApi()
  const all = await api.sightings.list({ animalId: 'animal-1' })
  const future = await api.sightings.list({
    animalId: 'animal-1',
    since: '2099-01-01T00:00:00Z',
  })
  expect(all.items).toHaveLength(1)
  expect(future.items).toHaveLength(0)
  const html = renderToStaticMarkup(
    <SightingHistory
      sightings={all.items}
      slug="milo"
      period="all"
      nextCursor="cursor"
    />,
  )
  expect(html).toContain(seed.sightings[0].observation)
  expect(html).toContain('?period=week#sightings')
  expect(html).toContain('Older sightings')
  expect(html).not.toContain('maps.googleapis')
})
