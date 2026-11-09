import { redirect } from 'next/navigation'
export const metadata = { robots: { index: false, follow: false } }
export default async function SightingCapturePage({ searchParams }: { searchParams: Promise<{ animalId?: string }> }) {
  const query = await searchParams
  redirect('/spot' + (query.animalId ? '?animal=' + encodeURIComponent(query.animalId) : ''))
}
