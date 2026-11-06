import type { SearchParams } from '@/features/workflows/server'
import { ApplicationsPage } from '@/features/workflows/private-pages'
export const metadata = { robots: { index: false, follow: false } }
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <ApplicationsPage shelter searchParams={searchParams} />
}
