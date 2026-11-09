import type { CommunityPlace } from '../community'
export type EntityKind =
  | 'home'
  | 'shelter'
  | 'hub'
  | 'animal'
  | 'horde'
  | 'help'
  | 'urgent'
  | 'incident'
  | 'event'
export type Point = [number, number]
export type MapAttention = {
  key: string
  level: 'urgent' | 'concern' | 'help'
  label: string
  detail: string
  sourceId: string
  sourceKind: 'help' | 'incident' | 'missing' | 'sample' | 'welfare'
  expiresAt?: string
}
export type MapAnimal = {
  lastSeen?: string
  publicLocation?: { coordinates: Point; label: string; radiusMeters?: number }
  id: string
  name: string
  species: string
  photo?: { url: string; alt: string } | null
  profileHref?: string | null
  status?: string
  adoptable?: boolean
  attention?: MapAttention
  ageMonths?: number
  gender?: string
  size?: string
  coat?: string
  personality?: string[]
  characteristics?: string[]
}
export type Contribution = {
  level: 'unrated' | 'growing' | 'established'
  verifiedCount: number
  score: number
  confidence: string
  explanation: string
}
export type Welfare = {
  openConfirmed: number
  underReview: number
  resolved: number
  explanation: string
}
export type MapEntity = {
  id: string
  kind: EntityKind
  name: string
  description: string
  area: string
  coordinates: Point
  locationLabel: string
  approximateRadiusMeters?: number
  sample: boolean
  demo?: boolean
  photo?: { url: string; alt: string } | null
  membership?: { animals: MapAnimal[] }
  contribution?: Contribution
  welfare?: Welfare
  attention?: MapAttention
  host?: CommunityPlace['host']
  occupancy?: number
  capacity?: number
  residents?: number
  visibility?: string
  entry?: CommunityPlace['entry']
  profileHref?: string | null
  animal?: MapAnimal & {
    lastSeen?: string
    traits?: string[]
    needsHelp?: boolean
    associationId?: string
    associationName?: string
  }
  help?: {
    id: string
    category: string
    priority: string
    status: string
    expiresAt: string
    href?: string | null
  }
  incident?: {
    id: string
    category: string
    status: string
    severity: string
    occurredAt: string
    summary: string
    version: number
  }
  subject?: { id: string; kind: string } | null
  event?: {
    id: string
    startsAt: string
    endsAt: string
    venue: string
    attending: number
    capacity: number
    href?: string | null
    attendees?: { id: string; name: string; avatar: string | null }[]
  }
  adoptableCount?: number
  missionCount?: number
  fundraiserCount?: number
}
export type Proximity = {
  center: Point
  radius: number
  label: string
  temporary?: boolean
}
export type UserPosition = {
  coordinates: Point
  accuracy: number | null
  source?: 'device' | 'manual'
  avatar?: string | null
  name: string
}
export type PublicRecords = {
  entities: MapEntity[]
  summaries: Record<string, { contribution: Contribution; welfare: Welfare }>
  truncated?: boolean
  areaSummary?: {
    verifiedContributionCount: number
    openConfirmed: number
    underReview: number
    resolved: number
  }
}
export type SourceIssue = {
  source: 'homes'
  kind: 'auth' | 'forbidden' | 'unavailable'
  message: string
}
export type MapSources = {
  issues?: SourceIssue[]
  entities: MapEntity[]
  warnings: string[]
  truncated: boolean
}
export type PrivateReport = {
  id: string
  recordType: 'incident' | 'help'
  category: string
  description: string
  coordinates: Point
  area: string
  status: string
  severity?: string
  version: number
  published: boolean
  publicSummary: string
  occurredAt?: string
  witnessed?: boolean
  urgent?: boolean
  title?: string
  priority?: string
  expiresAt?: string
  evidence?: { id: string; name: string; contentType: string }[]
  corrections?: { kind: string; description: string; createdAt: string }[]
  offers?: { name: string; description: string }[]
}
export type MyReports = {
  canReview: boolean
  incidents: PrivateReport[]
  help: PrivateReport[]
}
export const ENTITY_KINDS: EntityKind[] = [
  'home',
  'shelter',
  'hub',
  'animal',
  'horde',
  'help',
  'urgent',
  'incident',
  'event',
]
export const ENTITY_LABELS: Record<EntityKind, string> = {
  home: 'Homes',
  shelter: 'Shelters',
  hub: 'Communities',
  animal: 'Animals',
  horde: 'Hordes',
  help: 'Help requests',
  urgent: 'Urgent cases',
  incident: 'Incident reports',
  event: 'Events',
}
export const EMPTY_CONTRIBUTION: Contribution = {
  level: 'unrated',
  verifiedCount: 0,
  score: 0,
  confidence: 'insufficient',
  explanation: 'No verified contribution evidence recorded on PawTrail.',
}
export const EMPTY_WELFARE: Welfare = {
  openConfirmed: 0,
  underReview: 0,
  resolved: 0,
  explanation:
    'No corroborated public reports recorded on PawTrail. This does not establish that an area is free of incidents.',
}
