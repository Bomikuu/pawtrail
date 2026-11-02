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
      return animalProfileSchema.parse(
        await (await getServerApi()).animals.get(slug),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound()
      throw error
    }
  },
)
