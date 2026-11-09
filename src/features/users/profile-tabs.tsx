'use client'
import { useEffect, useRef } from 'react'
import { Check, Heart, Home, MapPin, NotebookText } from 'lucide-react'
import { NavigationLink } from '@/components/layout/navigation-link'
import type { ProfileTab } from './profile-activity'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'stories', label: 'Stories', icon: NotebookText },
  { id: 'sightings', label: 'Sightings', icon: MapPin },
  { id: 'missions', label: 'Missions', icon: Check },
  { id: 'contributions', label: 'Contributions', icon: Heart },
] as const
export function ProfileTabs({ path, current }: { path: string; current: ProfileTab }) {
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navigation.current
    const selected = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !selected) return
    const bounds = nav.getBoundingClientRect()
    const active = selected.getBoundingClientRect()
    if (active.right > bounds.right) nav.scrollLeft += active.right - bounds.right
    else if (active.left < bounds.left) nav.scrollLeft -= bounds.left - active.left
  }, [current])
  return <nav ref={navigation} aria-label="Profile activity" className="mx-6 flex min-w-0 items-center gap-2 overflow-x-auto border-y py-1.5 max-[48rem]:mx-4 max-[48rem]:gap-1">{tabs.map(({ id, label, icon: Icon }) => <NavigationLink key={id} href={`${path}?tab=${id}#profile-activity`} aria-current={current === id ? 'page' : undefined} className="inline-flex min-h-12 flex-1 shrink-0 items-center justify-center gap-2.5 border-b-2 border-transparent px-4 py-2 text-sm font-bold whitespace-nowrap text-muted-foreground no-underline hover:bg-secondary hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground max-[48rem]:gap-1.5 max-[48rem]:px-2.5 max-[48rem]:text-xs"><Icon aria-hidden="true" className="size-[18px] shrink-0 max-[48rem]:size-4" />{label}</NavigationLink>)}</nav>
}
