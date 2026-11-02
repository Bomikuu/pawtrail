import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('server-only', () => ({}))
import { seed } from '@/data/fixtures'
import { createMockApi } from '@/lib/api/adapters/mock'
import { animalMetadata } from '@/lib/seo/metadata'
import { animalJsonLd } from '@/lib/seo/json-ld'
import { PublicAnimalStory } from '@/features/animals/profile-header'
it('rejects_private_fields_in_all_public_outputs', async () => {
  const data = structuredClone(seed)
  const privateSighting = {
    ...data.sightings[0],
    exactLatitude: 7.123456789,
    exactLongitude: 125.987654321,
  }
  data.sightings[0] = privateSighting
  data.users[0].settings.discoverable = false
  const animal = await createMockApi(data).animals.get(data.animals[0].slug)
  const html = renderToStaticMarkup(<PublicAnimalStory animal={animal} />)
  expect(html).not.toContain(privateSighting.exactLatitude.toString())
  const outputs = JSON.stringify([
    animal,
    animalMetadata(animal),
    animalJsonLd(animal),
  ])
  for (const secret of [
    'privateNotes',
    'exactLatitude',
    'email',
    'settings',
    'applicant',
  ])
    expect(outputs).not.toContain(secret)
  expect(animal.helpers[0]).toEqual({
    displayName: 'Anonymous helper',
    userId: null,
  })
  expect(animal.helperIds).not.toContain(data.users[0].id)
})
