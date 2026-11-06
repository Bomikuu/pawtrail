'use client'
import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { ButtonLink } from '@/components/ui/button-link'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { Follow } from '@/features/follows/types'
export function FollowButton({
  target,
  name,
  returnTo,
  compact = false,
}: {
  target: Follow['target']
  name: string
  returnTo: string
  compact?: boolean
}) {
  const { session, pending: changing } = useSession()
  const client = useQueryClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const self = target.kind === 'user' && target.id === session.actor?.id
  const follows = useQuery({
    queryKey: queryKeys(session.cacheScope).list('follows'),
    enabled: !!session.actor && !self,
    queryFn: async ({ signal }) => {
      const items: Follow[] = []
      let cursor: string | undefined
      do {
        const page = await getBrowserApi().follows.list(
          { limit: 50, ...(cursor ? { cursor } : {}) },
          { signal },
        )
        items.push(...page.items)
        cursor = page.nextCursor ?? undefined
      } while (cursor)
      return items
    },
  })
  if (self) return null
  if (!session.actor)
    return (
      <ButtonLink
        href={loginPath(returnTo)}
        variant={compact ? 'ghost' : 'outline'}
        aria-label={'Sign in to follow ' + name}
        className={
          compact
            ? 'follow-compact [.app-shell_&]:min-h-9 [.app-shell_&]:[padding:0.375rem_0.5rem] [.app-shell_&]:text-[0.8125rem] [.app-shell_&]:text-[color:var(--teal)]'
            : undefined
        }
      >
        {compact ? 'Follow' : 'Sign in to follow ' + name}
      </ButtonLink>
    )
  const followed =
    follows.data?.some(
      (edge) =>
        edge.target.kind === target.kind && edge.target.id === target.id,
    ) ?? false
  async function toggle() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setError('')
    try {
      await getBrowserApi().follows.set(target, !followed)
      await Promise.all(
        [
          'follows',
          'community',
          'users',
          'animals',
          'dashboard',
          'notifications',
        ].map((domain) =>
          client.invalidateQueries({
            queryKey: queryKeys(session.cacheScope).all(domain),
          }),
        ),
      )
      router.refresh()
    } catch {
      setError('Couldn’t update following. Please try again.')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }
  return (
    <span
      className={
        'follow-control inline-flex flex-wrap gap-2 items-center max-w-full [&_[role=alert]]:text-sm [.profile-supported-animals_&]:[flex:0_0_auto] [.event-host_&]:flex [.event-host_&]:mt-3'
      }
    >
      <Button
        variant={compact ? 'ghost' : 'outline'}
        className={
          compact
            ? 'follow-compact [.app-shell_&]:min-h-9 [.app-shell_&]:[padding:0.375rem_0.5rem] [.app-shell_&]:text-[0.8125rem] [.app-shell_&]:text-[color:var(--teal)]'
            : undefined
        }
        aria-label={(followed ? 'Unfollow ' : 'Follow ') + name}
        aria-pressed={followed}
        loading={saving || follows.isPending}
        disabled={saving || changing || follows.isPending || follows.isError}
        onClick={toggle}
      >
        {compact
          ? followed
            ? 'Following'
            : 'Follow'
          : `${followed ? 'Unfollow' : 'Follow'} ${name}`}
      </Button>
      {follows.isError && (
        <>
          <span role="alert">Following couldn’t load.</span>
          <Button variant="outline" onClick={() => void follows.refetch()}>
            Retry following
          </Button>
        </>
      )}
      {error && <span role="alert">{error}</span>}
    </span>
  )
}
