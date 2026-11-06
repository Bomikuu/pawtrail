import { listingMetadata } from '@/lib/seo/listing-metadata'
import { getServerApi } from '@/lib/api/server'
import { loadLandingData } from '@/features/marketing/data'
import { LandingPage } from '@/features/marketing/landing-page'
import '@/features/marketing/marketing.css'
export const metadata = listingMetadata({
  title: 'PawTrail — Every Paw Has a Story',
  description:
    'Discover animals, find companions responsibly, and connect with neighbors through stories and practical animal care.',
  path: '/',
})
export default async function Page() {
  const data = await loadLandingData(await getServerApi())
  return <LandingPage data={data} />
}
