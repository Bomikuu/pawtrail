'use client'
import { DataState } from '@/components/shared/data-state'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <DataState
      state="error"
      errorMessage="This profile couldn’t load. Please try again."
      retry={reset}
    />
  )
}
