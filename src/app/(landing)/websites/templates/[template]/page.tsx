import { WebsitePage } from '@sitebuilder/react/server'
import {
  landingDocument,
  landingTemplates,
} from '@/features/landing-pages/templates'
import { ButtonLink } from '@/components/ui/button-link'
import { notFound } from 'next/navigation'
export const metadata = {
  title: 'Website design preview | PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page({
  params,
}: {
  params: Promise<{ template: string }>
}) {
  const { template } = await params
  const design = landingTemplates.find((t) => t.id === template)
  if (!design) notFound()
  const document = landingDocument(template, {
    id: 'preview',
    slug: 'preview',
    name: design.name,
    description:
      'A dedicated home for your shelter’s story, the animals you care for and the people who make it possible. Replace this introduction with your own when you start editing.',
  })
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-background px-5 py-3">
        <div>
          <p className="font-semibold">{design.name}</p>
          <p className="text-xs text-muted-foreground">
            Template preview · illustrative copy and artwork
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/websites/templates" variant="outline">
            All designs
          </ButtonLink>
          <ButtonLink href="/dashboard/pages">Use this design</ButtonLink>
        </div>
      </header>
      <WebsitePage
        document={document}
        data={{
          assets: {
            hero: {
              url: '/images/illustrations/pet-companions.webp',
              alt: 'PawTrail companion illustration',
              type: 'image',
            },
          },
        }}
      />
    </>
  )
}
