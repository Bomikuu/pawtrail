import 'server-only'
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ApiError } from '@/lib/api/errors'
const name = 'pawtrail_session'
const tokensSchema = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  scope: z.string().min(1),
})
export type Tokens = z.infer<typeof tokensSchema>
function key(secret = process.env.SESSION_SECRET) {
  if (!secret || secret.length < 32)
    throw new ApiError(
      'CONFIGURATION_ERROR',
      'Real sign-in requires a server-only SESSION_SECRET of at least 32 characters',
      500,
    )
  return createHash('sha256').update(secret).digest()
}
export function decodeRealSession(
  value?: string,
  secret?: string,
): Tokens | null {
  if (!value) return null
  try {
    const [iv, tag, body] = value.split('.')
    if (!iv || !tag || !body) return null
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key(secret),
      Buffer.from(iv, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return tokensSchema.parse(
      JSON.parse(
        Buffer.concat([
          decipher.update(Buffer.from(body, 'base64url')),
          decipher.final(),
        ]).toString('utf8'),
      ),
    )
  } catch {
    return null
  }
}
export async function readRealSession(
  cookieName = name,
  secret?: string,
): Promise<Tokens | null> {
  return decodeRealSession((await cookies()).get(cookieName)?.value, secret)
}
/** Only an expiry hint from the authenticated cookie; Django still verifies the JWT. */
export function realSessionNeedsRenewal(
  value?: string,
  now = Date.now(),
): boolean {
  const tokens = decodeRealSession(value)
  if (!tokens) return false
  try {
    const payload = JSON.parse(
      Buffer.from(tokens.access.split('.')[1], 'base64url').toString('utf8'),
    )
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= now + 60_000
  } catch {
    return true
  }
}
export async function writeRealSession(
  tokens: Tokens | null,
  cookieName = name,
  secret?: string,
) {
  const jar = await cookies()
  if (!tokens) {
    jar.set(cookieName, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
    return
  }
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(secret), iv),
    data = Buffer.concat([
      cipher.update(JSON.stringify(tokens)),
      cipher.final(),
    ])
  jar.set(
    cookieName,
    [iv, cipher.getAuthTag(), data]
      .map((b) => b.toString('base64url'))
      .join('.'),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    },
  )
}
export function assertRealSessionConfiguration() {
  key()
}
