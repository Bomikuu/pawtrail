import { CaptureFlow } from '@/features/capture/capture-flow'
export default async function SpotPage({ searchParams }: { searchParams: Promise<{ animal?: string; observation?: string }> }) {
  const query = await searchParams
  return <CaptureFlow requestedAnimal={query.animal} observationId={query.observation} />
}
