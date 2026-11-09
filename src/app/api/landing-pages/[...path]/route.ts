import { assertSameOrigin } from '@/lib/server/csrf'
import { landingRequest } from '@/features/landing-pages/server'
import { normalizeError } from '@/lib/api/errors'
async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    assertSameOrigin(request)
    const parts = (await context.params).path
    if (parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part)))
      return Response.json({ message: 'Route not found.' }, { status: 404 })
    const url = new URL(request.url)
    const path =
      parts.join('/') + (parts[0] === 'builder' ? '/' : '') + url.search
    const headers = new Headers()
    if (request.headers.get('content-type'))
      headers.set('Content-Type', request.headers.get('content-type')!)
    const body =
      request.method === 'GET' ? undefined : await request.arrayBuffer()
    if (body && body.byteLength > 9 * 1024 * 1024)
      return Response.json(
        { message: 'Choose an image smaller than 8 MB.' },
        { status: 413 },
      )
    const upstream = await landingRequest(
      path,
      { method: request.method, headers, body },
      parts[0] === 'public',
    )
    const resultHeaders = new Headers({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    resultHeaders.set(
      'Content-Type',
      upstream.headers.get('content-type') ?? 'application/json',
    )
    return new Response(upstream.body, {
      status: upstream.status,
      headers: resultHeaders,
    })
  } catch (error) {
    const value = normalizeError(error)
    return Response.json(value, { status: value.status })
  }
}
export { handler as GET, handler as POST, handler as PUT, handler as DELETE }
