import { HordePage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('hordes', (await params).slug)
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <HordePage slug={(await params).slug} />
}
