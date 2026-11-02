import { siteOrigin } from '@/lib/seo/origin'
import { notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { ApiError } from '@/lib/api/errors'
import { getApiConfig } from '@/lib/api/config'
import { PublicProfile } from '@/features/users/public-profile'
import { PublicJsonLd } from '@/lib/seo/public-json-ld'
async function profile(username: string) {
  try {
    return await (await getServerApi()).users.get(username)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const user = await profile((await params).username)
  const title = `${user.displayName} — PawTrail`
  const description = user.bio.slice(0, 160)
  const url = `${siteOrigin}/users/${encodeURIComponent(user.username)}`
  const noindex =
    getApiConfig().mode === 'mock' || user.provenance.kind !== 'real'
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: !noindex, follow: !noindex },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      images: [`${url}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  }
}
export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const user = await profile((await params).username)
  return (
    <>
      <PublicJsonLd
        name={user.displayName}
        description={user.bio}
        path={`/users/${encodeURIComponent(user.username)}`}
      />
      <PublicProfile profile={user} />
    </>
  )
}
