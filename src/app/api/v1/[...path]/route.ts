import { getServerApi } from '@/lib/api/server'
import { getApiConfig } from '@/lib/api/config'
import { normalizeError } from '@/lib/api/errors'
import { dispatchApi } from '@/lib/server/api-registry'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function handle(request: Request) {
  try {
    return await dispatchApi(request, {
      api: await getServerApi(),
      mode: getApiConfig().mode,
    })
  } catch (error) {
    const normalized = normalizeError(error)
    return Response.json(normalized.toJSON(), {
      status: normalized.status,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
  handle as OPTIONS,
}
