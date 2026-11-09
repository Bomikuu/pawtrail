import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  ExternalLink,
  Home,
  HeartHandshake,
  Users,
  X,
  PawPrint,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { placeEntry, type CommunityPlace } from '@/game/community'
import { discoveryPlaceholder } from '@/game/discovery/placeholders'

export const placeIcons = { home: Home, shelter: HeartHandshake, hub: Users }
export const placeLabels = {
  home: 'Community home',
  shelter: 'Shelter',
  hub: 'Community space',
}
export function PlacePreview({
  place,
  onClose,
}: {
  place: CommunityPlace
  onClose: () => void
}) {
  const [joining, setJoining] = useState(false),
    [failedPhoto, setFailedPhoto] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    setJoining(false)
    setFailedPhoto(false)
    heading.current?.focus({ preventScroll: true })
  }, [place.id])
  const full =
    place.capacity !== undefined && (place.occupancy ?? 0) >= place.capacity
  const base = window.location.pathname === '/' ? '/' : '/play'
  return (
    <Card
      className="absolute inset-x-3 bottom-3 z-10 max-h-[85%] gap-0 overflow-y-auto rounded-2xl border bg-card py-0 shadow-lg lg:left-auto lg:right-4 lg:bottom-4 lg:w-80"
      aria-label="Place preview"
    >
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-t-2xl bg-secondary">
        {place.photo && !failedPhoto ? (
          <img
            src={place.photo.url}
            alt={place.photo.alt}
            className="size-full object-cover"
            onError={() => setFailedPhoto(true)}
          />
        ) : (
          <img
            src={discoveryPlaceholder(place.kind)}
            alt=""
            className="size-24 object-contain"
          />
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 size-8 rounded-md border"
          aria-label="Close place preview"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{placeLabels[place.kind]}</Badge>
          {place.sample && <Badge variant="outline">Sample</Badge>}
        </div>
        <div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="font-heading text-xl font-extrabold leading-tight focus:outline-none text-foreground"
          >
            {place.name}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {place.area}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{place.description}</p>
        {place.host && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">Hosted by</span>
            {place.host.avatar && (
              <img
                src={place.host.avatar}
                alt=""
                className="size-6 rounded-full object-cover"
              />
            )}
            <span>{place.host.name}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {place.occupancy !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {place.occupancy}
              {place.capacity !== undefined ? ` / ${place.capacity}` : ''}{' '}
              inside
            </span>
          )}
          {place.residents !== undefined && (
            <span className="inline-flex items-center gap-1">
              <PawPrint className="size-3.5" />
              {place.residents} residents
            </span>
          )}
          {place.visibility && (
            <span className="capitalize">
              {place.visibility === 'friends'
                ? 'Friends only'
                : place.visibility === 'invite'
                  ? 'By invitation'
                  : place.visibility}
            </span>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {place.locationLabel}
        </p>
        {place.demo && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enter this furnished demo room as a guest—no sign-in needed. Hosts
            and animals are fictional, and care stays in the game.
          </p>
        )}
        {place.kind === 'shelter' && place.profileHref && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enter a shared virtual care interior featuring this shelter’s
            eligible public animal profiles. Visit the profile for real adoption
            and volunteering details.
          </p>
        )}
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {full ? (
            <Button disabled className="flex-1">
              Room full
            </Button>
          ) : (
            <Button asChild className="flex-1">
              <a
                href={placeEntry(place, base)}
                onClick={() => setJoining(true)}
                aria-busy={joining}
              >
                {joining ? (
                  <PawPrint className="size-4 motion-safe:animate-pulse" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                {joining
                  ? 'Opening…'
                  : place.kind === 'home'
                    ? 'Enter home'
                    : place.kind === 'hub'
                      ? 'Join commons'
                      : 'Enter care space'}
              </a>
            </Button>
          )}
          {place.profileHref && (
            <Button className="text-foreground" asChild variant="outline">
              <a href={place.profileHref}>
                Profile
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
