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
function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32)
    throw new ApiError(
      'CONFIGURATION_ERROR',
      'Real sign-in requires a server-only SESSION_SECRET of at least 32 characters',
      500,
    )
  return createHash('sha256').update(secret).digest()
}
export async function readRealSession(): Promise<Tokens | null> {
  const value = (await cookies()).get(name)?.value
  if (!value) return null
  try {
    const [iv, tag, body] = value.split('.')
    if (!iv || !tag || !body) return null
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key(),
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
export async function writeRealSession(tokens: Tokens | null) {
  const jar = await cookies()
  if (!tokens) {
    jar.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
    return
  }
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key(), iv),
    data = Buffer.concat([
      cipher.update(JSON.stringify(tokens)),
      cipher.final(),
    ])
  jar.set(
    name,
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
