import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { siteOrigin } from '@/lib/seo/origin'
import './globals.css'
import { Providers } from '@/components/providers'
import { getServerApi } from '@/lib/api/server'
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'PawTrail — Every Paw Has a Story',
  description:
    'Share animal stories, find companions responsibly, and connect practical care around your neighborhood.',
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
