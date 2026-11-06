import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { siteOrigin } from '@/lib/seo/origin'
import './globals.css'
import './social-surfaces.css'
import './interactions.css'
import { Providers } from '@/components/providers'
import { getServerApi } from '@/lib/api/server'
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'PawTrail — Every Paw Has a Story',
  applicationName: 'PawTrail',
  appleWebApp: { capable: true, title: 'PawTrail', statusBarStyle: 'default' },
  description:
    'Share animal stories, find companions responsibly, and connect practical care around your neighborhood.',
  openGraph: {
    type: 'website',
    siteName: 'PawTrail',
    locale: 'en_PH',
    title: 'PawTrail — Every Paw Has a Story',
    description:
      'Animal stories, responsible adoption, and practical care in your neighborhood.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PawTrail — Every Paw Has a Story',
      },
    ],
  },
  twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
  robots:
    process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'
      ? { index: false, follow: false }
      : undefined,
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await (await getServerApi()).auth.session()
  return (
    <html lang="en-PH">
      <body>
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  )
}
