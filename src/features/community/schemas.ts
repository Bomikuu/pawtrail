import { z } from 'zod'
import { leaderboardRankSchema } from '@/features/kibble/recognition-schema'
import { mediaAssetSchema } from '@/features/media/schemas'
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
  text: z.string().trim().min(1).max(2000),
  type: z.enum([
    'story',
    'photo',
    'sighting',
    'feeding',
    'rescue',
    'adoption',
    'help',
  ]),
  mediaIds: z.array(idSchema).max(6),
  refs: z
    .array(resourceRefSchema)
    .refine(
      (refs) =>
        new Set(refs.map((ref) => `${ref.kind}:${ref.id}`)).size ===
        refs.length,
      'Choose each linked record once',
    ),
  expectedVersion: versionSchema.optional(),
})
export const postUpdateInputSchema = postInputSchema.required({
  expectedVersion: true,
})
export const postSchema = baseSchema.extend({
  authorId: idSchema.nullable(),
  text: z.string(),
  type: postInputSchema.shape.type,
  media: z.array(imageSchema),
  refs: z.array(resourceRefSchema),
  moderation: moderationStateSchema,
  reactionCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  version: versionSchema,
})
export const ownerPostMediaSchema = mediaAssetSchema.extend({
  visibility: z.literal('private'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  url: z.string().regex(/^\/api\/v1\/media\/[a-f0-9-]{36}\/content$/),
  sensitive: z.boolean(),
})
/** Public fields are an allowlist; private preview assets never belong to postSchema. */
export const publicConversationPersonSchema = z.object({
  id: idSchema,
  displayName: z.string(),
  username: z.string(),
  avatar: imageSchema.nullable(),
})
const bylineBadgesSchema = z
  .array(z.object({ id: idSchema, label: z.string() }))
  .max(6)
  .default([])
export const postViewSchema = postSchema
  .extend({
    author: z.object({
      badges: bylineBadgesSchema,
      leaderboardRank: leaderboardRankSchema,
      displayName: z.string(),
      username: z.string().nullable(),
      avatar: imageSchema.nullable().optional(),
    }),
    participants: z.array(publicConversationPersonSchema).max(4).default([]),
    participantCount: z.number().int().nonnegative().default(0),
    linkedEntities: z.array(
      z.object({ ref: resourceRefSchema, title: z.string(), href: z.string() }),
    ),
    viewerReacted: z.boolean(),
    viewerSaved: z.boolean(),
    viewerOwns: z.boolean(),
    ownerMedia: z.array(ownerPostMediaSchema).optional(),
  })
  .refine(
    (post) =>
      post.ownerMedia === undefined ||
      (post.viewerOwns && ['pending', 'rejected'].includes(post.moderation)),
    'Private previews require an owner unpublished projection',
  )
export const postFiltersSchema = listQuerySchema.extend({
  tab: z.enum(['for_you', 'following', 'nearby']).optional(),
  authorId: idSchema.optional(),
  animalId: idSchema.optional(),
  hordeId: idSchema.optional(),
  areaId: idSchema.optional(),
  saved: z.boolean().optional(),
})
export const commentInputSchema = z.object({
  text: z.string().trim().min(1).max(1000),
})
export const commentRecordSchema = baseSchema.extend({
  ref: resourceRefSchema,
  authorId: idSchema,
  text: z.string(),
  moderation: moderationStateSchema,
  version: versionSchema.default(1),
})
export const commentSchema = commentRecordSchema.extend({
  authorId: idSchema.nullable(),
  author: z.object({
    badges: bylineBadgesSchema,
    leaderboardRank: leaderboardRankSchema,
    displayName: z.string(),
    username: z.string().nullable(),
    avatar: imageSchema.nullable().optional(),
  }),
  viewerOwns: z.boolean(),
})
