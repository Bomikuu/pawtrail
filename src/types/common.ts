export type Id = string
export type ISODateTime = string
/** Safe integer centavos in PHP. */
export type MoneyMinor = number
export type EntityKind =
  | 'animal'
  | 'horde'
  | 'fundraiser'
  | 'mission'
  | 'event'
  | 'user'
  | 'shelter'
  | 'post'
export type ResourceRef = { kind: EntityKind; id: Id }
export type Page<T> = { items: T[]; count: number; nextCursor: string | null }
export type ListQuery = { q?: string; cursor?: string; limit?: number }
export type ModerationState = 'pending' | 'published' | 'rejected' | 'removed'
export type RequestOptions = { signal?: AbortSignal; idempotencyKey?: string }
