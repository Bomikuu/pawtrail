'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/session-provider'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import type { Notification } from './types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { isRouteReady } from '@/lib/route-readiness'
import { READY_ROUTES } from '@/components/layout/navigation'
export function NotificationMenu({ unread }: { unread: string }) {
  const { session } = useSession()
  const [open, setOpen] = useState(false)
  const client = useQueryClient()
  async function openActivity(item: Notification) {
    if (item.readAt) return
    try {
      await getBrowserApi().notifications.markRead([item.id])
      await Promise.all(
        ['notifications', 'dashboard'].map((domain) =>
          client.invalidateQueries({
            queryKey: queryKeys(session.cacheScope).all(domain),
          }),
        ),
      )
    } catch {
      toast.error(
        'Couldn’t mark activity as read. Open Your activity to retry.',
      )
    }
  }
  const query = useQuery({
    queryKey: queryKeys(session.cacheScope).list('notifications', { limit: 5 }),
    queryFn: ({ signal }) =>
      getBrowserApi().notifications.list({ limit: 5 }, { signal }),
    enabled: open && !!session.actor,
  })
  return (
    <div className="notification-menu">
      <Link
        className="utility-link notification-link"
        aria-label={`Notifications, ${unread}`}
        href="/dashboard/notifications"
      >
        <Bell size={20} aria-hidden="true" />
        <span>{unread}</span>
      </Link>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" aria-label="Open recent notifications">
            <ChevronDown size={16} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="notification-preview"
          align="end"
          aria-label="Recent activity"
        >
          <h2>Recent activity</h2>
          {query.isPending ? (
            <p role="status">Loading activity…</p>
          ) : query.isError ? (
            <>
              <p role="alert">Activity couldn’t load.</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Retry activity
              </Button>
            </>
          ) : query.data?.items.length ? (
            <>
              {query.data.items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  asChild={
                    !!item.destinationHref &&
                    isRouteReady(item.destinationHref, READY_ROUTES)
                  }
                  disabled={
                    !item.destinationHref ||
                    !isRouteReady(item.destinationHref, READY_ROUTES)
                  }
                >
                  {item.destinationHref &&
                  isRouteReady(item.destinationHref, READY_ROUTES) ? (
                    <Link
                      href={item.destinationHref}
                      onClick={() => void openActivity(item)}
                    >
                      <span>
                        {item.readAt ? 'Read' : 'Unread'} · {item.message}
                      </span>
                    </Link>
                  ) : (
                    <span>
                      {item.readAt ? 'Read' : 'Unread'} · {item.message}{' '}
                      Activity destination unavailable.
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <p>No activity notifications yet.</p>
          )}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notifications">View all activity</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
