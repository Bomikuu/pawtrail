'use client'
import { DataState } from '@/components/shared/data-state'
import { ButtonLink } from '@/components/ui/button-link'
export default function Error({ retry }: { retry: () => void }) {
  return (
    <>
      <DataState
        state="error"
        errorMessage="This event view couldn’t load. Try again, or return to all community events."
        retry={retry}
      />
      <ButtonLink variant="outline" href="/events">
        All community events
      </ButtonLink>
    </>
  )
}
