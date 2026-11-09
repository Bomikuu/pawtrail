import { privateApi } from '@/features/workflows/server'
import { LandingEditor } from '@/features/landing-pages/editor'
export const metadata = {
  title: 'Pixelcore Studio | PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await privateApi('/dashboard/pages/' + id)
  return <LandingEditor id={id} />
}
