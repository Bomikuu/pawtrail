import { expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/keys'
import { optimisticPostChange } from '@/features/community/mutations'
import type { Post } from '@/features/community/types'
const post = { id: 'post-1', reactionCount: 2, viewerReacted: false } as Post
it('rolls_back_failed_reaction', async () => {
  const client = new QueryClient()
  const key = queryKeys('test').detail('community', post.id)
  client.setQueryData(key, post)
  const initialCount = post.reactionCount
  const operation = vi.fn().mockRejectedValue(new Error('offline'))
  await expect(
    optimisticPostChange(
      client,
      'test',
      post.id,
      (p) => ({
        ...p,
        reactionCount: p.reactionCount + 1,
        viewerReacted: true,
      }),
      operation,
    ),
  ).rejects.toThrow('offline')
  expect(client.getQueryData<Post>(key)?.reactionCount).toBe(initialCount)
})
it('reconciles a staged pending ID with the persisted ID and removes failed placeholders', async () => {
  const { stagePost } = await import('@/features/community/mutations')
  const client = new QueryClient()
  const key = queryKeys('test').list('community', { tab: 'for_you' })
  client.setQueryData(key, {
    pages: [{ items: [], count: 0, nextCursor: null }],
    pageParams: [undefined],
  })
  await stagePost(client, 'test', {
    ...post,
    id: 'pending:one',
    moderation: 'pending',
  })(async () => ({ ...post, id: 'server-one', moderation: 'pending' }))
  type Cached = { pages: { items: Post[] }[] }
  expect(
    client.getQueryData<Cached>(key)?.pages[0].items.map((p) => p.id),
  ).toEqual(['server-one'])
  await expect(
    stagePost(client, 'test', { ...post, id: 'pending:two' })(async () => {
      throw new Error('offline')
    }),
  ).rejects.toThrow('offline')
  expect(
    client.getQueryData<Cached>(key)?.pages[0].items.map((p) => p.id),
  ).toEqual(['server-one'])
})
