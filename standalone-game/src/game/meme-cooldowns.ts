import {
  CAT_MEMES,
  MEME_COOLDOWN,
  MEME_WHEEL_COOLDOWN,
  type CatMemeId,
} from './cat-memes'

type Cooldowns = {
  wheelUntil: number
  memes: Partial<Record<CatMemeId, number>>
}
const key = 'pawtrail:cat-meme-cooldowns:v1'
const listeners = new Set<() => void>()
const empty = (): Cooldowns => ({ wheelUntil: 0, memes: {} })

function read(): Cooldowns {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!saved || typeof saved !== 'object') return empty()
    const now = Date.now()
    const deadline = (value: unknown, limit: number) =>
      typeof value === 'number' && Number.isFinite(value) && value > now
        ? Math.min(value, now + limit)
        : 0
    return {
      wheelUntil: deadline(saved.wheelUntil, MEME_WHEEL_COOLDOWN),
      memes: Object.fromEntries(
        CAT_MEMES.map((meme) => [
          meme.id,
          deadline(saved.memes?.[meme.id], MEME_COOLDOWN),
        ]),
      ),
    }
  } catch {
    return empty()
  }
}

let snapshot = read()
function publish(next: Cooldowns, persist = true) {
  snapshot = next
  if (persist) {
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }
  for (const listener of listeners) listener()
}
function storage(event: StorageEvent) {
  if (event.key === key || event.key === null) publish(read(), false)
}

export const memeCooldowns = {
  get: () => snapshot,
  subscribe(listener: () => void) {
    if (!listeners.size && typeof window !== 'undefined')
      window.addEventListener('storage', storage)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (!listeners.size && typeof window !== 'undefined')
        window.removeEventListener('storage', storage)
    }
  },
  tryUse(id: CatMemeId) {
    const saved = read()
    const now = Date.now()
    const wheelUntil = Math.max(snapshot.wheelUntil, saved.wheelUntil)
    const memes = Object.fromEntries(
      CAT_MEMES.map((meme) => [
        meme.id,
        Math.max(snapshot.memes[meme.id] ?? 0, saved.memes[meme.id] ?? 0),
      ]),
    ) as Cooldowns['memes']
    if (wheelUntil > now || (memes[id] ?? 0) > now) {
      publish({ wheelUntil, memes })
      return false
    }
    publish({
      wheelUntil: now + MEME_WHEEL_COOLDOWN,
      memes: { ...memes, [id]: now + MEME_COOLDOWN },
    })
    return true
  },
  /** Server durations avoid relying on the browser and server having identical clocks. */
  sync(value: unknown) {
    if (!value || typeof value !== 'object') return
    const data = value as {
      wheelMs?: unknown
      memesMs?: Partial<Record<CatMemeId, unknown>>
    }
    const now = Date.now()
    const duration = (value: unknown, limit: number) =>
      typeof value === 'number' && Number.isFinite(value)
        ? Math.max(0, Math.min(limit, value))
        : 0
    publish({
      wheelUntil: Math.max(
        snapshot.wheelUntil,
        now + duration(data.wheelMs, MEME_WHEEL_COOLDOWN),
      ),
      memes: Object.fromEntries(
        CAT_MEMES.map((meme) => [
          meme.id,
          Math.max(
            snapshot.memes[meme.id] ?? 0,
            now + duration(data.memesMs?.[meme.id], MEME_COOLDOWN),
          ),
        ]),
      ),
    })
  },
}
