import { EventPage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
import type { SearchParams } from '@/features/workflows/server'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('events', (await params).slug)
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return <EventPage slug={(await params).slug} searchParams={searchParams} />
}
