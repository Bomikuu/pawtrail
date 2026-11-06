import { listingMetadata } from '@/lib/seo/listing-metadata'
export const metadata = listingMetadata({
  title: 'Adopt responsibly — PawTrail',
  description:
    'Meet animals looking for a home, learn their needs, and connect with their carers through responsible adoption.',
  path: '/adopt',
})
export { AdoptPage as default } from '@/features/workflows/public-pages'
