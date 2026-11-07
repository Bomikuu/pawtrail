/** Geographic discovery is separate from the fictional pixel-world coordinates. */
export const COMMUNITY_AREAS = [
  { id: 'poblacion', name: 'Poblacion, Davao City', center: [125.6128, 7.0731] },
  { id: 'buhangin', name: 'Buhangin, Davao City', center: [125.6228, 7.105] },
  { id: 'matina', name: 'Matina, Davao City', center: [125.5886, 7.0549] },
] as const

export type CommunityPlace = {
  id: string
  kind: 'home' | 'shelter' | 'hub'
  name: string
  description: string
  area: string
  coordinates: [number, number]
  locationLabel: string
  sample: boolean
  demo?: boolean
  photo?: { url: string; alt: string } | null
  host?: { name: string; avatar: string }
  occupancy?: number
  capacity?: number
  residents?: number
  visibility?: string
  entry: { kind: 'home'; house: string } | { kind: 'shelter'; shelterId?: string }
  profileHref?: string
}
export const COMMUNITY_START = [125.6128, 7.0731] as [number, number]
export const STARTER_PLACES: CommunityPlace[] = [
  {
    id: 'world:sampaguita', kind: 'hub', name: 'Sampaguita Commons',
    description: 'Meet other PawPals in the shared neighborhood. Sign in to join the live game room.',
    area: 'Poblacion, Davao City', coordinates: [125.6135, 7.074],
    locationLabel: 'Virtual community space · neighborhood pin', sample: false,
    entry: { kind: 'home', house: 'system:hub' },
  },
  {
    id: 'world:shelter', kind: 'shelter', name: 'PawTrail practice shelter',
    description: 'Visit Lina and practice caring for animals in the exploration game. This is a fictional shelter.',
    area: 'Poblacion, Davao City', coordinates: [125.6112, 7.0718],
    locationLabel: 'Fictional game location · not a real shelter address', sample: true,
    entry: { kind: 'shelter' },
  },
]
export function placeEntry(place: CommunityPlace, base = '/play') {
  const query = place.entry.kind === 'home'
    ? new URLSearchParams({ home: place.entry.house })
    : new URLSearchParams({ scene: 'shelter', ...(place.entry.shelterId ? { shelterId: place.entry.shelterId } : {}) })
  if (place.demo || new URLSearchParams(window.location.search).get('demo') === '1') query.set('demo', '1')
  return `${base}?${query}`
}
export function validCoordinates(point: unknown): point is [number, number] {
  return Array.isArray(point) && point.length === 2 && point.every((n) => typeof n === 'number' && Number.isFinite(n)) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 85
}
