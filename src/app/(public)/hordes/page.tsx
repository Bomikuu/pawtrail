import { listingMetadata } from '@/lib/seo/listing-metadata'
import { HordesPage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Neighborhood Hordes — PawTrail',
  description:
    'Meet the community animal groups in your neighborhood and the people coordinating their care.',
  path: '/hordes',
})
export { HordesPage as default } from '@/features/workflows/public-pages'
