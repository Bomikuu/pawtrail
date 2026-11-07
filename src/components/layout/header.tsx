'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { GlobalSearch } from '@/features/search/global-search'
import { NotificationMenu } from '@/features/notifications/notification-menu'
import { Bell, Cookie, Search, ChevronDown, ArrowUpRight } from 'lucide-react'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { ThemeToggle } from './theme-toggle'
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
import { toast } from 'sonner'
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
    <header
      className={'app-header sticky top-0 z-40 border-b bg-card md:ms-[14rem]'}
    >
      <div
        className={
          'header-inner flex min-h-16 min-w-0 items-center gap-1 px-3 sm:gap-2 md:gap-3 md:px-6'
        }
      >
        <NavigationDrawer readyRoutes={readyRoutes} variant={variant} />
        {variant === 'management' && (
          <span
            className={
              'header-workspace-name hidden font-medium text-muted-foreground xl:block'
            }
          >
            Management
          </span>
        )}
        {readyRoutes.has('/search') && <GlobalSearch />}
        <div
          className={
            'header-utilities ms-auto flex min-w-0 items-center gap-1 sm:gap-2'
          }
        >
          {readyRoutes.has('/search') ? (
            <Link
              className={
                'mobile-search-link inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-accent md:hidden'
              }
              href="/search"
              aria-label="Search PawTrail"
            >
              <Search size={20} aria-hidden="true" />
              <span
                className={
                  'utility-label max-[48rem]:absolute max-[48rem]:w-[1px] max-[48rem]:h-[1px] max-[48rem]:overflow-hidden max-[48rem]:[clip-path:inset(50%)] max-[48rem]:[.app-shell_.mobile-search-link_&]:hidden'
                }
              >
                Search
              </span>
            </Link>
          ) : (
            <span
              className={
                'utility-link inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent'
              }
              aria-disabled="true"
              title="Coming soon"
            >
              <Search size={20} aria-hidden="true" />
              <span
                className={
                  'utility-label max-[48rem]:absolute max-[48rem]:w-[1px] max-[48rem]:h-[1px] max-[48rem]:overflow-hidden max-[48rem]:[clip-path:inset(50%)] max-[48rem]:[.app-shell_.mobile-search-link_&]:hidden'
                }
              >
                Search
              </span>
              <span className="sr-only"> unavailable</span>
            </span>
          )}
          {session.actor && (
            <>
              <div className={'header-kibble hidden shrink-0 text-xs xl:grid'}>
                {readyRoutes.has('/dashboard/kibble') ? (
                  <Link
                    className={
                      'utility-link inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent'
                    }
                    href="/dashboard/kibble"
                    aria-label={kibble}
                  >
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
                  className={
                    'utility-link inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm hover:bg-accent'
                  }
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
              className={'management-platform-link hidden xl:inline-flex'}
            >
              Open community <ArrowUpRight size={16} aria-hidden="true" />
            </ButtonLink>
          )}
          <div
            className={
              'header-create shrink-0 [&_button]:h-11 [&_button>span]:hidden max-sm:[&_button]:size-11 max-sm:[&_button]:p-0 sm:[&_button>span]:inline'
            }
          >
            <CreateMenu readyRoutes={readyRoutes} />
          </div>
          <ThemeToggle />
          {session.actor ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 max-md:size-11 max-md:p-0"
                  aria-label={`Account for ${session.actor.displayName}`}
                >
                  <CommunityAvatar
                    name={session.actor.displayName}
                    image={session.actor.avatar}
                    userId={session.actor.id}
                    small
                  />
                  <span
                    className={
                      'account-name hidden max-w-40 truncate xl:inline'
                    }
                  >
                    {session.actor.displayName}
                  </span>
                  <ChevronDown
                    className="hidden size-4 md:block"
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" aria-label="Your account">
                {dashboardDestinations
                  .filter((item) =>
                    [
                      '/dashboard',
                      '/dashboard/profile',
                      '/dashboard/settings',
                      '/dashboard/achievements',
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
