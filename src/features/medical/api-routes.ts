import type { ApiRoute } from '@/lib/server/api-routes'
import { parseInput, parseResponse } from '@/lib/api/validation'
import { medicalFiltersSchema, medicalInputSchema, medicalUpdateSchema, medicalPageSchema, medicalRecordSchema } from './schemas'
export const medicalRoutes: ApiRoute[] = [
  { method: 'GET', path: '/animals/:animal/medical', invoke: async (api, p, q, _body, options) => parseResponse(medicalPageSchema, await api.medical.list(p.animal, parseInput(medicalFiltersSchema, q), options)) },
  { method: 'POST', path: '/animals/:animal/medical', invoke: async (api, p, _q, body, options) => parseResponse(medicalRecordSchema, await api.medical.create(p.animal, parseInput(medicalInputSchema, body), options)) },
  { method: 'PATCH', path: '/animals/:animal/medical/:record', invoke: async (api, p, _q, body, options) => parseResponse(medicalRecordSchema, await api.medical.update(p.animal, p.record, parseInput(medicalUpdateSchema, body), options)) },
]
