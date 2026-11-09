'use client'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ExternalLink,
  LayoutTemplate,
  LoaderCircle,
  Plus,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { landingTemplates, landingDocument } from './templates'
import { useRouter } from 'next/navigation'
type Shelter = {
  id: string
  slug: string
  name: string
  description: string
  websiteId: string | null
  published: boolean
}
export function LandingWorkspace() {
  const [rows, setRows] = useState<Shelter[]>([]),
    [status, setStatus] = useState('loading'),
    [error, setError] = useState(''),
    [selected, setSelected] = useState<Shelter | null>(null),
    [busy, setBusy] = useState('')
  const router = useRouter()
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/landing-pages/workspace', { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok)
          throw new Error(
            data.message ?? 'Sign in with your shelter management account.',
          )
        setRows(data.shelters)
        setStatus('ready')
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message)
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [])
  async function create(template: string) {
    if (!selected) return
    setBusy(template)
    setError('')
    try {
      const response = await fetch('/api/landing-pages/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shelterId: selected.id,
          template,
          document: landingDocument(template, selected),
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.message ?? 'The page could not be created.')
      router.push('/dashboard/pages/' + data.websiteId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 py-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-heading text-4xl font-bold">
            A home for your story.
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Give your shelter or organization a website of its own. Start with a
            design, make it yours in Pixelcore Studio, then publish when you’re
            ready.
          </p>
        </div>
        <ButtonLink href="/dashboard/shelter" variant="outline">
          Shelter workspace
        </ButtonLink>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {status === 'loading' ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border p-8"
        >
          <LoaderCircle className="size-5 motion-safe:animate-spin" />
          Finding your organizations…
        </div>
      ) : (
        <section
          aria-label="Your organization websites"
          className="grid gap-4 md:grid-cols-2"
        >
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex flex-col justify-between gap-6 rounded-xl border bg-card p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl font-bold">
                    {row.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.websiteId
                      ? row.published
                        ? 'Published website · draft changes stay private'
                        : 'Private draft · ready to make it yours'
                      : 'Your existing profile stays available.'}
                  </p>
                </div>
                <Globe className="size-6 shrink-0 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-2">
                {row.websiteId ? (
                  <ButtonLink href={'/dashboard/pages/' + row.websiteId}>
                    Open in Studio
                    <ArrowRight className="size-4" />
                  </ButtonLink>
                ) : (
                  <Button
                    onClick={() => {
                      setSelected(row)
                      setError('')
                    }}
                  >
                    <Plus className="size-4" />
                    Choose a template
                  </Button>
                )}
                {row.published && (
                  <ButtonLink href={'/sites/' + row.slug} variant="outline">
                    View website
                    <ExternalLink className="size-4" />
                  </ButtonLink>
                )}
                <ButtonLink href={'/shelters/' + row.slug} variant="ghost">
                  Profile
                </ButtonLink>
              </div>
            </article>
          ))}
        </section>
      )}
      {status === 'ready' && !rows.length && (
        <section className="rounded-xl border bg-card p-8 text-center">
          <img
            src="/images/illustrations/pet-companions.webp"
            alt=""
            className="mx-auto mb-5 w-48"
          />
          <h2 className="font-heading text-2xl font-bold">
            Your organization belongs here.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Websites are available to a shelter’s owner, assigned staff and
            administrators. Sign in with an assigned account to create one.
          </p>
        </section>
      )}
      <section>
        <h2 className="font-heading text-2xl font-bold">
          Three ways to tell your story.
        </h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Every design works on phones and can be edited in Studio.
        </p>
        <TemplateGallery onChoose={selected ? create : undefined} busy={busy} />
      </section>
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v && !busy) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl">
              A fresh start for {selected?.name}
            </DialogTitle>
            <DialogDescription>
              Choose the starting layout. Colors, photos, sections and wording
              can all be changed in Pixelcore Studio.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <TemplateGallery onChoose={create} busy={busy} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
export function TemplateGallery({
  onChoose,
  busy,
}: {
  onChoose?: (id: string) => void
  busy: string
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {landingTemplates.map((t) => (
        <article
          key={t.id}
          className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
        >
          <div className={'relative h-52 overflow-hidden p-5 ' + t.color}>
            <div className="mb-3 h-2 w-16 rounded-sm bg-stone-800/50" />
            <div
              className={
                t.layout === 'split'
                  ? 'grid grid-cols-2 items-center gap-3'
                  : 'space-y-3'
              }
            >
              {t.layout !== 'photo' && (
                <div>
                  <div className="h-3 w-24 max-w-full rounded-sm bg-stone-800/70" />
                  <div className="mt-2 h-3 w-16 rounded-sm bg-stone-800/70" />
                  <div className="mt-4 h-2 w-20 max-w-full bg-stone-800/20" />
                  <div className="mt-2 h-2 w-16 bg-stone-800/20" />
                </div>
              )}
              <img
                src="/images/illustrations/pet-companions.webp"
                alt=""
                className={
                  t.layout === 'photo'
                    ? 'h-24 w-full rounded-md object-cover'
                    : 'h-28 w-full object-contain'
                }
              />
              {t.layout === 'photo' && (
                <div className="h-3 w-32 bg-stone-800/70" />
              )}
            </div>
            <div className="mt-3 h-5 w-20 rounded-sm bg-stone-800/70" />
          </div>
          <div className="space-y-3 p-5">
            <h3 className="font-heading text-xl font-bold">{t.name}</h3>
            <p className="min-h-16 text-sm leading-relaxed text-muted-foreground">
              {t.description}
            </p>
            <ButtonLink
              href={'/websites/templates/' + t.id}
              variant="outline"
              className="w-full"
            >
              Preview design
            </ButtonLink>
            {onChoose && (
              <Button
                className="w-full"
                disabled={!!busy}
                onClick={() => onChoose(t.id)}
              >
                {busy === t.id ? (
                  <LoaderCircle className="size-4 motion-safe:animate-spin" />
                ) : (
                  <LayoutTemplate className="size-4" />
                )}
                {busy === t.id
                  ? 'Creating your draft…'
                  : 'Start with this design'}
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
