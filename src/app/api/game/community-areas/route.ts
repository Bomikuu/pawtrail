export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const allowed = new URLSearchParams()
  for (const key of ['bbox', 'id']) {
    const value = query.get(key)
    if (value !== null && value.length < 200) allowed.set(key, value)
  }
  try {
    const origin =
      process.env.NEXT_PUBLIC_HOUSING_URL || 'http://127.0.0.1:8001'
    const response = await fetch(
      origin.replace(/\/$/, '') + '/api/v1/map/communities/?' + allowed,
      {
        cache: 'no-store',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(8000)]),
      },
    )
    if (!response.ok)
      return Response.json(
        { detail: 'Local community borders are unavailable.' },
        { status: response.status === 400 ? 400 : 503 },
      )
    return Response.json(await response.json(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json(
      {
        detail:
          'Local community borders are unavailable. You can keep browsing the map.',
      },
      { status: 503 },
    )
  }
}
