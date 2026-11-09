import { NextResponse, type NextRequest } from 'next/server'
import { realSessionNeedsRenewal } from '@/lib/server/real-session'
import { requestOrigin } from '@/lib/server/csrf'

export function proxy(request: NextRequest) {
  if (
    request.method !== 'GET' ||
    process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ||
    /\.(?:png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|json|mp3|ogg|wav|mp4|webm|css|js|map)$/i.test(
      request.nextUrl.pathname,
    ) ||
    !realSessionNeedsRenewal(request.cookies.get('pawtrail_session')?.value)
  )
    return NextResponse.next()

  const origin = requestOrigin(request)
  if (!origin) return new NextResponse(null, { status: 400 })
  const destination = new URL('/auth/renew', origin)
  destination.searchParams.set(
    'returnTo',
    request.nextUrl.pathname + request.nextUrl.search,
  )
  // Proxy requires an absolute Location; use the browser Host rather than Next's
  // normalized loopback origin so cookies stay on 127.0.0.1 when used there.
  const response = NextResponse.redirect(destination)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export const config = {
  matcher: ['/((?!api/|_next/|auth/renew).*)'],
}
