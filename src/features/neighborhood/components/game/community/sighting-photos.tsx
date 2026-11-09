import { useEffect, useState } from 'react'
import { ImageOff, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MapSightingPhoto, PlatformBridge } from '@/features/neighborhood/game/platform'

function SightingPhoto({ item }: { item: MapSightingPhoto }) {
  const [failed, setFailed] = useState(false)
  const time = item.observedAt ? Date.parse(item.observedAt) : NaN
  return (
    <figure className="min-w-0 space-y-1.5">
      <a
        href={item.photo.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={'Open sighting photo: ' + item.photo.alt}
        className="block overflow-hidden rounded-md border bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {failed ? (
          <div className="flex aspect-[4/3] items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ImageOff className="size-4" />
            Photo unavailable
          </div>
        ) : (
          <img
            src={item.photo.url}
            alt={item.photo.alt}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover [image-rendering:auto]"
            onError={() => setFailed(true)}
          />
        )}
      </a>
      <figcaption className="space-y-0.5 text-[11px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
        <p>
          {Number.isFinite(time) ? (
            <time dateTime={item.observedAt!}>
              {new Date(time).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>
          ) : (
            'Sighting time not recorded'
          )}
        </p>
        <p>{item.area}</p>
        {item.caption && <p className="line-clamp-2">{item.caption}</p>}
      </figcaption>
    </figure>
  )
}
export function SightingPhotos({
  animalId,
  platform,
}: {
  animalId: string
  platform?: PlatformBridge
}) {
  const [items, setItems] = useState<MapSightingPhoto[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setItems(null)
    setError(false)
    if (!platform?.mapSightings) {
      setItems([])
      return () => controller.abort()
    }
    platform
      .mapSightings(animalId, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setItems(value)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true)
      })
    return () => controller.abort()
  }, [animalId, platform, attempt])
  return (
    <section aria-label="Sighting photos" className="space-y-3 border-y py-4">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground">
          Sighting photos
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Published photos from community sightings.
        </p>
      </div>
      {error ? (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-muted-foreground">
            Sighting photos could not load.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RotateCw className="size-3.5" />
            Retry photos
          </Button>
        </div>
      ) : items === null ? (
        <div
          role="status"
          aria-label="Loading sighting photos"
          className="grid grid-cols-3 gap-2"
        >
          <Skeleton className="aspect-[4/3] motion-reduce:animate-none" />
          <Skeleton className="aspect-[4/3] motion-reduce:animate-none" />
          <Skeleton className="aspect-[4/3] motion-reduce:animate-none" />
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {items.map((item) => (
            <SightingPhoto key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {platform?.mapSightings
            ? 'No published sighting photos yet.'
            : 'Sighting photos are not available in this view.'}
        </p>
      )}
    </section>
  )
}
