import { TemplateGallery } from '@/features/landing-pages/workspace'
import { ButtonLink } from '@/components/ui/button-link'
export const metadata = {
  title: 'Shelter website templates | PawTrail',
  description:
    'Create a home for your animal welfare organization with PawTrail and Pixelcore Studio.',
}
export default function Page() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-14">
      <header className="max-w-2xl">
        <h1 className="font-heading text-5xl font-bold">
          A home for your story.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          A website for your shelter, rescue group or care community. Choose a
          starting point and make it yours with Pixelcore Studio.
        </p>
        <ButtonLink href="/dashboard/pages" className="mt-6">
          Create your organization website
        </ButtonLink>
      </header>
      <TemplateGallery busy="" />
    </main>
  )
}
