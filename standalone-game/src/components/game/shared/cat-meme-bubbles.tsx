import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Cat, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { audio } from '@/game/systems/audio'
import { immersionPreferences } from '@/game/immersion-preferences'
import {
  catMeme,
  MEME_EVENT,
  MEME_ANCHOR_EVENT,
  MEME_LIFETIME,
  type CatMeme,
  type MemeRequest,
  type MemeAnchor,
} from '@/game/cat-memes'
import { FrozenGif } from './frozen-gif'

type Bubble = MemeRequest & {
  key: number
  meme: CatMeme
  closing: boolean
  error: boolean
}
type Clip = {
  key: number
  request: MemeRequest
  audio: HTMLAudioElement
  started: number
  timer: ReturnType<typeof setTimeout>
  exit?: ReturnType<typeof setTimeout>
}
const pixelShape =
  'polygon(0 6px,6px 6px,6px 0,calc(100% - 6px) 0,calc(100% - 6px) 6px,100% 6px,100% calc(100% - 6px),calc(100% - 6px) calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,6px calc(100% - 6px),0 calc(100% - 6px))'

function MemePicture({ meme, still }: { meme: CatMeme; still: boolean }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div className="grid aspect-square place-items-center text-center text-xs text-muted-foreground">
        <Cat className="size-7" />
        <span>GIF unavailable</span>
      </div>
    )
  return still ? (
    <FrozenGif src={meme.gif} className="aspect-square size-full" />
  ) : (
    <img
      src={meme.gif}
      alt=""
      referrerPolicy="no-referrer"
      className="aspect-square w-full object-contain [image-rendering:pixelated]"
      onError={() => setFailed(true)}
    />
  )
}

function volume(request: MemeRequest) {
  const prefs = immersionPreferences.get()
  if (audio.settings.muted || (!request.local && prefs.muteOthers)) return 0
  return Math.max(
    0,
    Math.min(
      1,
      prefs.soundboardVolume *
        audio.settings.master *
        audio.settings.effects *
        (request.local ? 1 : 1 - request.distance / prefs.audioRange),
    ),
  )
}

export function CatMemeBubbles() {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const clips = useRef(new Map<string, Clip>())
  const nodes = useRef(new Map<string, HTMLDivElement>())
  const sequence = useRef(0)
  const prefs = useSyncExternalStore(
    immersionPreferences.subscribe,
    immersionPreferences.get,
    immersionPreferences.get,
  )
  const [reduced, setReduced] = useState(false)

  function release(clip: Clip) {
    clearTimeout(clip.timer)
    clearTimeout(clip.exit)
    clip.audio.onended = null
    clip.audio.onerror = null
    clip.audio.pause()
    clip.audio.removeAttribute('src')
    clip.audio.load()
  }

  function close(actorId: string) {
    const clip = clips.current.get(actorId)
    if (!clip || clip.exit) return
    release(clip)
    setBubbles((items) =>
      items.map((item) =>
        item.key === clip.key ? { ...item, closing: true } : item,
      ),
    )
    clip.exit = setTimeout(() => {
      if (clips.current.get(actorId) !== clip) return
      clips.current.delete(actorId)
      setBubbles((items) => items.filter((item) => item.key !== clip.key))
    }, 180)
  }

  function play(clip: Clip) {
    const currentVolume = volume(clip.request)
    clip.audio.volume = currentVolume
    if (!currentVolume) return
    setBubbles((items) =>
      items.map((item) =>
        item.key === clip.key ? { ...item, error: false } : item,
      ),
    )
    if (!clip.audio.getAttribute('src'))
      clip.audio.src = catMeme(clip.request.id)!.sound
    void clip.audio.play().catch(() => {
      if (
        clips.current.get(clip.request.actorId) === clip &&
        clip.request.local
      )
        setBubbles((items) =>
          items.map((item) =>
            item.key === clip.key ? { ...item, error: true } : item,
          ),
        )
    })
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    const receive = (event: Event) => {
      const request = (event as CustomEvent<MemeRequest>).detail
      const meme = request && catMeme(request.id)
      if (!meme || !request.actorId || !Number.isFinite(request.distance))
        return
      if (clips.current.size >= 4 && !clips.current.has(request.actorId)) {
        const oldest = clips.current.entries().next().value
        if (oldest) {
          release(oldest[1])
          clips.current.delete(oldest[0])
          setBubbles((items) =>
            items.filter((item) => item.key !== oldest[1].key),
          )
        }
      }
      const previous = clips.current.get(request.actorId)
      if (previous) release(previous)
      const key = ++sequence.current
      const element = new Audio()
      element.preload = 'none'
      const clip: Clip = {
        key,
        request,
        audio: element,
        started: Date.now(),
        timer: setTimeout(() => close(request.actorId), MEME_LIFETIME),
      }
      element.onended = () => {
        if (clips.current.get(request.actorId) !== clip) return
        clearTimeout(clip.timer)
        clip.timer = setTimeout(
          () => close(request.actorId),
          Math.max(0, 3500 - (Date.now() - clip.started)),
        )
      }
      element.onerror = () => {
        if (clips.current.get(request.actorId) === clip && request.local)
          setBubbles((items) =>
            items.map((item) =>
              item.key === key ? { ...item, error: true } : item,
            ),
          )
      }
      clips.current.set(request.actorId, clip)
      setBubbles((items) => [
        ...items.filter((item) => item.actorId !== request.actorId),
        { ...request, meme, key, closing: false, error: false },
      ])
      // Remain in the original click's call stack so browser playback has user activation.
      play(clip)
    }
    const position = (event: Event) => {
      const point = (event as CustomEvent<MemeAnchor>).detail
      const node = point && nodes.current.get(point.actorId)
      if (!node) return
      node.dataset.visible = String(point.visible)
      node.style.setProperty('--meme-x', point.x + 'px')
      node.style.setProperty(
        '--meme-y',
        Math.max(point.viewportTop + node.offsetHeight + 8, point.y) + 'px',
      )
    }
    const hide = () => {
      if (document.hidden) for (const id of clips.current.keys()) close(id)
    }
    window.addEventListener(MEME_EVENT, receive)
    window.addEventListener(MEME_ANCHOR_EVENT, position)
    document.addEventListener('visibilitychange', hide)
    return () => {
      window.removeEventListener(MEME_EVENT, receive)
      window.removeEventListener(MEME_ANCHOR_EVENT, position)
      document.removeEventListener('visibilitychange', hide)
      media.removeEventListener('change', update)
      for (const clip of clips.current.values()) release(clip)
      clips.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!bubbles.length) return
    const timer = setInterval(() => {
      for (const clip of clips.current.values())
        clip.audio.volume = volume(clip.request)
    }, 250)
    return () => clearInterval(timer)
  }, [bubbles.length])

  if (!bubbles.length) return null
  return createPortal(
    <div className="pawtrail-game pointer-events-none fixed inset-0 z-[45]">
      {bubbles.map((item) => (
        <div
          key={item.key}
          ref={(node) => {
            if (node) nodes.current.set(item.actorId, node)
            else nodes.current.delete(item.actorId)
          }}
          className="invisible fixed w-26 -translate-x-1/2 -translate-y-full [left:var(--meme-x)] [top:var(--meme-y)] data-[visible=true]:visible [@media(max-height:560px)]:w-22"
        >
          <div
            className={
              (reduced || prefs.reducedEffects
                ? ''
                : item.closing
                  ? 'animate-out fade-out zoom-out-75 '
                  : 'animate-in fade-in zoom-in-50 ') +
              'relative origin-bottom drop-shadow-md duration-200 motion-reduce:animate-none'
            }
          >
            <div
              className="bg-foreground p-0.5"
              style={{ clipPath: pixelShape }}
            >
              <div
                role="status"
                className="bg-card p-1.5 text-foreground"
                style={{ clipPath: pixelShape }}
              >
                {(prefs.emoteEffects || item.local) && (
                  <div className="overflow-hidden rounded-sm bg-muted">
                    <MemePicture
                      meme={item.meme}
                      still={
                        reduced || prefs.reducedEffects || !prefs.emoteEffects
                      }
                    />
                  </div>
                )}
                <p className="mt-1 truncate text-center font-heading text-[11px] font-bold leading-4">
                  {item.meme.label}
                </p>
                {item.error && item.local && (
                  <div className="pointer-events-auto mt-1 flex items-center gap-1 border-t pt-1">
                    <p className="min-w-0 flex-1 text-[10px] leading-tight">
                      Sound unavailable
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-7 shrink-0 rounded-md"
                      aria-label={'Try ' + item.meme.label + ' sound again'}
                      title="Try sound again"
                      onClick={() => {
                        const clip = clips.current.get(item.actorId)
                        if (clip) play(clip)
                      }}
                    >
                      <Volume2 className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 12"
              className="mx-auto -mt-px h-3 w-6"
            >
              <path
                d="M0 0H24V4H20V8H16V12H8V8H4V4H0Z"
                className="fill-foreground"
              />
              <path d="M5 0H19V3H16V6H13V8H11V6H8V3H5Z" className="fill-card" />
            </svg>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="group/bubble-stop pointer-events-auto absolute -right-3 -top-3 size-11 rounded-md p-0 hover:bg-transparent focus-visible:ring-0 dark:hover:bg-transparent"
              aria-label={'Stop ' + item.meme.label}
              title="Stop meme"
              onClick={() => close(item.actorId)}
            >
              <span className="grid size-5 place-items-center rounded-md border border-border bg-card text-foreground group-hover/bubble-stop:bg-accent group-focus-visible/bubble-stop:ring-2 group-focus-visible/bubble-stop:ring-ring group-focus-visible/bubble-stop:ring-offset-2">
                <X className="size-3" />
              </span>
            </Button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}
