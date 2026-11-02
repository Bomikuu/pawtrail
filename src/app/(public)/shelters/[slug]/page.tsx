import { ShelterPage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('shelters', (await params).slug)
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <ShelterPage slug={(await params).slug} />
}
