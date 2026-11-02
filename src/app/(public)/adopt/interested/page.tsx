import { AdoptPage } from '@/features/workflows/public-pages'
import type { SearchParams } from '@/features/workflows/server'
export const metadata = { robots: { index: false, follow: false } }
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <AdoptPage interested searchParams={searchParams} />
}
