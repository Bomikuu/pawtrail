'use client'
import Link from 'next/link'
import { GlobalSearch } from '@/features/search/global-search'
import { NotificationMenu } from '@/features/notifications/notification-menu'
import { Bell, Cookie, Search, ChevronDown, ArrowUpRight } from 'lucide-react'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { Brand } from './brand'
import { useState } from 'react'
import { useSession } from '@/features/auth/session-provider'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/sonner'
import {
  READY_ROUTES,
  destinationHref,
  dashboardDestinations,
} from './navigation'
import { CreateMenu } from './create-menu'
import { NavigationDrawer } from './navigation-drawer'
function validCount(value: number | undefined) {
  return value !== undefined && Number.isSafeInteger(value) && value >= 0
}
export function Header({
  readyRoutes = READY_ROUTES,
  unreadCount,
  kibbleBalance,
  variant = 'platform',
}: {
  readyRoutes?: ReadonlySet<string>
  unreadCount?: number
  kibbleBalance?: number
  variant?: 'platform' | 'management'
}) {
  const { session, pending, logout } = useSession()
  const [signingOut, setSigningOut] = useState(false)
  const home = variant === 'management' ? '/dashboard' : '/community'
  const brand = <Brand />
  const unread = validCount(unreadCount)
    ? `${unreadCount} unread`
    : 'Unread count unavailable'
  const kibble = validCount(kibbleBalance)
    ? `${kibbleBalance!.toLocaleString('en-PH')} Kibble`
    : 'Kibble balance unavailable'
  async function signOut() {
    setSigningOut(true)
    try {
      await logout()
    } catch {
      toast.error('Couldn’t sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <header className="app-header">
      <div className="header-inner">
        <NavigationDrawer readyRoutes={readyRoutes} variant={variant} />
        {readyRoutes.has(home) ? (
          <Link href={home} className="wordmark" aria-label="PawTrail home">
            {brand}
          </Link>
        ) : (
          <span className="wordmark" aria-label="PawTrail">
            {brand}
          </span>
        )}
        {variant === 'management' && (
          <span className="header-workspace-name">Management</span>
        )}
        {readyRoutes.has('/search') && <GlobalSearch />}
        <div className="header-utilities">
          {readyRoutes.has('/search') ? (
            <Link
              className="utility-link mobile-search-link"
              href="/search"
              aria-label="Search PawTrail"
            >
              <Search size={20} aria-hidden="true" />
              <span className="utility-label">Search</span>
            </Link>
          ) : (
            <span
              className="utility-link nav-unavailable"
              aria-disabled="true"
              title="Coming soon"
            >
              <Search size={20} aria-hidden="true" />
              <span className="utility-label">Search</span>
              <span className="sr-only"> unavailable</span>
            </span>
          )}
          {session.actor && (
            <>
              <div className="header-kibble">
                {readyRoutes.has('/dashboard/kibble') ? (
                  <Link className="utility-link" href="/dashboard/kibble">
                    <Cookie aria-hidden="true" size={18} />
                    <span>{validCount(kibbleBalance) ? kibble : 'Kibble'}</span>
                  </Link>
                ) : (
                  <span>{kibble}</span>
                )}
                <small>Non-cash rewards</small>
              </div>
              {readyRoutes.has('/dashboard/notifications') ? (
                <NotificationMenu unread={unread} />
              ) : (
                <span
                  className="utility-link nav-unavailable"
                  aria-disabled="true"
                >
                  <Bell size={20} aria-hidden="true" />
                  <span>{unread}</span>
                </span>
              )}
            </>
          )}
          {variant === 'management' && (
            <ButtonLink
              href="/community"
              variant="ghost"
              className="management-platform-link"
            >
              Open community <ArrowUpRight size={16} aria-hidden="true" />
            </ButtonLink>
          )}
          <div className="header-create">
            <CreateMenu readyRoutes={readyRoutes} />
          </div>
          {session.actor ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  aria-label={`Account for ${session.actor.displayName}`}
                >
                  <CommunityAvatar
                    name={session.actor.displayName}
                    image={session.actor.avatar}
                    userId={session.actor.id}
                    small
                  />
                  <span className="account-name">
                    {session.actor.displayName}
                  </span>
                  <ChevronDown size={15} aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" aria-label="Your account">
                {dashboardDestinations
                  .filter((item) =>
                    [
                      '/dashboard',
                      '/dashboard/profile',
                      '/dashboard/settings',
                    ].includes(item.href),
                  )
                  .map((item) => {
                    const href = destinationHref(item, session, readyRoutes)
                    return href ? (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={href}>{item.label}</Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem key={item.href} disabled>
                        {item.label} — Coming soon
                      </DropdownMenuItem>
                    )
                  })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={pending || signingOut}
                  onSelect={(event) => {
                    event.preventDefault()
                    void signOut()
                  }}
                >
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ButtonLink href="/login" variant="outline">
              Sign in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  )
}
