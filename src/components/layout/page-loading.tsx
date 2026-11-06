import { AnimalLoader } from '@/components/shared/animal-loader'

/** One visual state, shared by immediate navigation and streamed route fallbacks. */
export function PageLoading() {
  return (
    <div className="page-loading">
      <AnimalLoader label="Following the pawprints…" />
    </div>
  )
}
