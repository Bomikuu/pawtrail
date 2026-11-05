'use client'
import { DataState } from '@/components/shared/data-state'
export default function CommunityError({ retry }: { retry(): void }) {
  return (
    <DataState
      state="error"
      retry={retry}
      errorMessage="The community feed couldn’t load. Please try again."
    />
  )
}
