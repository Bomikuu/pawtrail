import { z } from 'zod'
import {
  idSchema,
  listQuerySchema,
  baseSchema,
  versionSchema,
} from '@/lib/api/schemas'
import { animalProfileSchema } from '@/features/animals/schemas'

export const adoptionPreferencesSchema = z.object({
  species: z.enum(['cat', 'dog', 'other']).optional(),
  homeType: z.enum(['apartment', 'house', 'farm']).optional(),
  activity: z.enum(['low', 'medium', 'high']).optional(),
  experience: z.enum(['novice', 'experienced']).optional(),
  otherPets: z.array(z.enum(['cat', 'dog', 'other'])).optional(),
  originAreaId: idSchema.optional(),
  maxDistanceKm: z.number().positive().optional(),
  minAgeMonths: z.number().int().nonnegative().optional(),
  maxAgeMonths: z.number().int().nonnegative().optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  personality: z.array(z.string()).optional(),
})
export const adoptionFiltersSchema = listQuerySchema.extend({
  preferences: adoptionPreferencesSchema.optional(),
  shelterId: idSchema.optional(),
})
export const adoptionCandidateSchema = z.object({
  animal: animalProfileSchema,
  compatibility: z.object({
    score: z.number().min(0).max(100).nullable(),
    answeredWeight: z.number().nonnegative(),
    components: z.array(
      z.object({
        dimension: z.enum([
          'species',
          'home',
          'lifestyle',
          'experience',
          'otherPets',
          'distance',
        ]),
        weight: z.number().positive(),
        score: z.number().min(0).max(1),
        evidence: z.array(z.string()),
        explanation: z.string(),
      }),
    ),
    advisories: z.array(z.string()),
  }),
})
export const applicationAnswersSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  livingSituation: z.string().min(1),
  careExperience: z.string().min(1),
  motivation: z.string().min(1),
  agreement: z.literal(true),
})
export const adoptionApplicationDraftSchema = z.object({
  id: idSchema.optional(),
  animalId: idSchema,
  answers: applicationAnswersSchema.partial(),
  expectedVersion: versionSchema.optional(),
})
export const adoptionApplicationInputSchema = z.object({
  animalId: idSchema,
  draftId: idSchema.optional(),
  expectedVersion: versionSchema.optional(),
  answers: applicationAnswersSchema,
})
export const adoptionApplicationSummarySchema = baseSchema.extend({
  animalId: idSchema,
  applicantId: idSchema,
  shelterId: idSchema,
  status: z.enum([
    'draft',
    'submitted',
    'needs_information',
    'approved',
    'rejected',
    'withdrawn',
  ]),
  version: versionSchema,
})
export const adoptionApplicationSchema =
  adoptionApplicationSummarySchema.extend({
    answers: applicationAnswersSchema.partial(),
    reviewMessage: z.string().nullable(),
  })
export const applicationFiltersSchema = listQuerySchema.extend({
  scope: z.enum(['mine', 'shelter']).optional(),
  shelterId: idSchema.optional(),
  status: adoptionApplicationSummarySchema.shape.status.optional(),
})
export const applicationReviewInputSchema = z.object({
  expectedVersion: versionSchema,
  decision: z.enum(['needs_information', 'approved', 'rejected']),
  message: z.string().min(1),
})
