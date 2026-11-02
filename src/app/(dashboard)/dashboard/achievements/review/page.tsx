import { notFound } from 'next/navigation'
import { privateApi } from '@/features/workflows/server'
import { AchievementReview } from '@/features/achievements/review'
export default async function ReviewAchievementsPage() {
  const api = await privateApi('/dashboard/achievements/review')
  const session = await api.auth.session()
  if (!session.roles.includes('moderator')) notFound()
  const initial = await api.achievements.proofs({
    scope: 'review',
    state: 'pending',
    limit: 12,
  })
  return <AchievementReview initial={initial} scope={session.cacheScope} />
}
