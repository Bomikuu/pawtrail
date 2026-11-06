import 'server-only'
import { cache } from 'react'
import {
  PersonByline,
  ParticipantFaces,
  UnavailableIdentity,
} from '@/components/shared/social-card'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { PublicIdentity } from '@/features/users/types'

type PendingIdentity = {
  id: string
  resolve(value: PublicIdentity | null): void
}

/** React.cache scopes this loader to the current server render, including its API/session. */
const identitiesFor = cache((api: PawTrailApi) => {
  const requested = new Map<string, Promise<PublicIdentity | null>>()
  const pending: PendingIdentity[] = []
  let scheduled = false
  function schedule() {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      void flush()
    })
  }
  async function flush() {
    const batch = pending.splice(0, 50)
    if (!batch.length) return
    try {
      const result = await api.users.identities({
        ids: batch.map((item) => item.id),
      })
      const wanted = new Set(batch.map((item) => item.id))
      const found = new Map(
        result.items
          .filter((person) => wanted.has(person.id))
          .map((person) => [person.id, person]),
      )
      for (const item of batch) item.resolve(found.get(item.id) ?? null)
    } catch {
      // Optional attribution must not prevent the resource or its real actions loading.
      for (const item of batch) item.resolve(null)
    }
    if (pending.length) schedule()
  }
  return (id: string) => {
    const existing = requested.get(id)
    if (existing) return existing
    const result = new Promise<PublicIdentity | null>((resolve) =>
      pending.push({ id, resolve }),
    )
    requested.set(id, result)
    schedule()
    return result
  }
})

export async function ContributorLine({
  api,
  id,
  meta,
  fallback = 'Community organizer',
}: {
  api: PawTrailApi
  id: string
  meta?: string
  fallback?: string
}) {
  const person = await identitiesFor(api)(id)
  return person ? (
    <PersonByline person={person} meta={meta} />
  ) : (
    <UnavailableIdentity label={fallback} meta={meta} />
  )
}
export async function ContributorFaces({
  api,
  ids,
  href,
}: {
  api: PawTrailApi
  ids: string[]
  href: string
}) {
  const people = (
    await Promise.all([...new Set(ids)].slice(0, 50).map(identitiesFor(api)))
  ).flatMap((person) => (person ? [person] : []))
  return people.length ? (
    <ParticipantFaces
      people={people.slice(0, 4)}
      href={href}
      label="Public care circle"
    />
  ) : (
    <p className="contributor-empty">
      Public contributor profiles aren’t available here yet.
    </p>
  )
}
