import {
  Bookmark,
  Compass,
  FileText,
  Home,
  House,
  LayoutDashboard,
  Settings,
  UserRound,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MapViewer } from '@/game/platform'
import { AnimalFace } from './markers'

export function DiscoverySidebarHeader({
  account,
  base,
  demo,
  onSaved,
  onReports,
  loginHref,
}: {
  account: MapViewer | null
  base: string
  demo: boolean
  onSaved: () => void
  onReports: () => void
  loginHref: string
}) {
  const home = `${base}?home=me${demo ? '&demo=1' : ''}`
  const yard = `${base}?home=me%7Cyard${demo ? '&demo=1' : ''}`
  const community = `${base}?home=system%3Ahub`
  return (
    <div className="shrink-0 space-y-1 border-b bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <a
          href="/community"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md font-heading text-xl font-extrabold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="PawTrail community feed"
        >
          <img
            src="/pawtrail-game/discovery/pawtrail-brand-mark.webp"
            width="211"
            height="73"
            alt=""
            className="h-7 w-12 object-contain max-[360px]:hidden"
          />
          <span>
            Paw<span className="text-[#c94c09]">Trail</span>
          </span>
        </a>
        <nav
          aria-label="PawTrail navigation"
          className="flex shrink-0 items-center gap-1"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 rounded-md text-foreground"
                aria-label="Home and game destinations"
              >
                <Home className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="pawtrail-game w-56 text-foreground"
            >
              <DropdownMenuLabel>Your PawTrail spaces</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <a href={home}>
                  <House className="size-4" />
                  My house
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={yard}>
                  <Home className="size-4" />
                  My yard
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={community}>
                  <Users className="size-4" />
                  Community world
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`${base}?explore=1${demo ? '&demo=1' : ''}`}>
                  <Compass className="size-4" />
                  Story exploration
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onSaved}>
                <Bookmark className="size-4" />
                Saved places
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onReports}>
                <FileText className="size-4" />
                My reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-md p-1 text-foreground"
                aria-label={
                  account?.authenticated
                    ? 'Account menu for ' + account.name
                    : 'Account and navigation menu'
                }
              >
                {account?.avatar ? (
                  <AnimalFace
                    animal={{
                      id: 'account',
                      name: account.name,
                      species: 'person',
                      photo: { url: account.avatar, alt: account.name },
                    }}
                    className="size-8"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-secondary">
                    <UserRound className="size-4" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="pawtrail-game w-60 text-foreground"
            >
              <DropdownMenuLabel className="text-foreground">
                {account?.authenticated ? account.name : 'Welcome to PawTrail'}
              </DropdownMenuLabel>
              {account?.authenticated ? (
                <>
                  <DropdownMenuItem className="text-foreground" asChild>
                    <a href={account.profileHref ?? '/dashboard/profile'}>
                      <UserRound className="size-4" />
                      My profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-foreground" asChild>
                    <a href="/dashboard/settings">
                      <Settings className="size-4" />
                      Account settings
                    </a>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem className="text-foreground" asChild>
                  <a href={loginHref}>
                    <UserRound className="size-4" />
                    Sign in to PawTrail
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" asChild>
                <a href="/community">
                  <Users className="size-4" />
                  Community feed
                </a>
              </DropdownMenuItem>
              {account?.canManage && (
                <DropdownMenuItem className="text-foreground" asChild>
                  <a href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Management dashboard
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-foreground" onSelect={onSaved}>
                <Bookmark className="size-4" />
                Saved places on this device
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-foreground"
                onSelect={onReports}
              >
                <FileText className="size-4" />
                My reports & reviews
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        A little closer to your animal neighbors.
      </p>
    </div>
  )
}
