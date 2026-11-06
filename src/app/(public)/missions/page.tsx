import { listingMetadata } from '@/lib/seo/listing-metadata'
import { MissionsPage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Community help missions — PawTrail',
  description:
    'Find animal care missions near you, from feeding and transport to rescue support, and contribute where you can.',
  path: '/missions',
})
export { MissionsPage as default } from '@/features/workflows/public-pages'
