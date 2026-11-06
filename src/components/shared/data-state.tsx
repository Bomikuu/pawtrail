'use client'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AnimalLoader } from './animal-loader'
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
      <div
        className={
          'data-state [padding:2rem_0] [&_h2]:[margin:0_0_0.5rem] [&_h2]:text-2xl [&_p]:max-w-[65ch] [&_p]:[margin:0_0_1.25rem] [.platform-shell_&]:[padding:2rem_1.25rem] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:bg-card [.app-shell_&]:rounded-2xl [.app-shell_&]:my-4 [.app-shell_&]:p-6 [.app-shell_&_h2]:text-xl [.marketing-preview-state_&]:[margin:0_0_1rem] [.marketing-preview-state_&_h2]:text-xl'
        }
        aria-busy="true"
      >
        <AnimalLoader label="Gathering the latest pawprints…" />
        <div
          className={
            'skeleton bg-border rounded-lg mb-4 [.dark_&]:bg-[#2c2c2c] skeleton-heading w-[45%] h-7'
          }
          aria-hidden="true"
        />
        <div
          className={
            'skeleton bg-border rounded-lg mb-4 [.dark_&]:bg-[#2c2c2c] skeleton-story w-full h-48'
          }
          aria-hidden="true"
        />
        <div
          className={
            'skeleton bg-border rounded-lg mb-4 [.dark_&]:bg-[#2c2c2c] skeleton-line w-[75%] h-4'
          }
          aria-hidden="true"
        />
      </div>
    )
  if (state === 'error')
    return (
      <div
        className={
          'data-state [padding:2rem_0] [&_h2]:[margin:0_0_0.5rem] [&_h2]:text-2xl [&_p]:max-w-[65ch] [&_p]:[margin:0_0_1.25rem] [.platform-shell_&]:[padding:2rem_1.25rem] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:bg-card [.app-shell_&]:rounded-2xl [.app-shell_&]:my-4 [.app-shell_&]:p-6 [.app-shell_&_h2]:text-xl [.marketing-preview-state_&]:[margin:0_0_1rem] [.marketing-preview-state_&_h2]:text-xl'
        }
      >
        <p role="alert">{errorMessage}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    )
  return (
    <div
      className={
        'data-state [padding:2rem_0] [&_h2]:[margin:0_0_0.5rem] [&_h2]:text-2xl [&_p]:max-w-[65ch] [&_p]:[margin:0_0_1.25rem] [.platform-shell_&]:[padding:2rem_1.25rem] [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:bg-card [.app-shell_&]:rounded-2xl [.app-shell_&]:my-4 [.app-shell_&]:p-6 [.app-shell_&_h2]:text-xl [.marketing-preview-state_&]:[margin:0_0_1rem] [.marketing-preview-state_&_h2]:text-xl'
      }
    >
      {emptyIllustration && (
        <img
          className={
            'empty-illustration block w-[min(11rem,_65%)] h-auto [margin:0_0_1.25rem] [mix-blend-mode:multiply] [.app-shell_.data-state_&]:block [.app-shell_.data-state_&]:w-40 [.app-shell_.data-state_&]:max-w-[70%] [.app-shell_.data-state_&]:h-auto [.app-shell_.data-state_&]:[margin:0_auto_1rem]'
          }
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
