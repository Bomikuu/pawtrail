import 'server-only'
import { z } from 'zod'
import { seed, type FixtureSeed } from '@/data/fixtures'
import { ApiError } from '@/lib/api/errors'
import { canonicalJson, type DemoDraft } from './transactions'

export const DEMO_SCHEMA_VERSION = 1
export const DEMO_FIXTURE_VERSION = 1
const collectionSchema = z.array(
  z.object({ id: z.string().min(1) }).catchall(z.json()),
)
const overlaySchema = z
  .object(
    Object.fromEntries(
      Object.keys(seed).map((key) => [key, collectionSchema.optional()]),
    ),
  )
  .strict()
const storedSchema = z
  .object({
    schemaVersion: z.literal(DEMO_SCHEMA_VERSION),
    fixtureVersion: z.literal(DEMO_FIXTURE_VERSION),
    overlay: overlaySchema,
    receipts: z.array(
      z
        .object({
          name: z.string(),
          key: z.string(),
          fingerprint: z.string(),
          result: z.json().optional(),
        })
        .strict(),
    ),
  })
  .strict()
export interface StoredDemo {
  schemaVersion: number
  fixtureVersion: number
  overlay: Partial<FixtureSeed>
  receipts: {
    name: string
    key: string
    fingerprint: string
    result?: unknown
  }[]
}
export function freshDocument(): StoredDemo {
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    fixtureVersion: DEMO_FIXTURE_VERSION,
    overlay: {},
    receipts: [],
  }
}
export function parseDocument(text: string): StoredDemo {
  try {
    const result = storedSchema.parse(JSON.parse(text))
    return result as StoredDemo
  } catch {
    throw new ApiError(
      'DEMO_RESET_REQUIRED',
      'This demo session needs a reset before it can be used. Reset only this session to continue.',
      409,
    )
  }
}
export function snapshot(document: StoredDemo): DemoDraft {
  return { data: structuredClone({ ...seed, ...document.overlay }) }
}
export function overlayFrom(draft: DemoDraft): Partial<FixtureSeed> {
  // Collection replacement supports inserts, edits, and removals without duplicating unchanged fixtures.
  if (Object.keys(draft.data).sort().join() !== Object.keys(seed).sort().join())
    throw new ApiError('INVALID_DEMO_DATA', 'Unexpected demo collections', 400)
  const overlay = Object.fromEntries(
    Object.keys(seed).flatMap((name) => {
      const key = name as keyof FixtureSeed
      return canonicalJson(draft.data[key]) === canonicalJson(seed[key])
        ? []
        : [[key, draft.data[key]]]
    }),
  )
  if (!overlaySchema.safeParse(overlay).success)
    throw new ApiError('INVALID_DEMO_DATA', 'Invalid demo collection', 400)
  return overlay as Partial<FixtureSeed>
}
