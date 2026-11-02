'use client'
import type { QueryClient, InfiniteData } from '@tanstack/react-query'
import { queryKeys } from '@/lib/api/keys'
import type { Page } from '@/types/common'
import type { Post } from './types'
type CachedPosts = Post | Page<Post> | InfiniteData<Page<Post>>
function changeData(
  value: CachedPosts,
  id: string,
  change: (post: Post) => Post | null,
): CachedPosts {
  if ('pages' in value)
    return {
      ...value,
      pages: value.pages.map(
        (page) => changeData(page, id, change) as Page<Post>,
      ),
    }
  if ('items' in value)
    return {
      ...value,
      items: value.items.flatMap((post) => {
        if (post.id !== id) return [post]
        const next = change(post)
        return next ? [next] : []
      }),
    }
  return value.id === id ? (change(value) ?? value) : value
}
export async function optimisticPostChange<T>(
  client: QueryClient,
  scope: string,
  id: string,
  change: (post: Post) => Post | null,
  operation: () => Promise<T>,
): Promise<T> {
  const key = queryKeys(scope).all('community')
  await client.cancelQueries({ queryKey: key })
  const before = client.getQueriesData<CachedPosts>({ queryKey: key })
  for (const [queryKey, data] of before)
    if (data) client.setQueryData(queryKey, changeData(data, id, change))
  try {
    const result = await operation()
    if (result && typeof result === 'object' && 'id' in result) {
      for (const [queryKey] of before)
        client.setQueryData<CachedPosts>(queryKey, (data) =>
          data ? changeData(data, id, () => result as unknown as Post) : data,
        )
    }
    return result
  } catch (error) {
    // Restore only this post so another post's concurrent optimistic operation is preserved.
    for (const [queryKey, data] of before)
      if (data) {
        const find = (value: CachedPosts): Post | undefined =>
          'pages' in value
            ? value.pages
                .flatMap((page) => page.items)
                .find((post) => post.id === id)
            : 'items' in value
              ? value.items.find((post) => post.id === id)
              : value.id === id
                ? value
                : undefined
        const old = find(data)
        if (old)
          client.setQueryData<CachedPosts>(queryKey, (current) =>
            current ? changeData(current, id, () => old) : current,
          )
      }
    throw error
  }
}
/** Insert only into the unfiltered chronological feed. Pending is never optimistically published. */
export function stagePost(client: QueryClient, scope: string, post: Post) {
  const key = queryKeys(scope).list('community', { tab: 'for_you' })
  client.setQueryData<InfiniteData<Page<Post>>>(key, (current) =>
    current
      ? {
          ...current,
          pages: current.pages.map((page, index) =>
            index ? page : { ...page, items: [post, ...page.items] },
          ),
        }
      : current,
  )
  return async (operation: () => Promise<Post>) => {
    try {
      return await optimisticPostChange(
        client,
        scope,
        post.id,
        (p) => p,
        operation,
      )
    } catch (error) {
      client.setQueryData<InfiniteData<Page<Post>>>(key, (current) =>
        current
          ? (changeData(current, post.id, () => null) as InfiniteData<
              Page<Post>
            >)
          : current,
      )
      throw error
    }
  }
}
export async function invalidateCommunity(client: QueryClient, scope: string) {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys(scope).all('community') }),
    client.invalidateQueries({ queryKey: queryKeys(scope).all('animals') }),
    client.invalidateQueries({ queryKey: queryKeys(scope).all('dashboard') }),
  ])
}
