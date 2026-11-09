import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { notFound } from 'next/navigation'
import { getApiConfig } from '@/lib/api/config'
import { captureAnimalSchema, photoSchema } from '@/features/capture/schemas'
const page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    count: z.number(),
    nextCursor: z.string().nullable(),
  })
export const databaseAnimalSchema = captureAnimalSchema
export type DatabaseAnimal = z.infer<typeof databaseAnimalSchema>
export const databaseActivitySchema = z.object({
  id: z.string(),
  animal: databaseAnimalSchema,
  author: z.object({ displayName: z.string(), username: z.string() }),
  notes: z.string(),
  observedAt: z.string().nullable(),
  areaLabel: z.string(),
  photo: photoSchema.nullable(),
})
async function read<T extends z.ZodType>(
  path: string,
  schema: T,
): Promise<z.output<T>> {
  const config = getApiConfig()
  if (config.mode !== 'real')
    throw new Error('Database content requires the real backend.')
  const response = await fetch(
    config.djangoOrigin.replace(/\/$/, '') + '/' + path,
    { cache: 'no-store', signal: AbortSignal.timeout(10000) },
  )
  if (response.status === 404) notFound()
  if (!response.ok)
    throw new Error('Database records could not load. Please try again.')
  return schema.parse(await response.json())
}
export const databaseAnimals = cache(() =>
  read('animals?limit=50', page(databaseAnimalSchema)),
)
export const databaseAnimal = cache((slug: string) =>
  read('animal-profiles/' + encodeURIComponent(slug), databaseAnimalSchema),
)
export const databaseActivity = cache(() =>
  read('community?limit=50', page(databaseActivitySchema)),
)
