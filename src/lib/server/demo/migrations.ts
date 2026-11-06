import 'server-only'
import { refreshSamplePhotos } from '@/data/fixtures/photo-refresh'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { moderationStoreSchema } from '@/features/moderation/schemas'
import { resourceRefSchema, timestampSchema } from '@/lib/api/schemas'
import { storedMediaSchema } from '@/lib/server/media/storage'
import { seed, type FixtureSeed } from '@/data/fixtures'
import { ApiError } from '@/lib/api/errors'
import { workflowStoreSchema, emptyWorkflow } from '@/lib/server/workflow-store'
import { canonicalJson, type DemoDraft } from './transactions'
import {
  applySamplePack,
  mergeExpandedSamples,
  SAMPLE_PACK_VERSION,
} from '@/data/fixtures/sample-pack'

export const DEMO_SCHEMA_VERSION = 7
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
    media: z.array(storedMediaSchema),
    moderation: moderationStoreSchema,
    community: z
      .object({
        follows: z.array(
          z
            .object({
              actorId: z.string().min(1),
              ref: resourceRefSchema,
              createdAt: timestampSchema,
            })
            .strict(),
        ),
        reactions: z.array(
          z
            .object({ actorId: z.string().min(1), postId: z.string().min(1) })
            .strict(),
        ),
        saved: z.array(
          z
            .object({ actorId: z.string().min(1), postId: z.string().min(1) })
            .strict(),
        ),
        attachments: z.array(
          z
            .object({
              postId: z.string().min(1),
              mediaIds: z.array(z.string().min(1)).max(6),
            })
            .strict(),
        ),
      })
      .strict(),
    savedAnimals: z.array(
      z
        .object({ actorId: z.string().min(1), animalId: z.string().min(1) })
        .strict(),
    ),
    workflow: workflowStoreSchema.optional(),
    auth: z
      .object({ actorId: z.string().nullable(), cacheScope: z.string().uuid() })
      .strict(),
    receipts: z.array(
      z
        .object({
          name: z.string(),
          actorId: z.string().nullable(),
          key: z.string(),
          fingerprint: z.string(),
          result: z.json().optional(),
        })
        .strict(),
    ),
  })
  .strict()
export interface StoredDemo {
  workflow?: DemoDraft['workflow']
  schemaVersion: number
  fixtureVersion: number
  auth: DemoDraft['auth']
  moderation: DemoDraft['moderation']
  community: DemoDraft['community']
  media: DemoDraft['media']
  savedAnimals: DemoDraft['savedAnimals']
  overlay: Partial<FixtureSeed>
  receipts: {
    actorId: string | null
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
    media: [],
    moderation: freshModeration(),
    community: { follows: [], reactions: [], saved: [], attachments: [] },
    savedAnimals: [],
    workflow: emptyWorkflow(),
    auth: { actorId: null, cacheScope: randomUUID() },
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
export function snapshot(
  document: StoredDemo,
  baseline: FixtureSeed = seed,
): DemoDraft {
  const draft: DemoDraft = {
    workflow: structuredClone(document.workflow ?? emptyWorkflow()),
    moderation: structuredClone(document.moderation),
    community: structuredClone(document.community),
    media: structuredClone(document.media),
    savedAnimals: structuredClone(document.savedAnimals),
    data: structuredClone({ ...baseline, ...document.overlay }),
    auth: structuredClone(document.auth),
  }
  if ((draft.workflow?.samplePackVersion ?? 0) < SAMPLE_PACK_VERSION) {
    if (baseline === seed) mergeExpandedSamples(draft, seed)
    applySamplePack(draft)
  }
  if (baseline === seed) refreshSamplePhotos(draft, seed)
  return draft
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

/** Explicit illustrative creator metadata; membership never serves as verification evidence. */
export function freshModeration(): DemoDraft['moderation'] {
  return {
    reports: [],
    audit: [],
    notifications: [],
    subjects: [
      {
        ref: { kind: 'shelter', id: 'shelter-1' },
        creatorIds: ['user-1'],
        evidenceIds: [],
        version: 1,
        state: 'published',
      },
      {
        ref: { kind: 'shelter', id: 'shelter-2' },
        creatorIds: ['user-2'],
        evidenceIds: [],
        version: 1,
        state: 'published',
      },
      {
        ref: { kind: 'shelter', id: 'shelter-3' },
        creatorIds: ['user-3'],
        evidenceIds: [],
        version: 1,
        state: 'published',
      },
      {
        ref: { kind: 'shelter', id: 'shelter-4' },
        creatorIds: ['user-4'],
        evidenceIds: [],
        version: 1,
        state: 'published',
      },
      {
        ref: { kind: 'shelter', id: 'shelter-5' },
        creatorIds: ['user-5'],
        evidenceIds: [],
        version: 1,
        state: 'published',
      },
    ],
  }
}
