export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
      ...(this.requestId ? { requestId: this.requestId } : {}),
    }
  }
}
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'AbortError'
  )
    return new ApiError('CANCELLED', 'Request was cancelled', 499)
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'TimeoutError'
  )
    return new ApiError('TIMEOUT', 'Request timed out', 504)
  return new ApiError('INTERNAL_ERROR', 'Unable to complete the request', 500)
}
export function checkCancelled(signal?: AbortSignal) {
  if (signal?.aborted)
    throw new ApiError('CANCELLED', 'Request was cancelled', 499)
}
export async function notImplemented(...args: unknown[]): Promise<never> {
  const options = args.at(-1)
  if (
    options &&
    typeof options === 'object' &&
    'signal' in options &&
    options.signal &&
    typeof options.signal === 'object' &&
    'aborted' in options.signal &&
    options.signal.aborted
  )
    throw new ApiError('CANCELLED', 'Request was cancelled', 499)
  throw new ApiError(
    'NOT_IMPLEMENTED',
    'This feature is not implemented yet',
    501,
  )
}
