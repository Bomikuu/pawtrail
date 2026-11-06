'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Grid2X2, Info, Images, MapPin } from 'lucide-react'
import { QueryTabLink } from '@/components/layout/query-tab-link'
import { usePageNavigation } from '@/components/layout/page-navigation'
import {
  SectionLoading,
  type SectionSkeletonVariant,
} from '@/components/shared/section-loading'

export function PetProfileTabs({ path }: { path: string }) {
  const query = useSearchParams()
  const value = query.get('tab')
  const current =
    value === 'about' || value === 'photos' || value === 'location'
      ? value
      : query.has('period') || query.has('sightingCursor')
        ? 'location'
        : 'activity'
  return (
    <nav className="pet-profile-tabs" aria-label="Pet profile sections">
      {[
        { id: 'activity', label: 'Activity', icon: Grid2X2 },
        { id: 'about', label: 'About', icon: Info },
        { id: 'photos', label: 'Photos', icon: Images },
        { id: 'location', label: 'Location', icon: MapPin },
      ].map(({ id, label, icon: Icon }) => (
        <QueryTabLink
          key={id}
          href={`${path}?tab=${id}#pet-activity`}
          queryParam="tab"
          value={id}
          defaultValue="activity"
          selected={current === id}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </QueryTabLink>
      ))}
    </nav>
  )
}
export function PetSectionLoading() {
  return (
    <Suspense fallback={<SectionLoading label="Loading section…" />}>
      <PetSectionLoadingState />
    </Suspense>
  )
}
function PetSectionLoadingState() {
  const navigation = usePageNavigation()
  const current = useSearchParams()
  const query = navigation?.href
    ? new URL(navigation.href, 'https://pawtrail.invalid').searchParams
    : current
  const tab =
    query?.get('tab') ??
    (query?.has('period') || query?.has('sightingCursor')
      ? 'location'
      : 'activity')
  const variant: SectionSkeletonVariant =
    tab === 'photos' || tab === 'about' || tab === 'location' ? tab : 'activity'
  return (
    <SectionLoading
      variant={variant}
      label={`Loading ${variant === 'location' ? 'sightings and location' : variant}…`}
    />
  )
}
