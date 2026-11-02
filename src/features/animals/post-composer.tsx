'use client'
import { useRouter } from 'next/navigation'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { ButtonLink } from '@/components/ui/button-link'
import { PostComposer } from '@/features/community/post-composer'
export function AnimalPostComposer({
  id,
  name,
  slug,
}: {
  id: string
  name: string
  slug: string
}) {
  const { session } = useSession()
  const router = useRouter()
  const path = '/pets/' + encodeURIComponent(slug)
  if (!session.actor)
    return (
      <div className="pet-composer-signin">
        <p>
          Have an update about {name}? Share it as yourself and tag this pet.
        </p>
        <ButtonLink variant="outline" href={loginPath(path)}>
          Sign in to share an update
        </ButtonLink>
      </div>
    )
  return (
    <div className="pet-community-composer">
      <p>
        Posting as <strong>{session.actor.displayName}</strong>. Keep {name}’s
        tag to include your update in this pet’s feed.
      </p>
      <PostComposer
        key={session.cacheScope + ':' + id}
        options={[{ ref: { kind: 'animal', id }, title: name, href: path }]}
        initialRefs={[{ kind: 'animal', id }]}
        prompt={'Share an update about ' + name}
        onComplete={() => router.refresh()}
      />
    </div>
  )
}
