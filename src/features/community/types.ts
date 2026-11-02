import type { z } from 'zod'
import type * as schemas from './schemas'
export type PostInput = z.infer<typeof schemas.postInputSchema>
export type Post = z.infer<typeof schemas.postSchema>
export type PostFilters = z.input<typeof schemas.postFiltersSchema>
export type CommentInput = z.infer<typeof schemas.commentInputSchema>
export type Comment = z.infer<typeof schemas.commentSchema>
