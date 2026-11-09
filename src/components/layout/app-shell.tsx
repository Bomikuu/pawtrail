'use client'
import { useUnreadCount } from '@/features/notifications/queries'
import { useQuery } from '@tanstack/react-query'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/features/auth/session-provider'
import { DemoBanner } from '@/components/shared/demo-banner'
import { Header } from './header'
import { Brand } from './brand'
import { MobileNav } from './mobile-nav'
import { RouteTransition } from './route-transition'
import { usePageNavigation } from './page-navigation'
import { PageLoading } from './page-loading'
import { DashboardNav } from './dashboard-nav'
import { PlatformSidebar } from './platform-sidebar'
import {
  dashboardDestinations,
  isCurrentDestination,
  READY_ROUTES,
} from './navigation'
export function AppShell({
  children,
  rightRail,
  readyRoutes = READY_ROUTES,
  unreadCount,
  kibbleBalance,
  variant = 'platform',
}: {
  children: ReactNode
  rightRail?: ReactNode
  readyRoutes?: ReadonlySet<string>
  unreadCount?: number
  kibbleBalance?: number
  variant?: 'platform' | 'management'
}) {
  const { session } = useSession()
  const actualPathname = usePathname()
  const navigation = usePageNavigation()
  const pathname = navigation?.pathname ?? actualPathname
  const pagePending = navigation?.pending && !navigation.region
  const management = variant === 'management'
  const current = dashboardDestinations.find((item) =>
    isCurrentDestination(pathname, item.href),
  )
  const unread = useUnreadCount(readyRoutes.has('/dashboard/notifications'))
  const wallet = useQuery({
    queryKey: queryKeys(session.cacheScope).detail('kibble', 'wallet'),
    queryFn: ({ signal }) => getBrowserApi().kibble.wallet({ signal }),
    enabled: !!session.actor && readyRoutes.has('/dashboard/kibble'),
  })
  return (
    <div
      className={
        'app-shell min-h-dvh bg-background' +
        (management ? ' management-shell' : ' platform-shell')
      }
    >
      <a
        className={
          'skip-link fixed top-2 left-4 p-3 [z-index:100] bg-card [transform:translateY(-200%)] [&:focus]:[transform:none]'
        }
        href="#main-content"
      >
        Skip to content
      </a>
      <Header
        variant={variant}
        readyRoutes={readyRoutes}
        unreadCount={unreadCount ?? (unread.isError ? undefined : unread.data)}
        kibbleBalance={kibbleBalance ?? wallet.data?.balance}
      />
      {session.demo && (pathname.startsWith('/spot') ? <div role="note" className="border-b bg-accent px-4 py-2 text-center text-xs md:ps-[15rem]">Real sightings workspace. The surrounding community uses sample data; its account and game rewards are separate.</div> : <DemoBanner />)}
      <div
        className={
          'app-columns min-w-0 p-3 pb-20 md:ms-[14rem] md:p-6' +
          (rightRail
            ? ' has-right-rail min-[80rem]:grid min-[80rem]:grid-cols-[minmax(0,1fr)_16rem] min-[80rem]:items-start min-[80rem]:gap-6'
            : '')
        }
      >
        <aside
          className={
            'app-sidebar fixed inset-y-0 left-0 z-50 hidden w-[14rem] flex-col overflow-y-auto border-r bg-card p-3 md:flex'
          }
          aria-label={management ? 'Management workspace' : 'PawTrail platform'}
        >
          {readyRoutes.has(management ? '/dashboard' : '/community') ? (
            <Link
              className={
                'sidebar-brand sticky -top-3 z-10 mb-3 flex items-center gap-2 bg-card px-1 py-4 font-heading text-2xl font-black text-foreground no-underline'
              }
              href={management ? '/dashboard' : '/community'}
              aria-label="PawTrail home"
            >
              <Brand />
            </Link>
          ) : (
            <span
              className={
                'sidebar-brand sticky -top-3 z-10 mb-3 flex items-center gap-2 bg-card px-1 py-4 font-heading text-2xl font-black text-foreground no-underline'
              }
            >
              <Brand />
            </span>
          )}
          {management ? (
            <>
              <div
                className={
                  'workspace-heading grid items-start justify-between gap-0.5 [margin:0_0_2rem] [padding:0_0.875rem_1.5rem] [&_h1]:font-heading [&_h1]:text-[length:clamp(1.75rem,_3vw,_2.25rem)] [&_h1]:[line-height:1.18] [&_h1]:[margin:0_0_0.75rem] [&_h1]:[text-wrap:balance] [&_p]:max-w-[65ch] [&_p]:text-muted-foreground [&_p]:m-0 [&_p]:[line-height:1.65] max-[48rem]:block max-[48rem]:[&_>_a]:mt-4 [&_strong]:font-[800] [&_strong]:text-lg [&_strong]:leading-[1.3] [&_strong]:font-heading [&_span]:text-xs [&_span]:text-muted-foreground [.management-shell_&]:mb-6 [.route-transition_>_header&]:flex [.route-transition_>_header&]:items-center [.route-transition_>_header&]:justify-between [.route-transition_>_header&]:gap-6 [.route-transition_>_header&]:p-0 [.route-transition_>_header&]:[margin:0_0_1.25rem] [.route-transition_>_header&_>_div]:min-w-0 [.route-transition_>_header&_h1]:font-[850] [.route-transition_>_header&_h1]:text-[1.75rem] [.route-transition_>_header&_h1]:leading-[1.2] [.route-transition_>_header&_h1]:font-heading [.route-transition_>_header&_h1]:[margin:0_0_0.5rem] [.route-transition_>_header&_p]:text-[length:0.9375rem] [.route-transition_>_header&_p]:[line-height:1.55] [.route-transition_>_header&_>_[data-slot=button]]:shrink-0 [.route-transition_>_header&_>_[data-slot=button]]:w-auto [.route-transition_>_header&_>_[data-slot=button]]:whitespace-nowrap max-[48rem]:[.route-transition_>_header&]:flex-col max-[48rem]:[.route-transition_>_header&]:items-start max-[48rem]:[.route-transition_>_header&]:gap-3.5 max-[48rem]:[.route-transition_>_header&_h1]:text-2xl max-[48rem]:[.route-transition_>_header&_>_[data-slot=button]]:w-auto'
                }
              >
                <strong>Your workspace</strong>
                <span>Manage your contributions</span>
              </div>
              <DashboardNav readyRoutes={readyRoutes} />
              <Link
                href="/community"
                className={
                  'workspace-switch flex items-center gap-2 text-[0.8125rem] [padding:0.875rem_0.75rem] mt-4 [border-top:1px_solid_var(--social-line)] text-muted-foreground no-underline [&:hover]:text-[color:var(--teal)] [&:hover]:bg-card [&_>_svg]:shrink-0 max-[58rem]:min-[48.001rem]:[.platform-shell_&]:hidden'
                }
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Back to the community
              </Link>
            </>
          ) : (
            <PlatformSidebar readyRoutes={readyRoutes} />
          )}
        </aside>
        <main
          id="main-content"
          tabIndex={-1}
          className={
            'app-content min-w-0 w-full' +
            (pathname === '/community' ? ' community-content' : '')
          }
        >
          {management && (
            <nav
              className={
                'workspace-breadcrumb flex items-center gap-2.5 text-xs mb-7 text-muted-foreground [&_a]:no-underline [&_a]:text-[inherit] [&_a:hover]:text-[color:var(--teal)] [&_a:hover]:underline max-[48rem]:mb-5'
              }
              aria-label="Breadcrumb"
            >
              <Link href="/dashboard">Management</Link>
              <span aria-hidden="true">/</span>
              <span>{current?.label ?? 'Record details'}</span>
            </nav>
          )}
          {pagePending && <PageLoading pathname={pathname} />}
          <RouteTransition hidden={pagePending}>{children}</RouteTransition>
        </main>
        {rightRail && (
          <aside
            aria-label="Nearby help and adoption"
            className={'context-rail hidden min-w-0 min-[80rem]:block'}
          >
            {rightRail}
          </aside>
        )}
      </div>
      <footer
        className={
          'app-credits px-6 py-4 text-xs text-muted-foreground md:ms-[14rem]'
        }
      >
        <Link href="/photo-credits">Photo credits</Link>
      </footer>
      {!management && <MobileNav readyRoutes={readyRoutes} />}
    </div>
  )
}
