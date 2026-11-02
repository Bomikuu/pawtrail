import type { ReactNode } from 'react'
import './globals.css'
import { Providers } from '@/components/providers'
import { getServerApi } from '@/lib/api/server'

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
