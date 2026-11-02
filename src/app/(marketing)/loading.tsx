import { DataState } from '@/components/shared/data-state'
export default function Loading() {
  return (
    <main aria-label="Loading PawTrail">
      <DataState state="loading" />
    </main>
  )
}
