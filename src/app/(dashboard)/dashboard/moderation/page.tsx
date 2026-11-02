import { getServerApi } from '@/lib/api/server'
import { DataState } from '@/components/shared/data-state'
import { ReviewQueue } from '@/features/moderation/review-queue'
export default async function ModerationPage() {
  const api = await getServerApi()
  const session = await api.auth.session()
  if (!session.roles.includes('moderator'))
    return (
      <DataState
        state="error"
        errorMessage="This review queue is restricted to authorized moderators."
      />
    )
  return (
    <div className="community-detail">
      <h1>Community review</h1>
      <p>
        Review each story in context. Publication controls visibility;
        verification requires a separate evidence review.
      </p>
      <ReviewQueue />
    </div>
  )
}
