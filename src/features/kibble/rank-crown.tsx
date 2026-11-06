import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { Crown } from 'lucide-react'

export function RankCrown({
  rank,
  prominent = false,
}: {
  rank?: number | null
  prominent?: boolean
}) {
  if (
    typeof rank !== 'number' ||
    !Number.isInteger(rank) ||
    rank < 1 ||
    rank > 10
  )
    return null
  const label = `Rank ${rank} in the all-time PawPal leaderboard`
  return (
    <Link
      href="/leaderboard?period=all&category=all"
      className={
        'rank-crown' +
        (rank <= 3 ? ' rank-crown-' + rank : '') +
        (prominent ? ' rank-crown-prominent' : '')
      }
      aria-label={label}
      title={label}
    >
      <Crown size={16} aria-hidden="true" />
      <span>#{rank}</span>
      {prominent && <span className="rank-crown-caption">Top 10 PawPal</span>}
    </Link>
  )
}
