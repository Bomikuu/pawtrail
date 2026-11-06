'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PawPrint } from 'lucide-react'
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
  compact = false,
}: {
  image?: AnimalPhoto | null
  sensitive?: boolean
  className?: string
  compact?: boolean
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
        className={`animal-image-fallback grid [place-items:center] p-5 bg-background [border:1px_solid_var(--border)] rounded-[var(--radius)] [overflow-wrap:anywhere] [.platform-shell_.rail-animal_>_&]:w-15 [.platform-shell_.rail-animal_>_&]:h-15 [.platform-shell_.rail-animal_>_&]:rounded-[0.625rem] [.platform-shell_.rail-animal_>_&]:object-cover [.platform-shell_.rail-animal_>_&]:[flex:0_0_3.75rem] [.platform-shell_.rail-animal_>_&]:m-0 [.platform-shell_.rail-animal_>_&]:p-0 [.profile-supported-animals_>_li_>_&]:w-16 [.profile-supported-animals_>_li_>_&]:h-13 [.profile-supported-animals_>_li_>_&]:object-cover [.profile-supported-animals_>_li_>_&]:rounded-lg [.profile-supported-animals_>_li_>_&]:shrink-0 [&:not(.resource-avatar)]:flex [&:not(.resource-avatar)]:flex-col [&:not(.resource-avatar)]:justify-center [&:not(.resource-avatar)]:items-center [&:not(.resource-avatar)]:gap-2 [&:not(.resource-avatar)]:p-4 [&:not(.resource-avatar)]:bg-[#fff7e9] [&:not(.resource-avatar)]:text-muted-foreground [&:not(.resource-avatar)]:text-[0.8125rem] [&:not(.resource-avatar)]:text-center [&_>_img]:w-[min(10rem,_80%)] [&_>_img]:max-h-24 [&_>_img]:h-auto [&_>_img]:object-contain [.pet-portrait_>_&]:grid [.pet-portrait_>_&]:[place-items:center] [.pet-activity-photos_>_&]:w-full [.pet-activity-photos_>_&]:h-auto [.pet-activity-photos_>_&]:max-h-104 [.pet-activity-photos_>_&]:[aspect-ratio:4_/_3] [.pet-activity-photos_>_&]:object-cover [.pet-activity-photos_>_&]:rounded-xl [.pet-photo-collection_figure_>_&]:block [.pet-photo-collection_figure_>_&]:w-full [.pet-photo-collection_figure_>_&]:h-auto [.pet-photo-collection_figure_>_&]:[aspect-ratio:4_/_3] [.pet-photo-collection_figure_>_&]:object-cover [.pet-photo-collection_figure_>_&]:rounded-xl [.hero-animal_&]:w-18 [.hero-animal_&]:h-18 [.hero-animal_&]:object-cover [.hero-animal_&]:rounded-lg [.animal-note_&]:w-36 [.animal-note_&]:h-32 [.animal-note_&]:object-cover [.animal-note_&]:rounded-xl [.adoption-portrait_&]:w-full [.adoption-portrait_&]:h-auto [.adoption-portrait_&]:[aspect-ratio:4/5] [.adoption-portrait_&]:object-cover [.adoption-portrait_&]:rounded-xl [.adoption-portrait_&]:mb-4 [.campaign-preview_&]:w-36 [.campaign-preview_&]:h-full [.campaign-preview_&]:min-h-40 [.campaign-preview_&]:object-cover [.campaign-preview_&]:rounded-xl [.story-preview_&]:w-full [.story-preview_&]:h-auto [.story-preview_&]:[aspect-ratio:4/3] [.story-preview_&]:object-cover [.story-preview_&]:rounded-xl [.story-preview_&]:mb-5 max-[64rem]:[.campaign-preview_&]:w-full max-[64rem]:[.campaign-preview_&]:h-auto max-[64rem]:[.campaign-preview_&]:[aspect-ratio:16/10] max-[64rem]:[.animal-note_&]:w-24 max-[64rem]:[.animal-note_&]:h-24 max-[48rem]:[.animal-note_&]:w-28 max-[48rem]:[.animal-note_&]:h-24 max-[48rem]:[.campaign-preview_&]:h-full max-[48rem]:[.campaign-preview_&]:min-h-40 max-[48rem]:[.campaign-preview_&]:[aspect-ratio:auto] max-[48rem]:[.story-preview_&]:h-28 max-[48rem]:[.story-preview_&]:object-cover max-[48rem]:[.story-preview_&]:m-0 ${className ?? ''}`}
        role="img"
        aria-label={
          image?.alt
            ? `${image.alt} — photograph unavailable`
            : 'Animal photograph unavailable'
        }
      >
        {compact ? (
          <PawPrint size={22} aria-hidden="true" />
        ) : (
          <>
            <img
              src="/images/pawtrail/care-circle.webp"
              width={250}
              height={119}
              alt=""
              loading="lazy"
            />
            <span>
              {image ? 'Photograph unavailable' : 'No photograph added yet'}
            </span>
          </>
        )}
      </div>
    )
  if (sensitive && revealedUrl !== image.url)
    if (compact)
      return (
        <span
          className={`animal-image-fallback grid [place-items:center] p-5 bg-background [border:1px_solid_var(--border)] rounded-[var(--radius)] [overflow-wrap:anywhere] [.platform-shell_.rail-animal_>_&]:w-15 [.platform-shell_.rail-animal_>_&]:h-15 [.platform-shell_.rail-animal_>_&]:rounded-[0.625rem] [.platform-shell_.rail-animal_>_&]:object-cover [.platform-shell_.rail-animal_>_&]:[flex:0_0_3.75rem] [.platform-shell_.rail-animal_>_&]:m-0 [.platform-shell_.rail-animal_>_&]:p-0 [.profile-supported-animals_>_li_>_&]:w-16 [.profile-supported-animals_>_li_>_&]:h-13 [.profile-supported-animals_>_li_>_&]:object-cover [.profile-supported-animals_>_li_>_&]:rounded-lg [.profile-supported-animals_>_li_>_&]:shrink-0 [&:not(.resource-avatar)]:flex [&:not(.resource-avatar)]:flex-col [&:not(.resource-avatar)]:justify-center [&:not(.resource-avatar)]:items-center [&:not(.resource-avatar)]:gap-2 [&:not(.resource-avatar)]:p-4 [&:not(.resource-avatar)]:bg-[#fff7e9] [&:not(.resource-avatar)]:text-muted-foreground [&:not(.resource-avatar)]:text-[0.8125rem] [&:not(.resource-avatar)]:text-center [&_>_img]:w-[min(10rem,_80%)] [&_>_img]:max-h-24 [&_>_img]:h-auto [&_>_img]:object-contain [.pet-portrait_>_&]:grid [.pet-portrait_>_&]:[place-items:center] [.pet-activity-photos_>_&]:w-full [.pet-activity-photos_>_&]:h-auto [.pet-activity-photos_>_&]:max-h-104 [.pet-activity-photos_>_&]:[aspect-ratio:4_/_3] [.pet-activity-photos_>_&]:object-cover [.pet-activity-photos_>_&]:rounded-xl [.pet-photo-collection_figure_>_&]:block [.pet-photo-collection_figure_>_&]:w-full [.pet-photo-collection_figure_>_&]:h-auto [.pet-photo-collection_figure_>_&]:[aspect-ratio:4_/_3] [.pet-photo-collection_figure_>_&]:object-cover [.pet-photo-collection_figure_>_&]:rounded-xl [.hero-animal_&]:w-18 [.hero-animal_&]:h-18 [.hero-animal_&]:object-cover [.hero-animal_&]:rounded-lg [.animal-note_&]:w-36 [.animal-note_&]:h-32 [.animal-note_&]:object-cover [.animal-note_&]:rounded-xl [.adoption-portrait_&]:w-full [.adoption-portrait_&]:h-auto [.adoption-portrait_&]:[aspect-ratio:4/5] [.adoption-portrait_&]:object-cover [.adoption-portrait_&]:rounded-xl [.adoption-portrait_&]:mb-4 [.campaign-preview_&]:w-36 [.campaign-preview_&]:h-full [.campaign-preview_&]:min-h-40 [.campaign-preview_&]:object-cover [.campaign-preview_&]:rounded-xl [.story-preview_&]:w-full [.story-preview_&]:h-auto [.story-preview_&]:[aspect-ratio:4/3] [.story-preview_&]:object-cover [.story-preview_&]:rounded-xl [.story-preview_&]:mb-5 max-[64rem]:[.campaign-preview_&]:w-full max-[64rem]:[.campaign-preview_&]:h-auto max-[64rem]:[.campaign-preview_&]:[aspect-ratio:16/10] max-[64rem]:[.animal-note_&]:w-24 max-[64rem]:[.animal-note_&]:h-24 max-[48rem]:[.animal-note_&]:w-28 max-[48rem]:[.animal-note_&]:h-24 max-[48rem]:[.campaign-preview_&]:h-full max-[48rem]:[.campaign-preview_&]:min-h-40 max-[48rem]:[.campaign-preview_&]:[aspect-ratio:auto] max-[48rem]:[.story-preview_&]:h-28 max-[48rem]:[.story-preview_&]:object-cover max-[48rem]:[.story-preview_&]:m-0 ${className ?? ''}`}
          role="img"
          aria-label="Sensitive photograph hidden"
        >
          <PawPrint size={22} aria-hidden="true" />
        </span>
      )
    else
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
