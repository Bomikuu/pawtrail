'use client'
import { DataState } from '@/components/shared/data-state'
export default function CommunityError({ reset }: { reset(): void }) {
  return (
    <DataState
      state="error"
      retry={reset}
      errorMessage="The journal couldn’t load. Please try again."
    />
  )
}
