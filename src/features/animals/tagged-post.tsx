'use client'
import { DataState } from '@/components/shared/data-state'
import { PostCard } from '@/features/community/post-card'
import { usePost } from '@/features/community/queries'
import type { Post } from '@/features/community/types'
import type { LinkedOption } from '@/features/community/linked-entity-picker'
/** Seed the maintained community query so reactions, saves and edits update this embedded story. */
export function AnimalTaggedPost({
  post,
  scope,
  options,
}: {
  post: Post
  scope: string
  options: LinkedOption[]
}) {
  const query = usePost(post.id, { post, scope })
  if (!query.data)
    return (
      <DataState
        state={query.isError ? 'error' : 'loading'}
        retry={() => void query.refetch()}
        errorMessage="This community story couldn’t load. Try again."
      />
    )
  if (query.data.moderation !== 'published') return null
  const primary = options[0]?.ref
  const displayed = primary
    ? {
        ...query.data,
        linkedEntities: [...query.data.linkedEntities].sort(
          (a, b) =>
            Number(b.ref.kind === primary.kind && b.ref.id === primary.id) -
            Number(a.ref.kind === primary.kind && a.ref.id === primary.id),
        ),
      }
    : query.data
  return <PostCard post={displayed} options={options} />
}
