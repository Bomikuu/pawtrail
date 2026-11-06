'use client'
import { useRouter } from 'next/navigation'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { SignInPrompt } from '@/components/shared/sign-in-prompt'
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
      <SignInPrompt
        href={loginPath(path)}
        label="Sign in to share an update"
        placeholder={`Share a moment or a care update about ${name}…`}
        description={`Post as yourself and tag ${name} so the community can follow along.`}
      />
    )
  return (
    <div
      className={
        'pet-community-composer [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [border:1px_solid_#e8ddcf] rounded-2xl overflow-hidden bg-card [&_>_p]:m-0 [&_>_p]:[padding:0.75rem_1rem] [&_>_p]:text-xs [&_>_p]:text-muted-foreground [&_>_p]:[border-bottom:1px_solid_#eee5d8]'
      }
    >
      <p>
        Posting as <strong>{session.actor.displayName}</strong>. Keep {name}’s
        tag to include your update in this pet’s feed.
      </p>
      <PostComposer
        compact
        key={session.cacheScope + ':' + id}
        options={[{ ref: { kind: 'animal', id }, title: name, href: path }]}
        initialRefs={[{ kind: 'animal', id }]}
        prompt={'Share an update about ' + name}
        onComplete={() => router.refresh()}
      />
    </div>
  )
}
