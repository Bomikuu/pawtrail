import { ManageCampaignPage } from '@/features/workflows/private-pages'
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <ManageCampaignPage id={(await params).id} />
}
