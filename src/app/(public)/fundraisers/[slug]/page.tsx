import type { SearchParams } from '@/features/workflows/server'
import { FundraiserPage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('fundraisers', (await params).slug)
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  return (
    <FundraiserPage slug={(await params).slug} searchParams={searchParams} />
  )
}
