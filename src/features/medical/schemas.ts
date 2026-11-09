import { z } from 'zod'
import { idSchema, listQuerySchema, pageSchema, timestampSchema, versionSchema } from '@/lib/api/schemas'
import { mediaAssetSchema } from '@/features/media/schemas'
export const medicalKindSchema = z.enum(['vaccination', 'vet_visit', 'treatment', 'test', 'other'])
export const medicalStatusSchema = z.enum(['planned', 'performed'])
const day = z.iso.date()
export const medicalRecordSchema = z.object({
  id: idSchema,
  animalId: idSchema,
  kind: medicalKindSchema,
  status: medicalStatusSchema,
  title: z.string(),
  eventDate: day.nullable(),
  followUpDate: day.nullable(),
  publicSummary: z.string(),
  visibility: z.enum(['private', 'public']),
  archived: z.boolean(),
  version: versionSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  sourceLabel: z.literal('Care-team reported'),
  privateDetails: z.object({
    title: z.string(), vaccineProduct: z.string(), doseLabel: z.string(), batchReference: z.string(),
    providerName: z.string(), clinicName: z.string(), notes: z.string(), attachments: z.array(mediaAssetSchema),
    history: z.array(z.object({ version: versionSchema, action: z.string(), reason: z.string(), at: timestampSchema })),
  }).nullable(),
})
export const medicalFiltersSchema = listQuerySchema.extend({ scope: z.enum(['public', 'manage']).default('public'), archive: z.enum(['active', 'archived', 'all']).default('active') })
export const medicalPageSchema = pageSchema(medicalRecordSchema).extend({
  animalId: idSchema,
  viewerCanManage: z.boolean(),
  summary: z.object({ recordsCount: z.number().int().nonnegative(), performedCount: z.number().int().nonnegative(), plannedCount: z.number().int().nonnegative(), nextFollowUp: day.nullable() }),
})
export const medicalInputSchema = z.object({
  kind: medicalKindSchema,
  status: medicalStatusSchema,
  title: z.string().trim().min(1).max(160),
  eventDate: day.nullable(),
  followUpDate: day.nullable(),
  vaccineProduct: z.string().max(160), doseLabel: z.string().max(80), batchReference: z.string().max(100),
  providerName: z.string().max(160), clinicName: z.string().max(160), notes: z.string().max(5000),
  visibility: z.enum(['private', 'public']), publicSummary: z.string().max(500), mediaIds: z.array(idSchema).max(6),
}).strict()
export const medicalUpdateSchema = medicalInputSchema.partial().extend({ expectedVersion: versionSchema, changeReason: z.string().trim().min(1).max(300), archived: z.boolean().optional() }).strict()
export type MedicalRecord = z.infer<typeof medicalRecordSchema>
export type MedicalPage = z.infer<typeof medicalPageSchema>
export type MedicalInput = z.infer<typeof medicalInputSchema>
export type MedicalUpdate = z.infer<typeof medicalUpdateSchema>
export type MedicalFilters = z.input<typeof medicalFiltersSchema>
export type MedicalKind = z.infer<typeof medicalKindSchema>
export const medicalKindLabels: Record<MedicalKind, string> = { vaccination: 'Vaccination', vet_visit: 'Veterinary visit', treatment: 'Treatment', test: 'Test or screening', other: 'Other care' }
