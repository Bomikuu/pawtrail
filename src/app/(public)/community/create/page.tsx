import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { redirect } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { loginPath } from '@/features/auth/return-path'
import { PostComposer } from '@/features/community/post-composer'
import { communityChoices } from '@/features/community/service'
export default async function CreatePostPage() {
  const api = await getServerApi()
  const session = await api.auth.session()
  if (!session.actor) redirect(loginPath('/community/create'))
  return (
    <div
      className={
        'community-detail max-w-184 [margin:0_auto] [&_>_h1]:[margin:1rem_0_1.5rem] [.management-shell_&]:max-w-none [.management-shell_&]:w-full'
      }
    >
      <Link href="/community">Back to the journal</Link>
      <h1>Share a little of their world</h1>
      <PostComposer options={await communityChoices(api)} />
    </div>
  )
}
