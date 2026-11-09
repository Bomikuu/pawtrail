import { CalendarDays, Heart, MapPin, PawPrint, Sprout, TrendingUp } from 'lucide-react'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { PublicProfile } from './types'

export function PublicProfileDetails({ profile, isOwn }: { profile: PublicProfile; isOwn: boolean }) {
  const joined = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(profile.createdAt))
  return <aside className="grid min-w-0 content-start items-start gap-4 @max-[52rem]/user-profile:mx-auto @max-[52rem]/user-profile:w-full @max-[52rem]/user-profile:max-w-200 @max-[52rem]/user-profile:grid-cols-2 @max-[38rem]/user-profile:grid-cols-1" aria-label={`About and community impact for ${profile.displayName}`}>
    <Card className="min-w-0 gap-0 rounded-2xl py-5 shadow-none"><CardContent className="space-y-4 px-4.5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold"><PawPrint aria-hidden="true" className="size-5 shrink-0 text-primary" />About {profile.displayName}</h2>
      <p className="whitespace-pre-wrap text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere]">{profile.bio || 'This PawPal hasn’t added a bio yet.'}</p>
      <dl className="divide-y border-t text-xs"><div className="flex flex-wrap items-baseline justify-between gap-2 py-3"><dt className="flex items-center gap-2 font-semibold"><MapPin aria-hidden="true" className="size-4" />Neighborhood</dt><dd className="text-muted-foreground [overflow-wrap:anywhere]">{profile.location?.neighborhood ?? 'Not shared'}</dd></div><div className="flex flex-wrap items-baseline justify-between gap-2 pt-3"><dt className="flex items-center gap-2 font-semibold"><CalendarDays aria-hidden="true" className="size-4" />Joined</dt><dd className="text-muted-foreground">{joined}</dd></div></dl>
    </CardContent></Card>
    {profile.summary && <Card className="min-w-0 gap-0 rounded-2xl py-5 shadow-none"><CardContent className="space-y-4 px-4.5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold"><TrendingUp aria-hidden="true" className="size-5 text-primary" />Community impact</h2>
      {profile.level !== null && <div className="space-y-2 border-b pb-4"><p className="flex flex-wrap items-center gap-2 text-sm font-semibold"><PawPrint aria-hidden="true" className="size-4 text-primary" />Level {profile.level}{profile.mastery && <span className="font-normal text-muted-foreground">· {profile.mastery.tier}</span>}</p>{profile.impact && <><Progress max={100} value={profile.impact.levelProgress} aria-label={`${profile.impact.levelProgress} of 100 Kibble toward level ${profile.level + 1}`} /><p className="text-[0.6875rem] tabular-nums text-muted-foreground" title="One level for every 100 lifetime net Kibble; Kibble is a non-cash reward.">{profile.impact.levelProgress} / 100 Kibble to level {profile.level + 1}</p></>}</div>}
      <dl className="divide-y text-xs">
        {profile.impact && <div className="flex items-center justify-between gap-3 py-3 first:pt-0"><dt className="flex items-center gap-2.5"><PawPrint aria-hidden="true" className="size-4 text-primary" />Net Kibble earned</dt><dd className="font-semibold tabular-nums"><AnimatedNumber value={profile.impact.kibbleEarned} /></dd></div>}
        <div className="flex items-center justify-between gap-3 py-3 first:pt-0"><dt className="flex items-center gap-2.5"><Heart aria-hidden="true" className="size-4 text-primary" />Animals supported</dt><dd className="font-semibold tabular-nums"><AnimatedNumber value={profile.animalsHelped.length} /></dd></div>
        {profile.impact && <><div className="flex items-center justify-between gap-3 py-3"><dt className="flex items-center gap-2.5"><CalendarDays aria-hidden="true" className="size-4 text-primary" />Event RSVPs</dt><dd className="font-semibold tabular-nums"><AnimatedNumber value={profile.impact.eventsJoined} /></dd></div><div className="flex items-center justify-between gap-3 pt-3"><dt className="flex items-center gap-2.5"><Sprout aria-hidden="true" className="size-4 text-primary" />Member for</dt><dd className="font-semibold tabular-nums"><AnimatedNumber value={profile.impact.membershipDays} /> days</dd></div></>}
      </dl>
      <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">From public contributions. Kibble is non-cash; animal links do not certify rescue or adoption outcomes.</p>
    </CardContent></Card>}
    {isOwn && <ButtonLink href="/dashboard/settings" variant="outline" className="justify-self-start rounded-md text-foreground @max-[52rem]/user-profile:col-span-full">Manage profile privacy</ButtonLink>}
  </aside>
}
