import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { cookies } from 'next/headers'
import { getServerApi } from '@/lib/api/server'
import { assertSameOrigin } from '@/lib/server/csrf'
import { getApiConfig } from '@/lib/api/config'
import { DEMO_COOKIE, demoDataDir } from '@/lib/server/demo/session'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { animalSprite } from '@/game/platform'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function secret() {
  if (process.env.PAWTRAIL_GAME_SECRET) return process.env.PAWTRAIL_GAME_SECRET
  if (process.env.NODE_ENV === 'production')
    throw new Error('PAWTRAIL_GAME_SECRET must be configured')
  const dir =
    process.env.PAWTRAIL_GAME_DATA_DIR ||
    join(homedir(), '.local/share/pawtrail-housing')
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const file = join(dir, 'bridge-secret')
  try {
    await writeFile(file, randomBytes(32).toString('hex'), {
      flag: 'wx',
      mode: 0o600,
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }
  return (await readFile(file, 'utf8')).trim()
}
const catSprite = (appearance: string) => {
  const a = appearance.toLowerCase()
  if (/tuxedo/.test(a)) return 'tuxedo'
  if (/gray.*white|grey.*white/.test(a)) return 'gray-white'
  if (/brown/.test(a)) return 'brown-tabby'
  if (/cream/.test(a)) return 'cream-cat'
  if (/gray|grey/.test(a)) return 'gray-tabby'
  return (
    (
      {
        orange_tabby: 'orange-tabby',
        black_cat: 'black-cat',
        white_cat: 'white-cat',
        calico_cat: 'calico',
        siamese_cat: 'siamese',
      } as Record<string, string>
    )[animalSprite('cat', appearance)] || 'orange-tabby'
  )
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
  } catch {
    return Response.json(
      { detail: 'A same-origin request is required.' },
      { status: 403 },
    )
  }
  try {
    if (new URL(request.url).searchParams.get('demo') === '1') {
      if (
        process.env.NODE_ENV === 'production' ||
        getApiConfig().mode !== 'mock'
      )
        return Response.json(
          {
            detail:
              'The guest sample neighborhood is available only in local demo mode.',
          },
          { status: 403 },
        )
      const jar = await cookies()
      let visitor = jar.get('pawtrail-map-guest')?.value
      if (!visitor || !/^[0-9a-f-]{36}$/.test(visitor)) {
        visitor = randomUUID()
        jar.set('pawtrail-map-guest', visitor, {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 86400,
        })
      }
      const payload = {
        aud: 'pawtrail-housing',
        id: 'demo:map-guest:' + visitor,
        username: 'demo-visitor-' + visitor.slice(0, 8),
        name: 'Demo Visitor',
        avatar:
          '/pawtrail-game/game-assets/dialogue-portraits/male-blonde-scout.png',
        sample: true,
        demoVisitor: true,
        pets: [],
        exp: Math.floor(Date.now() / 1000) + 120,
      }
      const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
      const signature = createHmac('sha256', await secret())
        .update(encoded)
        .digest('base64url')
      return Response.json(
        {
          ticket: encoded + '.' + signature,
          expires: payload.exp,
          backend:
            process.env.NEXT_PUBLIC_HOUSING_URL || 'http://127.0.0.1:8001',
          petImportNote:
            'Demo visit: fictional hosts and animals. Your platform account is unchanged.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    const api = await getServerApi(),
      session = await api.auth.session(),
      actor = session.actor
    if (!actor)
      return Response.json(
        { detail: 'Sign in to enter your home.' },
        { status: 401 },
      )
    const config = getApiConfig()
    let ownedIds: Set<string> | null = null
    if (config.mode === 'mock') {
      const id = (await cookies()).get(DEMO_COOKIE)?.value
      if (id) {
        const repository = await openDemoRepository(id, demoDataDir())
        ownedIds = await repository.read(
          (state) =>
            new Set(
              state.data.animals
                .filter(
                  (a) =>
                    a.ownerId === actor.id &&
                    a.status === 'owned' &&
                    a.moderation === 'published',
                )
                .map((a) => a.id),
            ),
        )
      }
    }
    // A shelter manager's 'mine' scope includes organization animals. Never mistake those for personal pets.
    const canResolveOwner =
      config.mode === 'mock'
        ? !!ownedIds
        : !actor.roles.includes('shelter_staff') // Social metadata records actual caretakers; identity contribution alone does not.
    const pets = []
    const mapPets = []
    if (canResolveOwner) {
      const page = await api.animals.list({ scope: 'mine', limit: 50 })
      const visible = page.items.length
        ? await api.animals
            .list({
              scope: 'public',
              ids: page.items.map((a) => a.id),
              limit: 50,
            })
            .catch(() => ({ items: [] }))
        : { items: [] }
      const publicIds = new Set(visible.items.map((a) => a.id))
      for (const a of page.items.filter(
        (a) =>
          a.status === 'owned' &&
          (!ownedIds || ownedIds.has(a.id)) &&
          publicIds.has(a.id) &&
          (a.species === 'cat' || a.species === 'dog'),
      )) {
        mapPets.push({
          id: a.id,
          slug: a.slug,
          name: a.name.slice(0, 100),
          species: a.species,
          photo:
            a.photo && !a.photo.sensitive
              ? { url: a.photo.url, alt: a.photo.alt }
              : null,
          mapVisible: true,
        })
      }
      for (const a of page.items
        .filter(
          (a) =>
            a.species === 'cat' &&
            a.status === 'owned' &&
            (!ownedIds || ownedIds.has(a.id)),
        )
        .slice(0, 12)) {
        const p = await api.animals.get(a.slug)
        if (p.reviewState && p.reviewState !== 'published') continue
        pets.push({
          id: p.id,
          slug: p.slug,
          name: p.name.slice(0, 100),
          species: p.species,
          gender: p.gender,
          ageMonths: p.ageMonths,
          appearance: p.appearance.slice(0, 300),
          personality: p.personality.slice(0, 8).map((t) => t.slice(0, 50)),
          description: p.description.slice(0, 1000),
          photo:
            p.photo && !p.photo.sensitive
              ? { url: p.photo.url, alt: p.photo.alt }
              : null,
          sprite: catSprite(p.appearance),
          sample: p.provenance.kind !== 'real',
          mapVisible: publicIds.has(p.id),
        })
      }
    }
    const payload = {
      mapReviewer: actor.roles.includes('moderator'),
      aud: 'pawtrail-housing',
      id: (session.mode === 'mock' ? 'demo:' : 'real:') + actor.id,
      username: actor.username,
      name: actor.displayName,
      avatar: actor.avatar?.url || '',
      sample: session.mode === 'mock',
      pets,
      mapPets,
      exp: Math.floor(Date.now() / 1000) + 120,
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = createHmac('sha256', await secret())
      .update(encoded)
      .digest('base64url')
    return Response.json(
      {
        ticket: encoded + '.' + signature,
        expires: payload.exp,
        backend: process.env.NEXT_PUBLIC_HOUSING_URL || 'http://127.0.0.1:8001',
        petImportNote: canResolveOwner
          ? null
          : 'Personal pet ownership is not available for this account role. Organization animals are kept out of your home.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      {
        detail:
          'The game session could not be opened. Check the housing service configuration and retry.',
      },
      { status: 503 },
    )
  }
}
