import { listingMetadata } from '@/lib/seo/listing-metadata'
import { ExplorePage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Explore nearby animals — PawTrail',
  description:
    'Discover animals and recent sightings in your neighborhood, follow their care, and find practical ways to help.',
  path: '/explore',
})
export { ExplorePage as default } from '@/features/workflows/public-pages'
