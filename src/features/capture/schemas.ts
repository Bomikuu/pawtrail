import { z } from 'zod'
import { sessionSchema } from '@/features/auth/schemas'

export const captureSessionSchema = sessionSchema
export const captureStatusSchema = z.object({
  mode: z.literal('real'),
  modelsInstalled: z.boolean(),
  automaticMatchingEnabled: z.boolean(),
  externalComparisonAvailable: z.boolean(),
  queue: z.string(),
})
export const cropSchema = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
export const photoSchema = z.object({ id: z.string(), url: z.string(), alt: z.string() })
export const candidateSchema = z.object({
  animalId: z.string(), name: z.string(), species: z.string(), photo: photoSchema.nullable(),
  areaLabel: z.string(), reasons: z.array(z.string()),
})
export const analysisSchema = z.object({
  analysisId: z.string(), observationId: z.string(), version: z.number(),
  status: z.enum(['queued', 'running', 'complete', 'selection_required', 'needs_retake', 'unavailable', 'failed']),
  stage: z.string(),
  detections: z.array(z.object({ id: z.string(), species: z.string(), score: z.number(), crop: cropSchema })),
  candidates: z.array(candidateSchema), reasons: z.array(z.string()), evidenceFlags: z.array(z.string()),
  automaticAnimalId: z.string().nullable(), species: z.string().nullable(),
  cloudResult: z.object({ observations: z.string(), insufficientEvidence: z.boolean() }).nullable(),
})
export const receiptSchema = z.object({
  observationId: z.string(), version: z.number(), animalId: z.string().nullable(), proposedAnimalId: z.string().nullable(),
  identityState: z.string(), evidenceState: z.string(), publicationState: z.string(), sightingId: z.string().nullable(),
  method: z.string().nullable(), submittedAt: z.string().nullable(),
  rewardStatus: z.enum(['not_awarded', 'pending_review', 'awarded', 'reversed', 'not_eligible', 'daily_limit', 'already_recognized_today', 'capture_time_unknown']),
  rewardAmount: z.number().int().nonnegative(), rewardReason: z.string(), notes: z.string(),
})
export const observationSchema = receiptSchema.extend({
  photoUrl: z.string(), source: z.string(), areaLabel: z.string(), capturedAt: z.string().nullable(),
  analysis: analysisSchema.nullable(), history: z.array(z.object({ method: z.string(), action: z.string(), reason: z.string(), createdAt: z.string() })),
  privateEvidence: z.object({ latitude: z.number().nullable(), longitude: z.number().nullable(), accuracyMeters: z.number().nullable(), locationSource: z.string(), measuredAt: z.string().nullable(), receivedAt: z.string(), metadataLocationPresent: z.boolean() }),
})
export const observationListSchema = z.object({
  items: z.array(receiptSchema.extend({ photoUrl: z.string(), name: z.string(), createdAt: z.string(), areaLabel: z.string().optional() })),
  count: z.number(), nextCursor: z.string().nullable(),
})
export const captureAnimalSchema = z.object({
  id: z.string(), slug: z.string(), name: z.string(), species: z.string(), description: z.string(), appearance: z.string(),
  state: z.string(), areaLabel: z.string(), photo: photoSchema.nullable(), privatePhotoUrl: z.string().nullable(), version: z.number(),
  referenceCount: z.number(), sightingCount: z.number(), lastReportedAt: z.string().nullable(), canManage: z.boolean(),
  location: z.object({ latitude: z.number(), longitude: z.number(), approximateRadiusMeters: z.number(), neighborhood: z.string() }).nullable(),
  sightings: z.array(z.object({ id: z.string(), observedAt: z.string().nullable(), areaLabel: z.string(), photo: photoSchema.nullable(), notes: z.string() })).optional(),
})
export type AnalysisResult = z.infer<typeof analysisSchema>
export type ObservationReceipt = z.infer<typeof receiptSchema>
export type Crop = z.infer<typeof cropSchema>
export type Candidate = z.infer<typeof candidateSchema>
export type CaptureLocation = { latitude: number; longitude: number; accuracyMeters: number | null; measuredAt: string | null; source: 'device' | 'manual' | 'exif' }

export const realWalletSchema = z.object({
  balance: z.number().int().nonnegative(), nonCash: z.literal(true),
  provenance: z.object({ kind: z.literal('real'), label: z.string() }),
  policy: z.object({ sightingReward: z.number().int(), dailySightingLimit: z.number().int(), timezone: z.string(), version: z.string(), oncePerAnimalPerDay: z.boolean() }),
})
export const realLedgerSchema = z.object({
  items: z.array(z.object({ id: z.string(), amount: z.number().int(), balanceAfter: z.number().int().nonnegative(),
    reason: z.enum(['sighting_approved', 'sighting_reversed', 'mission_approved', 'mission_reversed']), contributionId: z.string(), description: z.string(),
    animalName: z.string(), animalId: z.string().nullable(), rewardDay: z.string().nullable(), createdAt: z.string() })),
  count: z.number().int(), nextCursor: z.string().nullable(),
})
export const identificationPolicySchema = z.object({
  id: z.number().int(), version: z.string(), species: z.string(), enabled: z.boolean(), effective: z.boolean(), blockers: z.array(z.string()),
  modelVersion: z.string(), minimumSimilarity: z.number(), minimumMargin: z.number(), calibrationId: z.string().nullable(),
  coverage: z.number().nullable(), wrongMatchUpperBound: z.number().nullable(), createdAt: z.string(),
})
export const identificationSetupSchema = z.object({
  modelVersion: z.string().nullable(), ruleVersion: z.string(), confirmedAnimals: z.number().int(), referencePhotos: z.number().int(),
  qualifiedAnimals: z.number().int(), reviewedEncounters: z.number().int(), calibrationReports: z.number().int(), activePolicies: z.number().int(),
  requirements: z.object({ referencePhotosPerAnimal: z.number(), viewpointsPerAnimal: z.number(), maximumWrongMatchRate: z.number(),
    confidence: z.number(), minimumUnknownQueries: z.number(), minimumUnknownIndividuals: z.number() }),
  animals: z.array(z.object({ animalId: z.string(), name: z.string(), species: z.string(), photo: photoSchema.nullable(), referenceCount: z.number(), viewpoints: z.array(z.string()), ready: z.boolean() })),
  policies: z.array(identificationPolicySchema),
})
