'use client'
import { DataState } from '@/components/shared/data-state'
export default function Error({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <DataState
      state="error"
      retry={retry}
      errorMessage="This animal’s story couldn’t load. Please try again."
    />
  )
}
