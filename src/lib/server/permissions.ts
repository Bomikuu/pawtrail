import 'server-only'
import type { Actor } from '@/features/auth/types'
export type Permission =
  | 'view_application'
  | 'review_application'
  | 'manage_shelter'
  | 'manage_resource'
  | 'moderate'
  | 'verify'
  | 'contribute'
export interface OwnedResource {
  ownerId?: string | null
  applicantId?: string | null
  shelterId?: string | null
  creatorId?: string | null
}
export function can(
  actor: Actor,
  action: Permission,
  resource?: OwnedResource,
): boolean {
  const staff =
    actor.roles.includes('shelter_staff') &&
    !!resource?.shelterId &&
    actor.shelterIds.includes(resource.shelterId)
  switch (action) {
    case 'view_application':
      return resource?.applicantId === actor.id || staff
    case 'review_application':
    case 'manage_shelter':
      return staff
    case 'manage_resource':
      return resource?.ownerId === actor.id || staff
    case 'moderate':
      return actor.roles.includes('moderator')
    case 'verify':
      return (
        actor.roles.includes('moderator') &&
        !!resource?.creatorId &&
        resource.creatorId !== actor.id
      )
    case 'contribute':
      return actor.roles.includes('member')
    default:
      return false
  }
}
