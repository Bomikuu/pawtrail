'use client'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Page } from '@/types/common'
import type { Post, PostFilters } from './types'
export function deduplicatePosts(pages: Page<Post>[]): Post[] {
  const found = new Map<string, Post>()
  for (const page of pages)
    for (const post of page.items)
      if (!found.has(post.id)) found.set(post.id, post)
  return [...found.values()]
}
export function useFeed(
  filters: PostFilters,
  initial?: { page: Page<Post>; scope: string },
  enabled = true,
) {
  const { session } = useSession()
  return useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('community', filters),
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().community.list(
        { ...filters, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData:
      initial?.scope === session.cacheScope
        ? { pages: [initial.page], pageParams: [undefined] }
        : undefined,
    enabled,
  })
}
export function usePost(id: string, initial?: { post: Post; scope: string }) {
  const { session } = useSession()
  return useQuery({
    queryKey: queryKeys(session.cacheScope).detail('community', id),
    queryFn: ({ signal }) => getBrowserApi().community.get(id, { signal }),
    initialData:
      initial?.scope === session.cacheScope ? initial.post : undefined,
  })
}
