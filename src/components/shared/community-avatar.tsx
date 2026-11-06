'use client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useState } from 'react'
import { personAvatar } from '@/features/users/avatar-presets'

export function CommunityAvatar({
  name,
  small = false,
  large = false,
  image,
  userId,
}: {
  name: string
  small?: boolean
  large?: boolean
  image?: { url: string; alt: string; sensitive?: boolean } | null
  userId?: string | null
}) {
  const displayedImage = image ?? (userId ? personAvatar(null, userId) : null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const safe =
    displayedImage &&
    !displayedImage.sensitive &&
    /^(https:\/\/|\/(?!\/))/.test(displayedImage.url) &&
    !displayedImage.url.includes('/content') &&
    failedUrl !== displayedImage.url
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'P'
  const tone =
    name.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 4
  return (
    <Avatar
      className={
        'community-avatar inline-flex w-11 h-11 [flex:0_0_2.75rem] items-center justify-center rounded-full font-[800] text-sm leading-[1] font-heading bg-[#ffe5cf] text-[#7d390f] [user-select:none] overflow-hidden [&.avatar-tone-1]:bg-[#dcece6] [&.avatar-tone-1]:text-[#265b49] [&.avatar-tone-2]:bg-[#e2e8f5] [&.avatar-tone-2]:text-[#3e5278] [&.avatar-tone-3]:bg-[#f4e1df] [&.avatar-tone-3]:text-[#814c45] [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:rounded-[inherit] [.podium-portrait_&]:w-25 [.podium-portrait_&]:h-25 [.podium-portrait_&]:[flex-basis:6.25rem] [.podium-portrait_&]:[border:4px_solid_currentColor] [.podium-portrait_&]:p-[0.1875rem] [.podium-portrait_&]:bg-card [.podium-portrait_&]:[outline:3px_solid_var(--surface)] [.podium-portrait_&]:text-[inherit] [.podium-portrait_&_img]:w-full [.podium-portrait_&_img]:h-full [.podium-portrait_&_img]:object-cover [.podium-portrait_&_img]:rounded-full [.place-1_.podium-portrait_&]:w-31 [.place-1_.podium-portrait_&]:h-31 [.place-1_.podium-portrait_&]:[flex-basis:7.75rem] max-[48rem]:[.podium-portrait_&]:w-16 max-[48rem]:[.podium-portrait_&]:h-16 max-[48rem]:[.podium-portrait_&]:[flex-basis:4rem] max-[48rem]:[.podium-portrait_&]:[border-width:3px] max-[48rem]:[.podium-portrait_&]:p-0.5 max-[48rem]:[.podium-portrait_&]:[outline-width:2px] max-[48rem]:[.place-1_.podium-portrait_&]:w-19 max-[48rem]:[.place-1_.podium-portrait_&]:h-19 max-[48rem]:[.place-1_.podium-portrait_&]:[flex-basis:4.75rem] [.profile-avatar-overlap_&]:w-40 [.profile-avatar-overlap_&]:h-40 [.profile-avatar-overlap_&]:[flex-basis:10rem] [.profile-avatar-overlap_&]:[border:6px_solid_#fffcf8] [.profile-avatar-overlap_&]:overflow-hidden [.profile-avatar-overlap_&_img]:w-full [.profile-avatar-overlap_&_img]:h-full [.profile-avatar-overlap_&_img]:object-cover max-[76rem]:[.profile-avatar-overlap_&]:w-32 max-[76rem]:[.profile-avatar-overlap_&]:h-32 max-[76rem]:[.profile-avatar-overlap_&]:[flex-basis:8rem] max-[48rem]:[.profile-avatar-overlap_&]:w-23 max-[48rem]:[.profile-avatar-overlap_&]:h-23 max-[48rem]:[.profile-avatar-overlap_&]:[flex-basis:5.75rem] max-[48rem]:[.profile-avatar-overlap_&]:[border-width:4px] [.social-byline_&]:w-10 [.social-byline_&]:h-10 [.social-byline_&]:shrink-0 [.participant-faces_&]:w-8.5 [.participant-faces_&]:h-8.5 [.participant-faces_&]:[border:2px_solid_var(--surface)] [.composer-collapsed_.composer-entry_&]:w-9 [.composer-collapsed_.composer-entry_&]:h-9 [.composer-collapsed_.composer-entry_&]:[flex-basis:2.25rem] max-[48rem]:[.post-heading_>_&]:w-9 max-[48rem]:[.post-heading_>_&]:h-9 max-[48rem]:[.post-heading_>_&]:[flex-basis:2.25rem] [@media(hover:_hover)]:[.profile-preview-trigger_&_img]:[transition:filter_140ms] [@media(hover:_hover)]:[.profile-preview-trigger:hover_&_img]:[filter:brightness(1.06)] [.profile-preview-body_>_&]:w-19 [.profile-preview-body_>_&]:h-19 [.profile-preview-body_>_&]:mt-[-2rem] [.profile-preview-body_>_&]:[border:4px_solid_var(--surface)] [.profile-preview-body_>_&]:relative max-[48rem]:[.post-heading_>_.profile-preview-trigger_&]:w-9 max-[48rem]:[.post-heading_>_.profile-preview-trigger_&]:h-9 max-[48rem]:[.post-heading_>_.profile-preview-trigger_&]:[flex-basis:2.25rem] [.dark_.profile-preview-body_>_&]:border-[#171717] [.event-attendee-faces_&]:w-13 [.event-attendee-faces_&]:h-13 avatar-tone-' +
        tone +
        (small
          ? ' avatar-small [.community-avatar&]:w-8.5 [.community-avatar&]:h-8.5 [.community-avatar&]:[flex-basis:2.125rem] [.community-avatar&]:text-xs'
          : '') +
        (large
          ? ' avatar-large [.community-avatar&]:w-22 [.community-avatar&]:h-22 [.community-avatar&]:[flex-basis:5.5rem] [.community-avatar&]:text-2xl max-[40rem]:[.avatar-selection-preview_&]:w-16 max-[40rem]:[.avatar-selection-preview_&]:h-16 max-[40rem]:[.avatar-selection-preview_&]:[flex-basis:4rem]'
          : '')
      }
      aria-hidden="true"
    >
      {safe ? (
        <AvatarImage
          src={displayedImage.url}
          alt=""
          width={192}
          height={192}
          loading="lazy"
          onError={() => setFailedUrl(displayedImage.url)}
        />
      ) : null}
      <AvatarFallback className="bg-transparent text-current">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
