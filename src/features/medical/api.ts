import type { request } from '@/lib/api/http'
import { medicalPageSchema, medicalRecordSchema, type MedicalFilters, type MedicalInput, type MedicalUpdate } from './schemas'
import type { RequestOptions } from '@/types/common'
export function createMedicalApi(transport: typeof request) {
  const path = (animal: string) => `/animals/${encodeURIComponent(animal)}/medical`
  return {
    list: (animal: string, filters: MedicalFilters, options?: RequestOptions) => transport('GET', path(animal), medicalPageSchema, filters, undefined, options),
    create: (animal: string, input: MedicalInput, options?: RequestOptions) => transport('POST', path(animal), medicalRecordSchema, undefined, input, options),
    update: (animal: string, id: string, input: MedicalUpdate, options?: RequestOptions) => transport('PATCH', path(animal) + '/' + encodeURIComponent(id), medicalRecordSchema, undefined, input, options),
  }
}
