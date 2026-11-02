'use client'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
export function useUnreadCount(enabled = true) {
  const { session } = useSession()
  return useQuery({
    queryKey: queryKeys(session.cacheScope).detail(
      'notifications',
      'unread-count',
    ),
    queryFn: ({ signal }) =>
      getBrowserApi().notifications.unreadCount({ signal }),
    enabled: enabled && !!session.actor,
    refetchInterval: 30_000,
  })
}
