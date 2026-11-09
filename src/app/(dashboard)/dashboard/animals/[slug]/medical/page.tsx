import { privateApi, publicRecord } from '@/features/workflows/server'
import { PageHeading } from '@/features/workflows/catalog'
import { MedicalManager } from '@/features/medical/manager'
import { ButtonLink } from '@/components/ui/button-link'
import { DataState } from '@/components/shared/data-state'
import { ApiError } from '@/lib/api/errors'
export const metadata = { title: 'Animal medical records | PawTrail', robots: { index: false } }
export default async function AnimalMedicalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const path = `/dashboard/animals/${encodeURIComponent(slug)}/medical`
  const api = await privateApi(path)
  const animal = await publicRecord(() => api.animals.get(slug))
  try {
    const records = await api.medical.list(animal.id, { scope: 'manage', archive: 'active', limit: 12 })
    return <><PageHeading title={`${animal.name}’s medical records`} description="Vaccinations, appointments and care in one record book. Follow-up dates come from recorded instructions; no schedule or clinical verification is inferred." action={<ButtonLink href={`/pets/${encodeURIComponent(animal.slug)}?tab=medical`} variant="outline" className="rounded-md text-foreground">View public profile</ButtonLink>} /><MedicalManager animal={animal} initial={records} /></>
  } catch (reason) {
    if (!(reason instanceof ApiError)) throw reason
    return <><PageHeading title="Medical records" /><DataState state="error" errorMessage={reason.status === 403 ? 'Only this animal’s caretaker or responsible shelter staff can manage medical records.' : 'Medical records couldn’t load. Try opening this page again.'} /><ButtonLink href="/dashboard/animals" variant="outline" className="rounded-md text-foreground">Back to your animals</ButtonLink></>
  }
}
