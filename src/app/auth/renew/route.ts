import { getApiConfig } from '@/lib/api/config'
import { createDjangoApi } from '@/lib/api/adapters/django'
import { loginPath, validateReturnPath } from '@/features/auth/return-path'
import { writeRealSession } from '@/lib/server/real-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Renew before streaming a page, while a rotated session cookie can still be saved. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = validateReturnPath(url.searchParams.get('returnTo'))
  const config = getApiConfig()
  let destination = returnTo
  if (config.mode === 'real') {
    const session = await createDjangoApi(config.djangoOrigin, {
      allowCookieWrites: true,
      forceRefresh: true,
    }).auth.session()
    if (!session.actor) {
      await writeRealSession(null)
      destination = loginPath(returnTo)
    }
  }
  // Relative redirects retain the browser host, including 127.0.0.1 dev previews.
  return new Response(null, {
    status: 307,
    headers: { Location: destination, 'Cache-Control': 'no-store' },
  })
}
