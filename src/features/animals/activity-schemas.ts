import { z } from 'zod'
import {
  idSchema,
  imageSchema,
  listQuerySchema,
  pageSchema,
  publicLocationSchema,
  provenanceSchema,
  timestampSchema,
} from '@/lib/api/schemas'
import { postViewSchema } from '@/features/community/schemas'
import { leaderboardRankSchema } from '@/features/kibble/recognition-schema'
export const animalActivityFiltersSchema = listQuerySchema.extend({
  kind: z.enum(['all', 'sightings', 'help', 'tagged']).default('all'),
  sort: z.enum(['priority', 'newest']).default('priority'),
})
export const animalActivitySchema = z.object({
  id: idSchema,
  kind: z.enum(['sighting', 'mission', 'care', 'fundraiser', 'post']),
  createdAt: timestampSchema,
  priority: z.number().int().min(0).max(3),
  label: z.string(),
  title: z.string(),
  text: z.string(),
  href: z.string().startsWith('/'),
  author: z.object({
    userId: idSchema.nullable(),
    displayName: z.string(),
    username: z.string().nullable(),
    avatar: imageSchema.nullable(),
    leaderboardRank: leaderboardRankSchema,
  }),
  media: z.array(imageSchema),
  location: publicLocationSchema.nullable(),
  post: postViewSchema.nullable(),
  provenance: provenanceSchema,
})
export const animalActivityPageSchema = pageSchema(animalActivitySchema).extend(
  {
    summary: z.object({
      taggedPosts: z.number().int().nonnegative(),
      sightings: z.number().int().nonnegative(),
      helpers: z.number().int().nonnegative(),
      followers: z.number().int().nonnegative(),
      openMissions: z.number().int().nonnegative(),
      activeFundraisers: z.number().int().nonnegative(),
    }),
    photos: z.array(
      z.object({
        image: imageSchema,
        href: z.string().startsWith('/'),
        credit: z.string(),
      }),
    ),
    latestSighting: z
      .object({ observedAt: timestampSchema, location: publicLocationSchema })
      .nullable(),
  },
)
export type AnimalActivity = z.infer<typeof animalActivitySchema>
export type AnimalActivityPage = z.infer<typeof animalActivityPageSchema>
export type AnimalActivityFilters = z.input<typeof animalActivityFiltersSchema>
