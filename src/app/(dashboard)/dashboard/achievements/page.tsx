import { privateApi } from '@/features/workflows/server'
import { AchievementCollection } from '@/features/achievements/collection'
import { demoClock, systemClock } from '@/lib/api/clock'
export default async function AchievementsPage() {
  const api = await privateApi('/dashboard/achievements')
  const session = await api.auth.session()
  const [
    profile,
    initial,
    proofs,
    animals,
    hordes,
    events,
    campaigns,
    posts,
    shelters,
  ] = await Promise.all([
    api.users.me(),
    api.achievements.overview(),
    api.achievements.proofs({ scope: 'mine', limit: 12 }),
    api.animals.list({ limit: 50 }),
    api.hordes.list({ limit: 50 }),
    api.events.list({ limit: 50 }),
    api.fundraisers.list({ limit: 50 }),
    api.community.list({ authorId: session.actor!.id, limit: 50 }),
    api.shelters.list({ limit: 50 }),
  ])
  const choices = [
    ...animals.items.map((a) => ({
      ref: { kind: 'animal' as const, id: a.id },
      title: a.name,
    })),
    ...hordes.items.map((a) => ({
      ref: { kind: 'horde' as const, id: a.id },
      title: a.name,
    })),
    ...events.items.map((a) => ({
      ref: { kind: 'event' as const, id: a.id },
      title: a.title,
    })),
    ...campaigns.items.map((a) => ({
      ref: { kind: 'fundraiser' as const, id: a.id },
      title: a.title,
    })),
    ...posts.items
      .filter((p) => p.moderation === 'published')
      .map((a) => ({
        ref: { kind: 'post' as const, id: a.id },
        title: a.text.slice(0, 80),
      })),
    ...shelters.items.map((a) => ({
      ref: { kind: 'shelter' as const, id: a.id },
      title: a.name,
    })),
  ]
  return (
    <AchievementCollection
      initial={initial}
      proofs={proofs}
      scope={session.cacheScope}
      choices={choices}
      now={(session.demo ? demoClock : systemClock).now().toISOString()}
      contributionsPublic={profile.settings.showContributions}
    />
  )
}
