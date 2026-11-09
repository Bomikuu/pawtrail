import {
  Bookmark,
  Camera,
  ExternalLink,
  Flag,
  HandHelping,
  Heart,
  LoaderCircle,
  MoreHorizontal,
  Navigation,
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
import type { MapEntity } from '@/game/discovery/types'
import type { AnimalReportKind } from './discovery-badges'

export function AnimalActions({
  entity,
  saved,
  following,
  busy,
  loginHref,
  onDirections,
  onHelp,
  onAnimalReport,
  onRequestHelp,
  onFollow,
  onSave,
}: {
  entity: MapEntity
  saved: boolean
  following?: boolean | null
  busy: boolean
  loginHref?: string
  onDirections: () => void
  onHelp: () => void
  onAnimalReport: (entity: MapEntity, kind: AnimalReportKind) => void
  onRequestHelp: () => void
  onFollow: () => void
  onSave: () => void
}) {
  return (
    <footer
      className="shrink-0 space-y-2 border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label={'Actions for ' + entity.name}
    >
      <div className="flex gap-2">
        <Button
          type="button"
          className="h-11 min-w-0 flex-1 rounded-md"
          onClick={onDirections}
        >
          <Navigation className="size-4 shrink-0" />
          <span className="truncate">Go to {entity.name}</span>
        </Button>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-md"
              aria-label={'More actions for ' + entity.name}
            >
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="pawtrail-game z-50 w-60 text-foreground"
          >
            <DropdownMenuLabel className="truncate">
              {entity.name}
            </DropdownMenuLabel>
            {entity.profileHref && (
              <DropdownMenuItem asChild>
                <a href={entity.profileHref}>
                  <ExternalLink />
                  View animal profile
                </a>
              </DropdownMenuItem>
            )}
            {typeof following === 'boolean' && (
              <DropdownMenuItem disabled={busy} onSelect={onFollow}>
                {busy ? (
                  <LoaderCircle className="motion-safe:animate-spin" />
                ) : (
                  <Heart className={following ? 'fill-current' : ''} />
                )}
                {busy
                  ? 'Updating follow…'
                  : following
                    ? 'Unfollow animal'
                    : 'Follow animal'}
              </DropdownMenuItem>
            )}
            {loginHref && (
              <DropdownMenuItem asChild>
                <a href={loginHref}>
                  <Heart />
                  Sign in to follow
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onSave}>
              <Bookmark className={saved ? 'fill-current' : ''} />
              {saved ? 'Remove device bookmark' : 'Save on this device'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRequestHelp}>
              <HandHelping />
              Request help
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onAnimalReport(entity, 'concern')}
            >
              <Flag />
              Report a concern
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-0 rounded-md px-2 text-xs"
          onClick={() => onAnimalReport(entity, 'sighting')}
        >
          <Camera className="size-4 shrink-0" />
          <span className="truncate">Add sighting</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 min-w-0 rounded-md px-2 text-xs"
          onClick={onHelp}
        >
          <HandHelping className="size-4 shrink-0" />
          <span className="truncate">Ways to help</span>
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Directions lead to a published approximate area. {entity.name} may have
        moved.
      </p>
    </footer>
  )
}
