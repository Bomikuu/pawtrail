'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
interface AnimalPhoto {
  url: string
  alt: string
  mimeType?: string
  visibility?: 'private' | 'public'
  sensitive?: boolean
}
export function AnimalImage({
  image,
  sensitive = image?.sensitive ?? false,
  className,
}: {
  image?: AnimalPhoto | null
  sensitive?: boolean
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [revealedUrl, setRevealedUrl] = useState<string | null>(null)
  const safe =
    image &&
    image.visibility !== 'private' &&
    image.mimeType !== 'application/pdf' &&
    !image.url.includes('/content') &&
    /^(https:\/\/|\/(?!\/))/.test(image.url)
  if (!safe || failedUrl === image.url)
    return (
      <div
        className={`animal-image-fallback ${className ?? ''}`}
        role="img"
        aria-label={
          image?.alt
            ? `${image.alt} — photograph unavailable`
            : 'Animal photograph unavailable'
        }
      >
        Photograph unavailable
      </div>
    )
  if (sensitive && revealedUrl !== image.url)
    return (
      <div className={className}>
        <p>This photograph may show an animal in distress.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRevealedUrl(image.url)}
        >
          Show photograph
        </Button>
      </div>
    )
  return (
    <img
      className={className}
      src={image.url}
      alt={image.alt}
      width={640}
      height={480}
      loading="lazy"
      onError={() => setFailedUrl(image.url)}
    />
  )
}
