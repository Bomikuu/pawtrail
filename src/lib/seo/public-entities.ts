import 'server-only'
import type { Metadata } from 'next'
import { getServerApi } from '@/lib/api/server'
import { siteOrigin } from './origin'
import { notFound } from 'next/navigation'
import { publicRecord } from '@/features/workflows/server'
export type PublicCollection =
  'hordes' | 'fundraisers' | 'missions' | 'events' | 'shelters'
export async function publicEntity(collection: PublicCollection, slug: string) {
  const api = await getServerApi()
  const loaders = {
    hordes: api.hordes.get,
    fundraisers: api.fundraisers.get,
    missions: api.missions.get,
    events: api.events.get,
    shelters: api.shelters.get,
  }
  const row = await publicRecord(async () => await loaders[collection](slug))
  if (
    'state' in row &&
    collection === 'fundraisers' &&
    !['active', 'completed', 'closed'].includes(row.state)
  )
    notFound()
  return {
    name: 'name' in row ? row.name : row.title,
    description:
      'description' in row ? row.description : 'story' in row ? row.story : '',
    slug: row.slug,
    provenance: row.provenance,
  }
}
export async function routeMetadata(
  collection: PublicCollection,
  slug: string,
): Promise<Metadata> {
  const row = await publicEntity(collection, slug),
    url = `${siteOrigin}/${collection}/${encodeURIComponent(row.slug)}`,
    title = `${row.name} — PawTrail`,
    description = row.description.slice(0, 160)
  const real =
    process.env.NEXT_PUBLIC_USE_MOCK_API === 'false' &&
    row.provenance.kind === 'real'
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: real, follow: real },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: `${url}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  }
}
