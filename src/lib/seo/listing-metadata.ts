import type { Metadata } from 'next'
import { siteOrigin } from './origin'

/** Canonical, shareable metadata for public directories, without indexing sample data. */
export function listingMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string
  description: string
  path: string
  index?: boolean
}): Metadata {
  const url = `${siteOrigin}${path}`
  const canIndex = index && process.env.NEXT_PUBLIC_USE_MOCK_API === 'false'
  const image = {
    url: `${siteOrigin}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'PawTrail — Every Paw Has a Story',
  }
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: canIndex, follow: canIndex },
    openGraph: {
      type: 'website',
      siteName: 'PawTrail',
      locale: 'en_PH',
      title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
