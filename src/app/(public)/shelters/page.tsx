import { listingMetadata } from '@/lib/seo/listing-metadata'
import { SheltersPage } from '@/features/workflows/public-pages'
export const metadata = listingMetadata({
  title: 'Shelters and rescuers — PawTrail',
  description:
    'Find animal shelters and rescue organizations, explore their animals, and learn how to support their work.',
  path: '/shelters',
})
export { SheltersPage as default } from '@/features/workflows/public-pages'
