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
        'rank-crown inline-flex items-center justify-center gap-1 min-h-11 min-w-11 [padding:0.25rem_0.5rem] [border:1px_solid_#d6bc6a] rounded-[0.375rem] bg-[#fff3cb] text-[#79500d] no-underline font-[800] text-xs leading-[1.2] font-heading tabular-nums whitespace-nowrap [vertical-align:middle] shrink-0 [&_svg]:shrink-0 [&_svg]:[fill:#f6d16c] [&_svg]:[stroke-width:1.75] [&:hover]:bg-[#ffe5a1] [&:hover]:text-[#593705] [&:hover]:no-underline [@media(forced-colors:_active)]:border-[LinkText] [@media(forced-colors:_active)]:text-[LinkText] [@media(forced-colors:_active)]:[background:Canvas] [@media(forced-colors:_active)]:[&_svg]:[fill:none] [.profile-story-meta_&]:min-h-11 [.profile-story-meta_&]:text-[0.625rem] [.management-shell_.workflow-panel_&]:hidden [.management-shell_.social-activity-card_&]:hidden' +
        (rank <= 3 ? ' rank-crown-' + rank : '') +
        (prominent
          ? ' rank-crown-prominent min-h-11 [padding:0.5rem_0.75rem] gap-1.5 text-sm [&_svg]:w-5 [&_svg]:h-5 max-[48rem]:[.pawpal-profile_.profile-recognized-name_&]:text-xs max-[48rem]:[.pawpal-profile_.profile-recognized-name_&]:[padding:0.375rem_0.5rem]'
          : '')
      }
      aria-label={label}
      title={label}
    >
      <Crown size={16} aria-hidden="true" />
      <span>#{rank}</span>
      {prominent && (
        <span
          className={
            'rank-crown-caption text-xs [font-weight:650] max-[48rem]:text-[0.6875rem] max-[48rem]:[.pawpal-profile_&]:text-[0.625rem]'
          }
        >
          Top 10 PawPal
        </span>
      )}
    </Link>
  )
}
