import { assertSameOrigin } from '@/lib/server/csrf'
import { normalizeError } from '@/lib/api/errors'

export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    assertSameOrigin(request)
    const raw = await request.text()
    if (raw.length > 2000)
      return Response.json(
        { detail: 'Choose a start and destination.' },
        { status: 400, headers },
      )
    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return Response.json(
        { detail: 'Choose a start and destination.' },
        { status: 400, headers },
      )
    }
    const origin =
      process.env.NEXT_PUBLIC_HOUSING_URL || 'http://127.0.0.1:8001'
    const response = await fetch(
      origin.replace(/\/$/, '') + '/api/v1/map/route/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(16000)]),
      },
    )
    const result = await response.json()
    return Response.json(result, { status: response.status, headers })
  } catch (error) {
    const failure = normalizeError(error)
    return Response.json(
      {
        detail:
          failure.status === 403
            ? failure.message
            : 'Walking directions are unavailable. Try again or open Maps.',
      },
      { status: failure.status === 403 ? 403 : 503, headers },
    )
  }
}
