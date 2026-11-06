import type { MetadataRoute } from 'next'
import { getServerApi } from '@/lib/api/server'
import { siteOrigin } from '@/lib/seo/origin'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false') return []
  const api = await getServerApi(),
    entries: MetadataRoute.Sitemap = [
      '',
      'explore',
      'community',
      'adopt',
      'hordes',
      'fundraisers',
      'missions',
      'shelters',
      'events',
      'leaderboard',
    ].map((path) => ({ url: `${siteOrigin}/${path}` }))
  for (const [path, list] of [
    ['pets', api.animals.list],
    ['hordes', api.hordes.list],
    ['fundraisers', api.fundraisers.list],
    ['missions', api.missions.list],
    ['shelters', api.shelters.list],
    ['events', api.events.list],
  ] as const) {
    let cursor: string | undefined
    const seen = new Set<string>()
    do {
      const page = await list({ limit: 50, cursor })
      for (const row of page.items)
        if (row.provenance.kind === 'real')
          entries.push({
            url: `${siteOrigin}/${path}/${encodeURIComponent(row.slug)}`,
            lastModified: row.createdAt,
          })
      cursor = page.nextCursor ?? undefined
      if (cursor) {
        if (seen.has(cursor))
          throw new Error('Repeated upstream sitemap cursor')
        seen.add(cursor)
      }
    } while (cursor)
  }
  let cursor: string | undefined
  const seen = new Set<string>()
  do {
    const page = await api.search.query({
      kinds: ['user', 'post'],
      limit: 50,
      cursor,
    })
    for (const r of page.items) {
      if (r.ref.kind === 'post') {
        const post = await api.community.get(r.ref.id)
        if (post.moderation === 'published' && post.provenance.kind === 'real')
          entries.push({
            url: `${siteOrigin}/community/${encodeURIComponent(post.id)}`,
            lastModified: post.createdAt,
          })
      }
      if (r.ref.kind === 'user') {
        const path = new URL(r.path, siteOrigin)
        if (
          path.origin !== siteOrigin ||
          !/^\/users\/[^/]+$/.test(path.pathname)
        )
          continue
        const user = await api.users.get(
          decodeURIComponent(path.pathname.split('/')[2]),
        )
        if (user.provenance.kind === 'real')
          entries.push({
            url: `${siteOrigin}/users/${encodeURIComponent(user.username)}`,
            lastModified: user.createdAt,
          })
      }
    }
    cursor = page.nextCursor ?? undefined
    if (cursor) {
      if (seen.has(cursor)) throw new Error('Repeated search sitemap cursor')
      seen.add(cursor)
    }
  } while (cursor)
  return entries
}
