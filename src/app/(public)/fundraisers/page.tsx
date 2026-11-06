import { listingMetadata } from '@/lib/seo/listing-metadata'
import { FundraisersPage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Animal welfare fundraisers — PawTrail',
  description:
    'Discover community fundraisers supporting animal care, medical treatment, and shelter needs.',
  path: '/fundraisers',
})
export { FundraisersPage as default } from '@/features/workflows/public-pages'
