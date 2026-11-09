import { privateApi } from '@/features/workflows/server'
import { LandingWorkspace } from '@/features/landing-pages/workspace'
export const metadata = {
  title: 'Organization websites | PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page() {
  await privateApi('/dashboard/pages')
  return <LandingWorkspace />
}
