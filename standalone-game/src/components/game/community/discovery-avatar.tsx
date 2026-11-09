import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  discoveryPlaceholder,
  type DiscoveryArtwork,
} from '@/game/discovery/placeholders'
import type { EntityKind } from '@/game/discovery/types'
import { cn } from '@/lib/utils'

/** Public photos win; generated category artwork is a clearly labelled fallback. */
export function DiscoveryAvatar({
  kind,
  src,
  alt,
  className,
  decorative = false,
}: {
  kind: EntityKind | DiscoveryArtwork
  src?: string | null
  alt: string
  className?: string
  decorative?: boolean
}) {
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null)
  const placeholder = discoveryPlaceholder(kind)
  return (
    <Avatar
      title={decorative ? undefined : alt}
      aria-hidden={decorative || undefined}
      className={cn('shrink-0 rounded-full bg-secondary', className)}
    >
      {src && (
        <AvatarImage
          src={src}
          alt={decorative ? '' : alt}
          className="object-cover"
        />
      )}
      <AvatarFallback className="rounded-[inherit] bg-secondary">
        {failedArtwork !== placeholder ? (
          <img
            src={placeholder}
            alt={decorative ? '' : `${alt} · illustrated placeholder`}
            className="size-full scale-125 object-contain"
            loading="lazy"
            draggable={false}
            onError={() => setFailedArtwork(placeholder)}
          />
        ) : (
          <ImageOff
            aria-label={decorative ? undefined : `${alt} · image unavailable`}
            className="size-1/2 text-muted-foreground"
          />
        )}
      </AvatarFallback>
    </Avatar>
  )
}
