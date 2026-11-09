'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useUiStore } from '@/stores/ui'
import { mainDestinations, extraDestinations } from './navigation'
import { NavItem } from './nav-item'
import { DashboardNav } from './dashboard-nav'
import { ButtonLink } from '@/components/ui/button-link'
import { NavigationLink } from './navigation-link'
import { Brand } from './brand'
import { ThemeToggle } from './theme-toggle'
export function NavigationDrawer({
  readyRoutes,
  variant = 'platform',
}: {
  readyRoutes: ReadonlySet<string>
  variant?: 'platform' | 'management'
}) {
  const open = useUiStore((state) => state.navigationOpen)
  const setOpen = useUiStore((state) => state.setNavigationOpen)
  const pathname = usePathname()
  useEffect(() => {
    setOpen(false)
  }, [pathname, setOpen])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={'drawer-trigger size-11 shrink-0 md:hidden'}
          aria-label="Open navigation"
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={
          'navigation-drawer inset-y-0 left-0 right-auto h-dvh max-h-dvh w-[min(19rem,calc(100vw-2rem))] max-w-none translate-x-0 translate-y-0 content-start gap-4 overflow-y-auto rounded-none border-r p-5 pb-[max(2rem,env(safe-area-inset-bottom))] sm:max-w-none [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0'
        }
      >
        <DialogTitle>
          <NavigationLink
            className="sidebar-brand flex items-center gap-2 pr-6 font-heading text-2xl font-black text-foreground no-underline"
            href={variant === 'management' ? '/dashboard' : '/community'}
            onNavigate={() => setOpen(false)}
            aria-label="PawTrail home"
          >
            <Brand />
          </NavigationLink>
        </DialogTitle>
        <DialogDescription>
          Find animals, connect with neighbors, and manage your contributions.
        </DialogDescription>
        <div className="flex items-center justify-between gap-2 border-y py-3 sm:hidden">
          {readyRoutes.has('/search') && (
            <ButtonLink
              href="/search"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Search PawTrail
            </ButtonLink>
          )}
          <ThemeToggle />
        </div>
        {variant === 'platform' && (
          <nav aria-label="All destinations">
            <ul>
              {[...mainDestinations, ...extraDestinations].map((item) => (
                <li key={item.href}>
                  <NavItem
                    destination={item}
                    readyRoutes={readyRoutes}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>
          </nav>
        )}
        {variant === 'management' ? (
          <DashboardNav
            readyRoutes={readyRoutes}
            onNavigate={() => setOpen(false)}
          />
        ) : (
          <ButtonLink
            href="/dashboard"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Management dashboard
          </ButtonLink>
        )}
        {variant === 'management' && (
          <ButtonLink
            href="/community"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Back to community
          </ButtonLink>
        )}
      </DialogContent>
    </Dialog>
  )
}
