import { AnimalEditPage } from '@/features/workflows/private-pages'
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return <AnimalEditPage slug={(await params).slug} />
}
