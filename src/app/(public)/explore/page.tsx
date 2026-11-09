import { listingMetadata } from '@/lib/seo/listing-metadata'
import { ExplorePage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Animal directory — PawTrail',
  description:
    'Discover animals and recent sightings in your neighborhood, follow their care, and find practical ways to help.',
  path: '/explore',
})
export default ExplorePage
