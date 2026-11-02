import { EventCreatePage } from '@/features/workflows/public-pages'
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <EventCreatePage id={(await params).id} />
}
