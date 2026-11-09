export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const query = new URLSearchParams(new URL(request.url).search)
  const allowed = new URLSearchParams({
    sample: 'false',
  })
  for (const key of ['bbox', 'latitude', 'longitude', 'radius']) {
    const value = query.get(key)
    if (value !== null && value.length < 200) allowed.set(key, value)
  }
  try {
    const origin =
      process.env.NEXT_PUBLIC_HOUSING_URL || 'http://127.0.0.1:8001'
    const response = await fetch(
      origin.replace(/\/$/, '') + '/api/v1/map/entities/?' + allowed,
      {
        cache: 'no-store',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
      },
    )
    if (!response.ok)
      return Response.json(
        { detail: 'Published community records are unavailable.' },
        { status: response.status === 400 ? 400 : 503 },
      )
    return Response.json(await response.json(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return Response.json(
      {
        detail:
          'The community reporting service is unavailable. Public profiles and places still work.',
      },
      { status: 503 },
    )
  }
}
