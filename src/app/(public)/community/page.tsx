import { getServerApi } from '@/lib/api/server'
import { Feed } from '@/features/community/feed'
import { communityChoices } from '@/features/community/service'
export default async function CommunityPage() {
  const api = await getServerApi()
  const [session, initial, options, areas, animals] = await Promise.all([
    api.auth.session(),
    api.community.list({ tab: 'for_you' }),
    communityChoices(api),
    api.discovery.searchAreas(''),
    api.animals.list({ limit: 2, adoptable: true }),
  ])
  return (
    <Feed
      initial={initial}
      scope={session.cacheScope}
      options={options}
      areas={areas}
      animals={animals.items}
    />
  )
}
