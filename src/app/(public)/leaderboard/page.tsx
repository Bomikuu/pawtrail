import { listingMetadata } from '@/lib/seo/listing-metadata'
export const metadata = listingMetadata({
  title: 'PawPal Leaderboard — PawTrail',
  description:
    'Recognize the people making a difference for animals through approved missions, sightings, and community support.',
  path: '/leaderboard',
})
export { CommunityLeaderboard as default } from '@/features/kibble/leaderboard'
