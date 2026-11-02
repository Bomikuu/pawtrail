import type { z } from 'zod'
import type { imageSchema } from '@/lib/api/schemas'

/** Owner-supplied, curated illustrations. IDs are stable across profile changes. */
export const avatarPresets = [
  {
    id: 'pawtrail-avatar-01',
    label: 'Cat companion',
    src: '/images/avatars/avatar-01.webp',
  },
  {
    id: 'pawtrail-avatar-02',
    label: 'Helping hand',
    src: '/images/avatars/avatar-02.webp',
  },
  {
    id: 'pawtrail-avatar-03',
    label: 'Glasses and gray cat',
    src: '/images/avatars/avatar-03.webp',
  },
  {
    id: 'pawtrail-avatar-04',
    label: 'Dog hug',
    src: '/images/avatars/avatar-04.webp',
  },
  {
    id: 'pawtrail-avatar-05',
    label: 'Trail cap',
    src: '/images/avatars/avatar-05.webp',
  },
  {
    id: 'pawtrail-avatar-06',
    label: 'Paw headphones',
    src: '/images/avatars/avatar-06.webp',
  },
  {
    id: 'pawtrail-avatar-07',
    label: 'Pet photographer',
    src: '/images/avatars/avatar-07.webp',
  },
  {
    id: 'pawtrail-avatar-08',
    label: 'Cat cuddle',
    src: '/images/avatars/avatar-08.webp',
  },
  {
    id: 'pawtrail-avatar-09',
    label: 'Orange beanie',
    src: '/images/avatars/avatar-09.webp',
  },
  {
    id: 'pawtrail-avatar-10',
    label: 'Care coat',
    src: '/images/avatars/avatar-10.webp',
  },
  {
    id: 'pawtrail-avatar-11',
    label: 'Teal scrubs',
    src: '/images/avatars/avatar-11.webp',
  },
  {
    id: 'pawtrail-avatar-12',
    label: 'Laptop friend',
    src: '/images/avatars/avatar-12.webp',
  },
  {
    id: 'pawtrail-avatar-13',
    label: 'Sunhat and dog',
    src: '/images/avatars/avatar-13.webp',
  },
  {
    id: 'pawtrail-avatar-14',
    label: 'Cap and gray cat',
    src: '/images/avatars/avatar-14.webp',
  },
  {
    id: 'pawtrail-avatar-15',
    label: 'Music lover',
    src: '/images/avatars/avatar-15.webp',
  },
  {
    id: 'pawtrail-avatar-16',
    label: 'Book and cat',
    src: '/images/avatars/avatar-16.webp',
  },
  {
    id: 'pawtrail-avatar-17',
    label: 'Peace and paws',
    src: '/images/avatars/avatar-17.webp',
  },
  {
    id: 'pawtrail-avatar-18',
    label: 'Puppy passenger',
    src: '/images/avatars/avatar-18.webp',
  },
  {
    id: 'pawtrail-avatar-19',
    label: 'Cap and black cat',
    src: '/images/avatars/avatar-19.webp',
  },
  {
    id: 'pawtrail-avatar-20',
    label: 'Trail headband',
    src: '/images/avatars/avatar-20.webp',
  },
  {
    id: 'pawtrail-avatar-21',
    label: 'Cozy scarf',
    src: '/images/avatars/avatar-21.webp',
  },
  {
    id: 'pawtrail-avatar-22',
    label: 'Outdoor explorer',
    src: '/images/avatars/avatar-22.webp',
  },
  {
    id: 'pawtrail-avatar-23',
    label: 'Cat hoodie',
    src: '/images/avatars/avatar-23.webp',
  },
  {
    id: 'pawtrail-avatar-24',
    label: 'Cat nap',
    src: '/images/avatars/avatar-24.webp',
  },
  {
    id: 'pawtrail-avatar-25',
    label: 'Flower crown and dog',
    src: '/images/avatars/avatar-25.webp',
  },
  {
    id: 'pawtrail-avatar-26',
    label: 'Camera explorer',
    src: '/images/avatars/avatar-26.webp',
  },
  {
    id: 'pawtrail-avatar-27',
    label: 'White cat hug',
    src: '/images/avatars/avatar-27.webp',
  },
  {
    id: 'pawtrail-avatar-28',
    label: 'Sunny day',
    src: '/images/avatars/avatar-28.webp',
  },
  {
    id: 'pawtrail-avatar-29',
    label: 'Hydration buddy',
    src: '/images/avatars/avatar-29.webp',
  },
  {
    id: 'pawtrail-avatar-30',
    label: 'Dog and glasses',
    src: '/images/avatars/avatar-30.webp',
  },
] as const

export function getAvatarPreset(id: string | null | undefined) {
  return avatarPresets.find((avatar) => avatar.id === id)
}

export function avatarPresetImage(
  id: string,
): z.infer<typeof imageSchema> | null {
  const preset = getAvatarPreset(id)
  return preset
    ? {
        id: preset.id,
        url: preset.src,
        alt: preset.label + ' — illustrated profile avatar',
        provenance: {
          kind: 'real',
          label: 'Owner-supplied PawTrail illustration',
        },
      }
    : null
}

export function personAvatar(
  image: z.infer<typeof imageSchema> | null | undefined,
  userId: string,
) {
  if (image) return image
  const index =
    Array.from(userId).reduce(
      (sum, letter) => (sum * 31 + letter.charCodeAt(0)) >>> 0,
      0,
    ) % avatarPresets.length
  return avatarPresetImage(avatarPresets[index].id)!
}
