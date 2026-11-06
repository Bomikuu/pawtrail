import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PawTrail — Every Paw Has a Story',
    short_name: 'PawTrail',
    description:
      'Animal stories, responsible adoption, and practical care in your neighborhood.',
    start_url: '/community',
    scope: '/',
    display: 'standalone',
    background_color: '#fffbf5',
    theme_color: '#f97316',
    icons: [
      {
        src: '/icons/pawtrail-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/pawtrail-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
