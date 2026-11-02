import type { Metadata } from 'next'
import { getServerApi } from '@/lib/api/server'
import { getApiConfig } from '@/lib/api/config'
import { loadLandingData } from '@/features/marketing/data'
import { LandingPage } from '@/features/marketing/landing-page'
import '@/features/marketing/marketing.css'
export function generateMetadata(): Metadata {
  return {
    title: 'PawTrail — Every Paw Has a Story.',
    description:
      'Discover animals, find companions, and connect through a caring pet community.',
    robots:
      getApiConfig().mode === 'mock'
        ? { index: false, follow: false }
        : undefined,
  }
}
export default async function Page() {
  const data = await loadLandingData(await getServerApi())
  return <LandingPage data={data} />
}
