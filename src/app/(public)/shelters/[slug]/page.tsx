import { ButtonLink } from '@/components/ui/button-link'
import { landingRequest } from '@/features/landing-pages/server'
import { ShelterPage } from '@/features/workflows/public-pages'
import { routeMetadata } from '@/lib/seo/public-entities'
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  return routeMetadata('shelters', (await params).slug)
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let published = false
  try {
    published = (
      await landingRequest('public/' + encodeURIComponent(slug), {}, true)
    ).ok
  } catch {
    /* The shelter profile remains available if the website service is unavailable. */
  }
  return (
    <>
      {published && (
        <div className="mb-4 flex justify-end">
          <ButtonLink href={'/sites/' + slug} variant="outline">
            Visit organization website
          </ButtonLink>
        </div>
      )}
      <ShelterPage slug={slug} />
    </>
  )
}
