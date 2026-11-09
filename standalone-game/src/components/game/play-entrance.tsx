import { useEffect, useState } from 'react'
import { ArrowLeft, Compass, Home, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MapViewer, PlatformBridge } from '@/game/platform'

export function PlayEntrance({ platform }: { platform?: PlatformBridge }) {
  const [viewer, setViewer] = useState<MapViewer | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    platform?.mapViewer ? 'loading' : 'ready',
  )
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    if (!platform?.mapViewer) return
    setStatus('loading')
    platform
      .mapViewer()
      .then((value) => {
        if (active) {
          setViewer(value)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [platform, attempt])
  const base = window.location.pathname === '/' ? '/' : '/play'
  const world = base + '?home=system%3Ahub'
  const login =
    platform?.loginHref(world) ?? '/login?returnTo=' + encodeURIComponent(world)
  return (
    <main className="pawtrail-game flex min-h-dvh flex-col bg-background px-5 py-6 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Button asChild variant="ghost">
          <a href="/community">
            <ArrowLeft className="size-4" />
            Community feed
          </a>
        </Button>
      </div>
      <section
        className="mx-auto my-auto w-full max-w-4xl py-10"
        aria-labelledby="play-title"
      >
        <p className="text-sm font-medium text-muted-foreground">
          PawTrail Play
        </p>
        <h1
          id="play-title"
          className="mt-3 font-heading text-4xl font-semibold sm:text-5xl"
        >
          Where would you like to go?
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Spend time in the virtual world, follow a story, or discover published
          community places.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <Home className="size-6 text-primary" />
            <h2 className="font-heading text-2xl font-semibold">
              Community world
            </h2>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              Visit member homes and care for virtual pets. Sign in with your
              PawTrail account.
            </p>
            {status === 'error' ? (
              <>
                <p role="alert" className="text-sm text-muted-foreground">
                  Account status could not load.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  <RefreshCw className="size-4" />
                  Retry account
                </Button>
              </>
            ) : (
              <Button asChild disabled={status === 'loading'}>
                <a
                  href={viewer?.authenticated ? world : login}
                  aria-disabled={status === 'loading'}
                  onClick={(event) => {
                    if (status === 'loading') event.preventDefault()
                  }}
                >
                  {status === 'loading'
                    ? 'Checking account…'
                    : viewer?.authenticated
                      ? 'Enter community world'
                      : 'Sign in to enter'}
                </a>
              </Button>
            )}
          </article>
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <Compass className="size-6 text-primary" />
            <h2 className="font-heading text-2xl font-semibold">
              Story exploration
            </h2>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              Explore a fictional neighborhood at your own pace. Progress stays
              on this device.
            </p>
            <Button asChild variant="outline">
              <a href={base + '?explore=1'}>Explore the story</a>
            </Button>
          </article>
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
            <MapPin className="size-6 text-primary" />
            <h2 className="font-heading text-2xl font-semibold">Places map</h2>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              Browse real published animal and community records. Member homes
              follow their access settings.
            </p>
            <Button asChild variant="outline">
              <a href={base + '?map=community'}>Open places map</a>
            </Button>
          </article>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Game Kibble is virtual, non-cash currency. It is separate from your
          community contribution rewards.
        </p>
      </section>
    </main>
  )
}
