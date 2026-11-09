import { CaptureAnimalRecord } from '@/features/capture/animal-record'
export default async function AnimalRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CaptureAnimalRecord id={id} />
}
