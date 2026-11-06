import { listingMetadata } from '@/lib/seo/listing-metadata'
export const metadata = listingMetadata({
  title: 'Community gatherings — PawTrail',
  description:
    'Find animal welfare events, meet local helpers, and reserve a place at a community gathering.',
  path: '/events',
})
export { EventsPage as default } from '@/features/workflows/public-pages'
