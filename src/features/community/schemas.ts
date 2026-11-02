import { z } from 'zod'
import {
  idSchema,
  resourceRefSchema,
  moderationStateSchema,
  listQuerySchema,
  imageSchema,
  baseSchema,
  versionSchema,
} from '@/lib/api/schemas'

export const postInputSchema = z.object({
  text: z.string().min(1).max(5000),
  type: z.enum([
    'story',
    'photo',
    'sighting',
    'feeding',
    'rescue',
    'adoption',
    'help',
  ]),
  mediaIds: z.array(idSchema),
  refs: z.array(resourceRefSchema),
})
export const postSchema = baseSchema.extend({
  authorId: idSchema,
  text: z.string(),
  type: postInputSchema.shape.type,
  media: z.array(imageSchema),
  refs: z.array(resourceRefSchema),
  moderation: moderationStateSchema,
  reactionCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  version: versionSchema,
})
export const postFiltersSchema = listQuerySchema.extend({
  feed: z.enum(['for_you', 'following', 'nearby']).optional(),
  authorId: idSchema.optional(),
  animalId: idSchema.optional(),
  hordeId: idSchema.optional(),
  areaId: idSchema.optional(),
})
export const commentInputSchema = z.object({
  text: z.string().min(1).max(2000),
})
export const commentSchema = baseSchema.extend({
  ref: resourceRefSchema,
  authorId: idSchema,
  text: z.string(),
  moderation: moderationStateSchema,
})
