import { listingMetadata } from '@/lib/seo/listing-metadata'
import { SearchPage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Search PawTrail',
  description:
    'Search for animals, people, stories, events, and practical ways to help your community.',
  path: '/search',
  index: false,
})
export { SearchPage as default } from '@/features/workflows/public-pages'
