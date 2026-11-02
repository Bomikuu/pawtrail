import { z } from 'zod'
import { ApiError } from './errors'
export function parseResponse<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.output<T> {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new ApiError(
      'INVALID_RESPONSE',
      'The service returned an invalid record',
      502,
    )
  return result.data
}
export function parseInput<T extends z.ZodType>(
  schema: T,
  value: unknown,
): z.output<T> {
  const result = schema.safeParse(value)
  if (!result.success) {
    const fields: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'input'
      const messages = fields[path] ?? []
      messages.push(issue.message)
      fields[path] = messages
    }
    throw new ApiError(
      'VALIDATION_ERROR',
      'Check the submitted values',
      400,
      fields,
    )
  }
  return result.data
}
