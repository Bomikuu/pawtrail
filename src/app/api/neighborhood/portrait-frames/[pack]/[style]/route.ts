import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'

export const runtime = 'nodejs'

/** Public art transport for browsers without DecompressionStream('brotli'). */
export async function GET(request: Request, { params }: { params: Promise<{ pack: string; style: string }> }) {
  const { pack, style } = await params
  if (![pack, style].every(value => /^[a-z0-9-]{1,100}$/.test(value))) {
    return new Response('Portrait not found', { status: 404 })
  }
  try {
    const bytes = await readFile(join(process.cwd(), 'public/pawtrail-game/game-assets/dialogue-portraits', pack, style, 'portrait.frames.br'))
    if (bytes.length > 300000) return new Response('Portrait unavailable', { status: 404 })
    const acceptsBrotli = /\bbr\b/.test(request.headers.get('accept-encoding') ?? '')
    return new Response(new Uint8Array(acceptsBrotli ? bytes : brotliDecompressSync(bytes)), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'Vary': 'Accept-Encoding',
        ...(acceptsBrotli ? { 'Content-Encoding': 'br' } : {}),
      },
    })
  } catch {
    return new Response('Portrait not found', { status: 404 })
  }
}
