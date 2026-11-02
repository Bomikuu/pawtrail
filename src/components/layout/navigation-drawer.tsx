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
export function NavigationDrawer({
  readyRoutes,
}: {
  readyRoutes: ReadonlySet<string>
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
          className="drawer-trigger"
          aria-label="Open navigation"
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="navigation-drawer"
        closeLabel="Close navigation"
      >
        <DialogTitle>More ways to help</DialogTitle>
        <DialogDescription>
          Find animals, connect with neighbors, and manage your contributions.
        </DialogDescription>
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
        <h3>Your space</h3>
        <DashboardNav
          readyRoutes={readyRoutes}
          onNavigate={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
