import 'server-only'
import { cache } from 'react'
import {
  PersonByline,
  ParticipantFaces,
  UnavailableIdentity,
} from '@/components/shared/social-card'
import type { PawTrailApi } from '@/lib/api/contracts'

const publicPerson = cache(async (api: PawTrailApi, id: string) => {
  try {
    const user = await api.users.get(id)
    return user.id === id && user.summary !== null ? user : null
  } catch {
    return null
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
  const person = await publicPerson(api, id)
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
    await Promise.all(
      [...new Set(ids)].slice(0, 4).map((id) => publicPerson(api, id)),
    )
  ).flatMap((p) => (p ? [p] : []))
  return (
    <ParticipantFaces people={people} href={href} label="Public care circle" />
  )
}
