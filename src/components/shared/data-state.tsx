'use client'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
export function DataState({
  state,
  retry,
  emptyAction,
  children,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Try another filter or add your first update.',
  errorMessage = 'We couldn’t load this content. Check your connection and try again.',
  emptyIllustration = 'caught-up',
}: {
  state: 'loading' | 'empty' | 'error' | 'ready'
  retry?: () => void
  emptyAction?: ReactNode
  children?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  errorMessage?: string
  emptyIllustration?: 'caught-up'
}) {
  if (state === 'ready') return <>{children}</>
  if (state === 'loading')
    return (
      <div className="data-state" role="status" aria-busy="true">
        <span className="sr-only">Loading content…</span>
        <div className="skeleton skeleton-heading" aria-hidden="true" />
        <div className="skeleton skeleton-story" aria-hidden="true" />
        <div className="skeleton skeleton-line" aria-hidden="true" />
      </div>
    )
  if (state === 'error')
    return (
      <div className="data-state">
        <p role="alert">{errorMessage}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    )
  return (
    <div className="data-state">
      {emptyIllustration && (
        <img
          className="empty-illustration"
          src={'/images/pawtrail/' + emptyIllustration + '.webp'}
          width={239}
          height={119}
          alt=""
          loading="lazy"
        />
      )}
      <h2>{emptyTitle}</h2>
      <p>{emptyDescription}</p>
      {emptyAction}
    </div>
  )
}
