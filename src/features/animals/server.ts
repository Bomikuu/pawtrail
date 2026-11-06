import 'server-only'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { ApiError } from '@/lib/api/errors'
import { animalProfileSchema } from './schemas'
import type { AnimalProfile } from './types'
/** React cache is request scoped; never share viewer read state across requests. */
export const getPublicAnimal = cache(
  async (slug: string): Promise<AnimalProfile> => {
    try {
      const animal = animalProfileSchema.parse(
        await (await getServerApi()).animals.get(slug),
      )
      if (animal.reviewState && animal.reviewState !== 'published') notFound()
      return animal
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound()
      throw error
    }
  },
)

/** Reuse the initial public activity read between the persistent layout and page. */
export const getPetActivity = cache(
  async (
    slug: string,
    kind: 'all' | 'sightings' | 'help' | 'tagged' = 'all',
    sort: 'priority' | 'newest' = 'priority',
    cursor?: string,
  ) => {
    return (await getServerApi()).animals.activity(slug, {
      kind,
      sort,
      cursor,
      limit: 12,
    })
  },
)
