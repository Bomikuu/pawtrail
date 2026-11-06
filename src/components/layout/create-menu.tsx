'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  Plus,
  PawPrint,
  MapPin,
  HandCoins,
  MessagesSquare,
  HandHeart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/features/auth/session-provider'
import { READY_ROUTES, destinationHref, type Destination } from './navigation'
const actions: Destination[] = [
  {
    label: 'Report Animal',
    href: '/animals/report',
    icon: PawPrint,
    protected: true,
  },
  {
    label: 'Create Sighting',
    href: '/sightings/create',
    icon: MapPin,
    protected: true,
  },
  {
    label: 'Start Fundraiser',
    href: '/fundraisers/create',
    icon: HandCoins,
    protected: true,
  },
  {
    label: 'Create Community Post',
    href: '/community/create',
    icon: MessagesSquare,
    protected: true,
  },
  {
    label: 'Create Quest',
    href: '/missions/create',
    icon: HandHeart,
    protected: true,
  },
]
export function CreateMenu({
  readyRoutes = READY_ROUTES,
  mobile = false,
}: {
  readyRoutes?: ReadonlySet<string>
  mobile?: boolean
}) {
  const { session } = useSession()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={mobile ? 'mobile-create' : undefined}>
          <Plus size={20} aria-hidden="true" />
          <span>Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={mobile ? 'top' : 'bottom'}
        aria-label="Create something"
      >
        {actions.map((action) => {
          const href = destinationHref(action, session, readyRoutes)
          const Icon = action.icon
          return href ? (
            <DropdownMenuItem key={action.href} asChild>
              <Link href={href}>
                <Icon size={18} aria-hidden="true" />
                {action.label}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={action.href} disabled>
              <Icon size={18} aria-hidden="true" />
              {action.label} — Coming soon
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
