'use client'
import { Bell } from 'lucide-react'
import { useRef, useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/shared/data-state'
import { isRouteReady } from '@/lib/route-readiness'
import { READY_ROUTES } from '@/components/layout/navigation'
import type { Notification } from './types'
export function NotificationItems({
  items,
  onRead,
  pending,
}: {
  items: Notification[]
  onRead?: (ids: string[]) => void
  pending?: boolean
}) {
  return (
    <ul
      className={
        'notification-list list-none [margin:1rem_0] p-0 [&_li]:py-5 [&_li]:[border-bottom:1px_solid_var(--border)] [&_p]:my-3 [&_p]:max-w-[68ch] [.app-shell_&_>_li]:min-w-0 [.app-shell_&_>_li]:bg-card [.app-shell_&_>_li]:[border:1px_solid_var(--social-line)] [.app-shell_&_>_li]:rounded-2xl [.app-shell_&_>_li]:[overflow-wrap:anywhere] [.app-shell_&_>_li]:p-5 [.app-shell_&_>_li]:m-0 [.app-shell_&]:p-0 [.app-shell_&]:list-none [.app-shell_&]:grid [.app-shell_&]:gap-3.5'
      }
    >
      {items.map((item) => (
        <li
          key={item.id}
          className={
            item.readAt
              ? 'activity-read'
              : 'activity-unread [&_strong]:text-[color:var(--teal)] [.notification-list_&]:bg-[#fff9f0]'
          }
        >
          <div
            className={
              'activity-meta flex flex-wrap justify-between gap-2 text-sm [.app-shell_.notification-list_&]:flex [.app-shell_.notification-list_&]:flex-wrap [.app-shell_.notification-list_&]:gap-2.5 [.app-shell_.notification-list_&]:items-center [.notification-list_&_>_svg]:shrink-0 [.notification-list_&_>_svg]:text-[color:var(--teal)]'
            }
          >
            <Bell size={20} aria-hidden="true" />
            <strong>{item.readAt ? 'Read' : 'Unread'}</strong>
            <time dateTime={item.createdAt}>
              {new Intl.DateTimeFormat('en-PH', {
                dateStyle: 'medium',
                timeZone: 'Asia/Manila',
              }).format(new Date(item.createdAt))}
            </time>
          </div>
          <p>{item.message}</p>
          <div
            className={
              'profile-link-row flex flex-wrap items-center gap-3 mt-4 [.animal-action-bar_&]:mt-0 max-[48rem]:[.app-shell_.notification-list_&]:flex-wrap [.pet-social-actions_&]:flex [.pet-social-actions_&]:flex-wrap [.pet-social-actions_&]:gap-2'
            }
          >
            {item.destinationHref &&
            isRouteReady(item.destinationHref, READY_ROUTES) ? (
              <Link
                href={item.destinationHref}
                onClick={() => {
                  if (!item.readAt) onRead?.([item.id])
                }}
              >
                Open activity
              </Link>
            ) : (
              <span>Activity destination unavailable.</span>
            )}
            {!item.readAt && onRead && (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => onRead([item.id])}
              >
                Mark as read
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
export function NotificationList() {
  const { session } = useSession()
  const client = useQueryClient()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const query = useInfiniteQuery({
    queryKey: queryKeys(session.cacheScope).list('notifications'),
    queryFn: ({ pageParam, signal }) =>
      getBrowserApi().notifications.list(
        { limit: 12, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!session.actor,
  })
  const items = [
    ...new Map(
      query.data?.pages
        .flatMap((page) => page.items)
        .map((item) => [item.id, item]) ?? [],
    ).values(),
  ]
  async function markRead(ids: string[]) {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await getBrowserApi().notifications.markRead(ids)
      await Promise.all(
        ['notifications', 'dashboard'].map((domain) =>
          client.invalidateQueries({
            queryKey: queryKeys(session.cacheScope).all(domain),
          }),
        ),
      )
      router.refresh()
    } catch {
      setError('Couldn’t mark activity as read. Please try again.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <DataState
      state={
        query.isPending
          ? 'loading'
          : query.isError
            ? 'error'
            : items.length
              ? 'ready'
              : 'empty'
      }
      emptyDescription="No activity notifications yet. Follow pets and people to stay connected."
      errorMessage="Activity couldn’t load. Please try again."
      retry={() => void query.refetch()}
    >
      {error && <p role="alert">{error}</p>}
      {items.some((i) => !i.readAt) && (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            void markRead(items.filter((i) => !i.readAt).map((i) => i.id))
          }
        >
          Mark visible activity as read
        </Button>
      )}
      <NotificationItems
        items={items}
        pending={pending}
        onRead={(ids) => void markRead(ids)}
      />
      {query.hasNextPage && (
        <Button
          variant="outline"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage
            ? 'Loading activity…'
            : 'Load more activity'}
        </Button>
      )}
    </DataState>
  )
}
