import type { ListQuery, Page } from '@/types/common'
import { ApiError } from './errors'
import { listQuerySchema } from './schemas'
import { parseInput } from './validation'
/** Cursor is bound to the resource/filter scope and the last stable row key. */
export function paginate<T extends { id: string; createdAt: string }>(
  records: T[],
  query: ListQuery,
  scope: string,
): Page<T> {
  const { limit, cursor } = parseInput(listQuerySchema, query)
  const sorted = [...records].sort(
    (a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      b.id.localeCompare(a.id),
  )
  let start = 0
  if (cursor) {
    try {
      const decoded: unknown = JSON.parse(
        new TextDecoder().decode(
          Uint8Array.from(atob(cursor), (char) => char.charCodeAt(0)),
        ),
      )
      if (
        !Array.isArray(decoded) ||
        decoded.length !== 3 ||
        decoded[0] !== scope
      )
        throw new Error()
      const position = sorted.findIndex(
        (row) => row.createdAt === decoded[1] && row.id === decoded[2],
      )
      if (position < 0) throw new Error()
      start = position + 1
    } catch {
      throw new ApiError(
        'INVALID_CURSOR',
        'The page cursor is invalid for this query',
        400,
      )
    }
  }
  const items = sorted.slice(start, start + limit)
  const last = items.at(-1)
  return {
    items,
    count: records.length,
    nextCursor:
      last && start + items.length < records.length
        ? btoa(
            String.fromCharCode(
              ...new TextEncoder().encode(
                JSON.stringify([scope, last.createdAt, last.id]),
              ),
            ),
          )
        : null,
  }
}
