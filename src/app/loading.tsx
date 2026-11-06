import { AnimalLoader } from '@/components/shared/animal-loader'
export default function Loading() {
  return (
    <div className="page-loading">
      <AnimalLoader label="Opening PawTrail…" />
    </div>
  )
}
