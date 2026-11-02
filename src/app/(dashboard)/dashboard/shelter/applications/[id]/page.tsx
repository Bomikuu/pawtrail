import { ApplicationPage } from '@/features/workflows/private-pages'
export const metadata = { robots: { index: false, follow: false } }
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <ApplicationPage id={(await params).id} />
}
