import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Cat, Clock3, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CAT_MEMES, showCatMeme, type CatMemeId } from '@/game/cat-memes'
import { immersionPreferences } from '@/game/immersion-preferences'
import { audio } from '@/game/systems/audio'
import { memeCooldowns } from '@/game/meme-cooldowns'
import bakedActors from '@/game/runtime/baked-actors.json'
import { FrozenGif } from './frozen-gif'
import { CatMemeBubbles } from './cat-meme-bubbles'

const Character = lazy(() => import('./emote-wheel-character'))
const slotCount = 12
const occupied = CAT_MEMES.map(
  (_meme, index) => (slotCount - 1 + index) % slotCount,
)
function sector(index: number, size = 640) {
  const center = size / 2
  const point = (radius: number, angle: number) => {
    const radians = (angle * Math.PI) / 180
    return `${center + radius * Math.cos(radians)} ${center + radius * Math.sin(radians)}`
  }
  const start = -105 + index * 30,
    end = start + 30
  const outer = size * 0.478,
    inner = size * 0.247
  return `M${point(outer, start)} A${outer} ${outer} 0 0 1 ${point(outer, end)} L${point(inner, end)} A${inner} ${inner} 0 0 0 ${point(inner, start)} Z`
}

export function CatMemeWheel({
  disabled,
  appearance = 'rescuer',
  onOpenChange,
  onMeme,
}: {
  disabled?: boolean
  appearance?: string
  onOpenChange?: (open: boolean) => void
  onMeme?: (id: CatMemeId) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [clock, setClock] = useState(Date.now)
  const [systemReduced, setSystemReduced] = useState(false)
  const previousVolume = useRef(0.55)
  const slots = useRef<(HTMLButtonElement | null)[]>([])
  const notify = useRef(onOpenChange)
  notify.current = onOpenChange
  const clipId = useId().replaceAll(':', '')
  const prefs = useSyncExternalStore(
    immersionPreferences.subscribe,
    immersionPreferences.get,
    immersionPreferences.get,
  )
  const muted = prefs.soundboardVolume === 0 || audio.settings.muted
  const cooldowns = useSyncExternalStore(
    memeCooldowns.subscribe,
    memeCooldowns.get,
    memeCooldowns.get,
  )
  const now = Math.max(clock, Date.now())
  const wheelRemaining = Math.max(0, cooldowns.wheelUntil - now)
  const wheelCooling = wheelRemaining > 0
  const memeRemaining = (id: CatMemeId) =>
    Math.max(0, (cooldowns.memes[id] ?? 0) - now)
  const reduced = prefs.reducedEffects || systemReduced
  const nativeAppearance = bakedActors.find(
    (actor) => actor.kind === 'player' && actor.id === appearance,
  )
  const memeIndex = occupied.findIndex((slot) => slot === selected)
  const selectedMeme = memeIndex >= 0 ? CAT_MEMES[memeIndex] : undefined
  const selectedRemaining = selectedMeme ? memeRemaining(selectedMeme.id) : 0
  const angle =
    selected === null ? null : ((-90 + selected * 30) * Math.PI) / 180
  const gaze = {
    x: angle === null ? 0 : Math.cos(angle),
    y: angle === null ? 0 : Math.sin(angle),
  }

  function changeOpen(value: boolean) {
    if (!value) setSelected(null)
    setOpen(value)
    notify.current?.(value)
  }
  useEffect(() => () => notify.current?.(false), [])
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (disabled && open) changeOpen(false)
  }, [disabled, open])
  useEffect(() => {
    const lastDeadline = Math.max(
      cooldowns.wheelUntil,
      ...Object.values(cooldowns.memes).map((value) => value ?? 0),
    )
    setClock(Date.now())
    if (!open && lastDeadline <= Date.now()) return
    const timer = setInterval(() => {
      const current = Date.now()
      setClock(current)
      if (!open && current >= lastDeadline) clearInterval(timer)
    }, 100)
    return () => clearInterval(timer)
  }, [open, cooldowns])

  function choose(index: number) {
    if (disabled) return
    const meme = CAT_MEMES[index]
    if (!meme) return
    setClock(Date.now())
    if (!memeCooldowns.tryUse(meme.id)) return
    showCatMeme(meme.id)
    onMeme?.(meme.id)
    changeOpen(false)
  }
  function toggleSound() {
    if (muted) {
      audio.update({ muted: false })
      immersionPreferences.update({
        soundboardVolume: previousVolume.current || 0.55,
      })
    } else {
      previousVolume.current = prefs.soundboardVolume
      immersionPreferences.update({ soundboardVolume: 0 })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={disabled}
            variant="ghost"
            className={
              'relative h-12 min-w-12 shrink-0 flex-col gap-0.5 rounded-md px-2 text-[10px] text-foreground ' +
              (wheelCooling ? 'bg-secondary' : '')
            }
            aria-label={
              'Open cat meme wheel' +
              (wheelCooling
                ? `, wheel ready in ${Math.ceil(wheelRemaining / 1000)} seconds`
                : '')
            }
          >
            {wheelCooling ? (
              <Clock3 className="size-4" />
            ) : (
              <Cat className="size-4" />
            )}
            {wheelCooling && (
              <span
                aria-hidden="true"
                className="absolute right-0 top-0 rounded-md border bg-card px-1 text-[9px] font-semibold tabular-nums"
              >
                {Math.ceil(wheelRemaining / 1000)}s
              </span>
            )}
            <span className="sm:hidden">Memes</span>
            <span className="hidden sm:inline">Cat memes</span>
          </Button>
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className={
            'pawtrail-game w-[min(34rem,calc(100vw-1rem),calc(100dvh-10rem))] max-w-none gap-0 border-0 bg-transparent p-0 text-foreground shadow-none sm:max-w-none motion-reduce:animate-none ' +
            (reduced
              ? 'data-[state=open]:animate-none data-[state=closed]:animate-none'
              : 'data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-95')
          }
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            slots.current[0]?.focus()
          }}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return
            if (/^[1-9]$/.test(event.key)) {
              event.preventDefault()
              choose(Number(event.key) - 1)
            }
            if (
              ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(
                event.key,
              )
            ) {
              event.preventDefault()
              const current = Math.max(0, memeIndex)
              const next =
                (current +
                  (['ArrowRight', 'ArrowDown'].includes(event.key)
                    ? 1
                    : CAT_MEMES.length - 1)) %
                CAT_MEMES.length
              setSelected(occupied[next])
              slots.current[next]?.focus()
            }
          }}
        >
          <DialogTitle className="sr-only">Cat meme wheel</DialogTitle>
          <DialogDescription className="sr-only">
            {CAT_MEMES.length} cat memes and {slotCount - CAT_MEMES.length}{' '}
            empty slots. Hover or focus a meme to look toward it. Tap to play,
            use arrows and Enter, or press keys 1 to {CAT_MEMES.length}. Escape
            closes the wheel.
          </DialogDescription>
          <div className="mb-1 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="size-10 rounded-md bg-card text-foreground shadow-sm hover:bg-accent"
              aria-label={
                audio.settings.muted
                  ? 'Unmute game and meme sounds'
                  : muted
                    ? 'Unmute meme sounds'
                    : 'Mute meme sounds'
              }
              aria-pressed={muted}
              onClick={toggleSound}
            >
              {muted ? (
                <VolumeX className="size-4" />
              ) : (
                <Volume2 className="size-4" />
              )}
            </Button>
            <DialogClose asChild>
              <Button
                variant="secondary"
                size="icon"
                className="size-10 rounded-md bg-card text-foreground shadow-sm hover:bg-accent"
                aria-label="Close cat meme wheel"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
          <div
            className="relative aspect-square w-full select-none"
            role="group"
            aria-label="Choose a cat meme"
            onPointerMove={(event) => {
              if (event.pointerType === 'touch') return
              const rect = event.currentTarget.getBoundingClientRect()
              const x = (event.clientX - rect.left) / rect.width - 0.5,
                y = (event.clientY - rect.top) / rect.height - 0.5
              const radius = Math.hypot(x, y)
              setSelected(
                radius >= 0.247 && radius <= 0.478
                  ? Math.round(
                      (((Math.atan2(y, x) * 180) / Math.PI + 450) % 360) / 30,
                    ) % slotCount
                  : null,
              )
            }}
            onPointerLeave={() => setSelected(null)}
          >
            <svg
              viewBox="0 0 640 640"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full overflow-visible drop-shadow-lg"
            >
              <defs>
                {Array.from({ length: slotCount }, (_, index) => (
                  <clipPath
                    key={index}
                    id={`${clipId}-${index}`}
                    clipPathUnits="objectBoundingBox"
                  >
                    <path d={sector(index, 1)} />
                  </clipPath>
                ))}
              </defs>
              <circle
                cx="320"
                cy="320"
                r="306"
                className={
                  wheelCooling
                    ? 'fill-secondary stroke-primary stroke-[4]'
                    : 'fill-none'
                }
              />
              <circle
                cx="320"
                cy="320"
                r="158"
                className={wheelCooling ? 'fill-secondary' : 'fill-[#38271e]'}
              />
              {Array.from({ length: slotCount }, (_, index) => (
                <path
                  key={index}
                  d={sector(index)}
                  className={
                    (wheelCooling
                      ? 'fill-secondary stroke-primary/60 stroke-[2] '
                      : occupied.some(
                            (slot, meme) =>
                              slot === index &&
                              memeRemaining(CAT_MEMES[meme].id) > 0,
                          )
                        ? 'fill-muted stroke-foreground/45 stroke-[2] '
                        : selected === index
                          ? 'fill-accent stroke-primary stroke-[4] '
                          : 'fill-card stroke-foreground/45 stroke-[2] ') +
                    'transition-colors motion-reduce:transition-none'
                  }
                />
              ))}
              <circle
                cx="320"
                cy="320"
                r="158"
                className="fill-none stroke-foreground/45 stroke-[3]"
              />
            </svg>
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[48%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full">
              <Suspense
                fallback={
                  nativeAppearance ? (
                    <img
                      src={nativeAppearance.file.replace(
                        'spritesheet.png',
                        'portrait.png',
                      )}
                      alt=""
                      className="mx-auto h-36 w-auto [image-rendering:pixelated] [@media(min-width:640px)_and_(min-height:640px)]:h-48 [@media(max-height:480px)]:h-24"
                    />
                  ) : (
                    <span className="grid size-full place-items-center font-heading text-sm text-[#fae8ce]">
                      Loading character…
                    </span>
                  )
                }
              >
                <Character
                  identity={appearance}
                  gaze={gaze}
                  reduced={reduced}
                />
              </Suspense>
            </div>
            {CAT_MEMES.map((meme, index) => {
              const slot = occupied[index],
                radians = ((-90 + slot * 30) * Math.PI) / 180,
                remaining = Math.max(wheelRemaining, memeRemaining(meme.id)),
                cooling = remaining > 0
              return (
                <Button
                  key={meme.id}
                  ref={(node) => {
                    slots.current[index] = node
                  }}
                  variant="ghost"
                  className="group/meme absolute inset-0 size-full rounded-md border-0 bg-transparent p-0 text-foreground shadow-none hover:bg-transparent focus-visible:border-0 focus-visible:ring-0 dark:hover:bg-transparent"
                  style={{ clipPath: `url(#${clipId}-${slot})` }}
                  aria-label={`Play ${meme.label}, shortcut ${index + 1}${cooling ? `, ready in ${Math.ceil(remaining / 1000)} seconds` : ''}${muted ? ', sound muted' : ''}`}
                  aria-disabled={cooling}
                  onPointerEnter={() => setSelected(slot)}
                  onFocus={() => setSelected(slot)}
                  onClick={() => choose(index)}
                >
                  <span
                    className={
                      'pointer-events-none absolute aspect-square w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-muted ring-offset-2 ring-offset-card group-focus-visible/meme:ring-4 group-focus-visible/meme:ring-primary ' +
                      (cooling
                        ? 'border-foreground/40 '
                        : selected === slot
                          ? 'border-primary ring-4 ring-primary/35 shadow-md ' +
                            (reduced ? '' : 'scale-110 ')
                          : 'border-foreground/30 ') +
                      (reduced
                        ? 'transition-none'
                        : 'transition-[scale,border-color,box-shadow] duration-150 motion-reduce:transition-none')
                    }
                    style={{
                      left: `${50 + 36.3 * Math.cos(radians)}%`,
                      top: `${50 + 36.3 * Math.sin(radians)}%`,
                    }}
                  >
                    <span
                      className={
                        'block size-full overflow-hidden rounded-full ' +
                        (cooling ? 'grayscale' : '')
                      }
                    >
                      <FrozenGif
                        src={meme.gif}
                        fit="cover"
                        className="size-full"
                      />
                    </span>
                    {cooling && (
                      <span className="absolute -bottom-2 left-1/2 flex h-5 min-w-8 -translate-x-1/2 items-center justify-center gap-0.5 rounded-md border border-primary/50 bg-card px-1 text-[10px] font-semibold tabular-nums text-foreground">
                        <Clock3 className="size-2.5" />
                        {Math.ceil(remaining / 1000)}s
                      </span>
                    )}
                  </span>
                </Button>
              )
            })}
            {wheelCooling && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-[61%] flex -translate-x-1/2 items-center gap-1.5 rounded-md border border-primary bg-card px-3 py-1 font-heading text-base font-bold text-foreground shadow-sm"
              >
                <Clock3 className="size-4" />
                <span className="tabular-nums">
                  {Math.ceil(wheelRemaining / 1000)}s
                </span>
                <span className="sr-only">wheel cooldown remaining</span>
              </div>
            )}
          </div>
          <div className="mx-auto mt-2 max-w-full rounded-md bg-card px-4 py-2 text-center shadow-sm">
            <p className="font-heading text-xl font-bold" aria-live="polite">
              {selectedMeme?.label ??
                (selected === null ? 'Cat memes' : 'Empty slot')}
            </p>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {wheelCooling
                ? `Wheel cooldown · ${Math.ceil(wheelRemaining / 1000)}s remaining`
                : selectedRemaining > 0
                  ? `This meme is ready in ${Math.ceil(selectedRemaining / 1000)}s · Try another cat`
                  : `Tap a cat · Keys 1–${CAT_MEMES.length} · Esc to close`}
              {muted ? ' · Sound muted' : ''}
            </p>
            <div className="mt-1 flex justify-center gap-3 text-[10px] text-muted-foreground">
              <a
                href={(selectedMeme ?? CAT_MEMES[0]).source}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Myinstants
              </a>
              {selectedMeme && (
                <a
                  href={selectedMeme.gif}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {selectedMeme.provider}
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CatMemeBubbles />
    </>
  )
}
