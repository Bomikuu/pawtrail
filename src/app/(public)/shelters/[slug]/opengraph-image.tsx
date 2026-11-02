import { entityOg } from '@/lib/seo/shared-og'
export const alt = 'PawTrail — Every Paw Has a Story'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return entityOg('shelters', (await params).slug)
}
