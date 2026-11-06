import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { ApiError } from '@/lib/api/errors'
import { PostDetail } from '@/features/community/post-card'
import { communityChoices } from '@/features/community/service'
export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const api = await getServerApi()
  try {
    const [initial, session, options] = await Promise.all([
      api.community.get(id),
      api.auth.session(),
      communityChoices(api),
    ])
    return (
      <div
        className={
          'community-detail max-w-184 [margin:0_auto] [&_>_h1]:[margin:1rem_0_1.5rem] [.management-shell_&]:max-w-none [.management-shell_&]:w-full'
        }
      >
        <Link href="/community">Back to the journal</Link>
        <h1>A story from the community</h1>
        <PostDetail
          initial={initial}
          scope={session.cacheScope}
          options={options}
        />
      </div>
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }
}
