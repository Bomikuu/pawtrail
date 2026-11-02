import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))
import { seed } from '@/data/fixtures'
import { toPublicAnimal } from '@/lib/server/projections'
import { PublicAnimalStory } from '@/features/animals/profile-header'
it('renders_public_story_without_map_or_session', () => {
  const animal = toPublicAnimal({ ...seed.animals[0], name: 'Mochi' })
  const html = renderToStaticMarkup(<PublicAnimalStory animal={animal} />)
  expect(html).toContain('Mochi')
  expect(html).toContain(animal.description)
  expect(html).not.toContain('maps.googleapis')
})
