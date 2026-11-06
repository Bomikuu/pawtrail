import { AnimalLoader } from '@/components/shared/animal-loader'
export default function Loading() {
  return (
    <div className="journal-empty">
      <AnimalLoader label="Finding the next part of the story…" />
    </div>
  )
}
