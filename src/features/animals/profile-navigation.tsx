'use client'
import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Grid2X2, Info, Images, MapPin, Stethoscope } from 'lucide-react'
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
    value === 'about' || value === 'photos' || value === 'location' || value === 'medical'
      ? value
      : query.has('period') || query.has('sightingCursor')
        ? 'location'
        : 'activity'
  const navigationRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navigationRef.current
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !selected) return
    const bounds = nav.getBoundingClientRect()
    const active = selected.getBoundingClientRect()
    if (active.right > bounds.right) nav.scrollLeft += active.right - bounds.right
    else if (active.left < bounds.left) nav.scrollLeft -= bounds.left - active.left
  }, [current])
  return (
    <nav
      ref={navigationRef}
      className={
        'pet-profile-tabs [.dark_.app-shell_&_a[aria-current=page]]:bg-[#2b1c12] [.dark_.app-shell_&_a[aria-current=page]]:text-[#ffad70] [.dark_.app-shell_&_a[aria-current=page]]:border-[#a85721] [.dark_.app-shell_&_a:hover]:bg-[#242424] [.dark_.app-shell_&_a:hover]:text-[#ffb27d] [.dark_&]:border-[#333333] flex items-center gap-2 [padding:0.375rem_0] [margin:0_1.5rem] [border-top:1px_solid_#e9dece] [border-bottom:1px_solid_#e9dece] overflow-x-auto [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:gap-2.5 [&_a]:min-h-12 [&_a]:[padding:0.5rem_1.75rem] [&_a]:no-underline [&_a]:text-sm [&_a]:font-bold [&_a]:text-muted-foreground [&_a]:[border-bottom:2px_solid_transparent] [&_a]:whitespace-nowrap [&_a:hover]:text-foreground [&_a:hover]:bg-[#f7efe2] [&_a[aria-current=page]]:text-[#b74d07] [&_a[aria-current=page]]:[border-bottom-color:#d85b08] max-[48rem]:mx-4 max-[48rem]:gap-1 max-[48rem]:[&_a]:[padding:0.5rem_0.625rem] max-[48rem]:[&_a]:[flex:1] max-[48rem]:[&_a]:gap-1.5 max-[48rem]:[&_a]:text-xs max-[48rem]:[&_svg]:w-4 max-[48rem]:[&_svg]:h-4 [@media(forced-colors:_active)]:[&_a[aria-current=page]]:[border-bottom-color:Highlight]'
      }
      aria-label="Pet profile sections"
    >
      {[
        { id: 'activity', label: 'Activity', icon: Grid2X2 },
        { id: 'about', label: 'About', icon: Info },
        { id: 'photos', label: 'Photos', icon: Images },
        { id: 'location', label: 'Location', icon: MapPin },
        { id: 'medical', label: 'Medical', icon: Stethoscope },
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
    tab === 'photos' || tab === 'about' || tab === 'location' ? tab : tab === 'medical' ? 'about' : 'activity'
  return (
    <SectionLoading
      variant={variant}
      label={`Loading ${tab === 'medical' ? 'medical records' : variant === 'location' ? 'sightings and location' : variant}…`}
    />
  )
}
