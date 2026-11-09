import { Camera, MapPin } from 'lucide-react'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { ButtonLink } from '@/components/ui/button-link'
import { RankCrown } from '@/features/kibble/rank-crown'
import { ProfileBanner } from './profile-banner'
import { FollowButton } from './follow-button'
import type { PublicProfile } from './types'

export function PublicProfileHeader({ profile, isOwn, returnTo }: { profile: PublicProfile; isOwn: boolean; returnTo: string }) {
  return <header>
    <div className="relative aspect-[3.7/1] max-h-54 min-h-30 w-full overflow-hidden rounded-t-2xl rounded-b-[0.625rem] bg-secondary">
      <ProfileBanner id={profile.bannerId} />
      {isOwn && <ButtonLink href="/dashboard/profile#profile-banner-picker" variant="outline" className="absolute top-4 right-4 rounded-md bg-card text-[0.8125rem] text-foreground max-[48rem]:top-2.5 max-[48rem]:right-2.5 max-[48rem]:p-2 max-[48rem]:text-[0.6875rem]"><Camera aria-hidden="true" className="size-4" />Change banner</ButtonLink>}
    </div>
    <div className="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-start gap-5 px-6 max-[48rem]:grid-cols-[6rem_minmax(0,1fr)] max-[48rem]:gap-x-3 max-[48rem]:gap-y-2 max-[48rem]:px-4">
      <div className="relative -mt-13 size-32 shrink-0 rounded-full border-6 border-card bg-card [&>.community-avatar.community-avatar]:size-full [&>.community-avatar.community-avatar]:text-3xl max-[48rem]:-mt-10 max-[48rem]:size-24 max-[48rem]:border-4">
        <CommunityAvatar name={profile.displayName} image={profile.avatar} large />
      </div>
      <div className="min-w-0 pt-3 max-[48rem]:pt-2.5">
        <div className="profile-recognized-name flex flex-wrap items-center gap-x-3 gap-y-1"><h1 className="font-heading text-[clamp(1.875rem,2.5vw,2.5rem)] font-black leading-[1.15] [overflow-wrap:anywhere] max-[48rem]:text-[1.75rem]">{profile.displayName}</h1><RankCrown rank={profile.leaderboardRank} prominent /></div>
        <p className="mt-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">@{profile.username}</p>
        {profile.location && <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground"><MapPin aria-hidden="true" className="size-4 shrink-0" />{profile.location.neighborhood}</p>}
        <p className="mt-2 text-[0.6875rem] text-muted-foreground">{profile.provenance.label}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-5 max-[48rem]:col-span-2 max-[48rem]:pt-1">
        {isOwn ? <ButtonLink href="/dashboard/profile" variant="outline" className="rounded-md text-foreground">Edit profile</ButtonLink> : <FollowButton target={{ kind: 'user', id: profile.id }} name={profile.displayName} returnTo={returnTo} compact />}
      </div>
    </div>
    {profile.summary && <dl aria-label="Public community contributions" className="mx-6 my-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] max-[48rem]:mx-4 max-[48rem]:my-3.5 max-[48rem]:gap-x-4 max-[48rem]:text-xs">{[
      { label: 'Stories', value: profile.summary.stories },
      { label: 'Sightings', value: profile.summary.sightings },
      { label: 'Approved missions', value: profile.summary.missions },
      { label: 'Fundraisers supported', value: profile.summary.donations },
    ].map(({ label, value }) => <div key={label} className="flex flex-row-reverse items-baseline gap-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="m-0 font-semibold tabular-nums text-foreground"><AnimatedNumber value={value} /></dd></div>)}</dl>}
  </header>
}
