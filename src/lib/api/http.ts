import { z } from 'zod'
import type { RequestOptions } from '@/types/common'
import { ApiError, checkCancelled, normalizeError } from './errors'
import { parseResponse } from './validation'
const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  status: z.number().int(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  requestId: z.string().optional(),
})
export async function request<T extends z.ZodType>(
  method: string,
  path: string,
  schema: T,
  query?: object,
  body?: unknown,
  options?: RequestOptions,
): Promise<z.output<T>> {
  checkCancelled(options?.signal)
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {}))
    if (value !== undefined)
      params.set(
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      )
  const headers = new Headers({ Accept: 'application/json' })
  if (options?.idempotencyKey)
    headers.set('Idempotency-Key', options.idempotencyKey)
  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (
      body &&
      typeof body === 'object' &&
      'file' in body &&
      body.file instanceof Blob
    ) {
      const form = new FormData()
      for (const [key, value] of Object.entries(body)) {
        if (value instanceof Blob) form.set(key, value)
        else form.set(key, String(value))
      }
      payload = form
    } else {
      headers.set('Content-Type', 'application/json')
      payload = JSON.stringify(body)
    }
  }
  try {
    const response = await fetch(
      `/api/v1${path}${params.size ? `?${params}` : ''}`,
      {
        method,
        headers,
        body: payload,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: options?.signal,
      },
    )
    checkCancelled(options?.signal)
    if (!response.ok) {
      const parsed = errorSchema.safeParse(
        await response.json().catch(() => null),
      )
      if (parsed.success && parsed.data.status === response.status) {
        const e = parsed.data
        throw new ApiError(
          e.code,
          e.message,
          e.status,
          e.fieldErrors,
          e.requestId,
        )
      }
      throw new ApiError(
        'HTTP_ERROR',
        'The service could not complete the request',
        response.status,
      )
    }
    const value: unknown =
      response.status === 204
        ? undefined
        : await response.json().catch(() => {
            throw new ApiError(
              'INVALID_RESPONSE',
              'The service returned invalid JSON',
              502,
            )
          })
    return parseResponse(schema, value)
  } catch (error) {
    checkCancelled(options?.signal)
    throw normalizeError(error)
  }
}
