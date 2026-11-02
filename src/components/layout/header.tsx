'use client'
import Link from 'next/link'
import { GlobalSearch } from '@/features/search/global-search'
import { NotificationMenu } from '@/features/notifications/notification-menu'
import { Bell, Cookie, Search, UserRound, PawPrint } from 'lucide-react'
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
}: {
  readyRoutes?: ReadonlySet<string>
  unreadCount?: number
  kibbleBalance?: number
}) {
  const { session, pending, logout } = useSession()
  const [signingOut, setSigningOut] = useState(false)
  const home = session.actor ? '/community' : '/'
  const brand = (
    <>
      <PawPrint aria-hidden="true" size={26} />
      <span>PawTrail</span>
    </>
  )
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
        <NavigationDrawer readyRoutes={readyRoutes} />
        {readyRoutes.has(home) ? (
          <Link href={home} className="wordmark" aria-label="PawTrail home">
            {brand}
          </Link>
        ) : (
          <span className="wordmark" aria-label="PawTrail">
            {brand}
          </span>
        )}
        <div className="header-utilities">
          {readyRoutes.has('/search') && <GlobalSearch />}
          {readyRoutes.has('/search') ? (
            <Link className="utility-link" href="/search">
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
                    <span>{kibble}</span>
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
                  <UserRound aria-hidden="true" size={20} />
                  <span className="account-name">
                    {session.actor.displayName}
                  </span>
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
