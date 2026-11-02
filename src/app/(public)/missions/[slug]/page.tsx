import { MissionPage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('missions', (await params).slug)
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <MissionPage slug={(await params).slug} />
}
