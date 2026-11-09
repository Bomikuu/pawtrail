import { z } from 'zod'
import { ApiError } from '@/lib/api/errors'

/** A separate live boundary while the rest of the site can still show sample data. */
export async function captureRequest<T extends z.ZodType>(path: string, schema: T, options: {
  method?: string
  body?: unknown
  key?: string
  signal?: AbortSignal
} = {}): Promise<z.output<T>> {
  const headers = new Headers({ Accept: 'application/json' })
  if (options.key) headers.set('Idempotency-Key', options.key)
  let body: BodyInit | undefined
  if (options.body instanceof FormData) body = options.body
  else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }
  const response = await fetch('/api/capture/' + path, {
    method: options.method ?? 'GET', headers, body, signal: options.signal,
    credentials: 'same-origin', cache: 'no-store',
  })
  const value = response.status === 204 ? undefined : await response.json().catch(() => null)
  if (!response.ok) {
    const error = value && typeof value === 'object' ? value : {}
    const fields = Object.entries(error.fieldErrors ?? {}).map(([name, messages]) => name + ': ' + String(messages)).join(' ')
    throw new ApiError(error.code ?? 'CAPTURE_UNAVAILABLE', (error.message ?? 'The capture service is unavailable. Your photo is still here.') + (fields ? ' ' + fields : ''), response.status)
  }
  return schema.parse(value)
}
