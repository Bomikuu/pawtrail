'use client'
import { useLinkStatus } from 'next/link'
import { AnimalLoader } from '@/components/shared/animal-loader'

export function LinkPending() {
  const { pending } = useLinkStatus()
  return (
    <span
      className={`link-pending${pending ? ' is-pending' : ''}`}
      aria-hidden={!pending}
    >
      {pending && <AnimalLoader compact label="Opening page…" />}
    </span>
  )
}
