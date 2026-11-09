import { captureGateway } from '@/lib/server/capture-gateway'
export const runtime = 'nodejs'
async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return captureGateway(request, path.join('/'))
}
export { handle as GET, handle as POST, handle as DELETE }
