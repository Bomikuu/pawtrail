import { AnimalReportPage } from '@/features/workflows/public-pages'
export const metadata = {
  title: 'PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page() {
  return <AnimalReportPage />
}
