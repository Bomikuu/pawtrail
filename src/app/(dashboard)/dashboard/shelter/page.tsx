import { ShelterWorkspacePage } from '@/features/workflows/private-pages'
import { ButtonLink } from '@/components/ui/button-link'
export default function Page() {
  return (
    <>
      <div className="mb-6 flex justify-end">
        <ButtonLink href="/dashboard/pages" variant="outline">
          Create or manage your website
        </ButtonLink>
      </div>
      <ShelterWorkspacePage />
    </>
  )
}
