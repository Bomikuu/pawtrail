import '@/features/landing-pages/fonts'
import { WebsitePage } from '@sitebuilder/react/server'
import { landingRequest } from '@/features/landing-pages/server'
import { notFound } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button-link'
import type { WebsiteDocument, ResolvedData } from '@sitebuilder/core'
import { cache } from 'react'
const read = cache(
  async (
    slug: string,
  ): Promise<{
    name: string
    slug: string
    document: WebsiteDocument
    data: ResolvedData
  }> => {
    const response = await landingRequest(
      'public/' + encodeURIComponent(slug),
      {},
      true,
    )
    if (response.status === 404) notFound()
    if (!response.ok)
      throw new Error('This website is temporarily unavailable.')
    return response.json()
  },
)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const value = await read(slug)
  return {
    title: value.document.title + ' | PawTrail',
    description: String(
      value.data.identity &&
        typeof value.data.identity === 'object' &&
        'description' in value.data.identity
        ? value.data.identity.description
        : '',
    ).slice(0, 160),
    alternates: { canonical: '/sites/' + slug },
  }
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const value = await read(slug)
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-3">
        <a href="/" className="font-heading text-xl font-bold text-foreground">
          PawTrail
        </a>
        <ButtonLink href={'/shelters/' + slug} variant="outline" size="sm">
          Community profile
        </ButtonLink>
      </header>
      <WebsitePage document={value.document} data={value.data} />
      <footer className="border-t bg-background px-5 py-6 text-center text-xs text-muted-foreground">
        {value.name} · Made with PawTrail and Pixelcore Studio
      </footer>
    </>
  )
}
