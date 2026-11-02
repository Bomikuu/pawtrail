'use client'
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
    <span
      className={
        'community-avatar avatar-tone-' +
        tone +
        (small ? ' avatar-small' : '') +
        (large ? ' avatar-large' : '')
      }
      aria-hidden="true"
    >
      {safe ? (
        <img
          src={displayedImage.url}
          alt=""
          width={192}
          height={192}
          loading="lazy"
          onError={() => setFailedUrl(displayedImage.url)}
        />
      ) : (
        initials
      )}
    </span>
  )
}
