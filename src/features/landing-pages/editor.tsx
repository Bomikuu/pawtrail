'use client'
import './fonts'
import { useEffect, useRef, useState } from 'react'
import { WebsiteEditor } from '@sitebuilder/react'
import {
  createDjangoAdapter,
  type EditorInstance,
  type WorkspaceContext,
} from '@sitebuilder/editor'
import type { WebsiteDocument, ResolvedData } from '@sitebuilder/core'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { LoaderCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
type Payload = {
  id: string
  version: number
  document: WebsiteDocument
  data: ResolvedData
  publishedRevision: string | null
  capabilities: { features: string[]; workspace: WorkspaceContext }
}
async function request(
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {},
) {
  const body = options.body
  const multipart = body instanceof FormData
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    headers: {
      ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
  })
  const value = await response.json()
  if (!response.ok)
    throw Object.assign(
      new Error(
        value.error?.message ??
          value.message ??
          'Studio could not complete this action.',
      ),
      {
        code: value.error?.code ?? value.code,
        status: response.status,
        data: value,
      },
    )
  return value
}
export function LandingEditor({ id }: { id: string }) {
  const [payload, setPayload] = useState<Payload | null>(null),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0),
    [live, setLive] = useState(false)
  const instance = useRef<EditorInstance | null>(null),
    router = useRouter()
  useEffect(() => {
    let current = true
    setError('')
    request('/api/landing-pages/builder/sites/' + encodeURIComponent(id) + '/')
      .then((data) => {
        if (current) {
          setPayload(data)
          setLive(!!data.publishedRevision)
        }
      })
      .catch((e) => {
        if (current) setError(e.message)
      })
    return () => {
      current = false
    }
  }, [id, attempt])
  const [adapter, setAdapter] = useState<ReturnType<
    typeof createDjangoAdapter
  > | null>(null)
  useEffect(() => {
    if (!payload) return
    const next = createDjangoAdapter({
      websiteId: id,
      baseUrl: '/api/landing-pages/builder/',
      request,
      workspace: payload.capabilities.workspace,
      capabilities: payload.capabilities.features,
      exit: () => router.push('/dashboard/pages'),
    })
    const publish = next.publish
    if (publish)
      next.publish = async (...args) => {
        const result = await publish(...args)
        setLive(true)
        return result
      }
    setAdapter(next)
  }, [id, payload, router])
  async function unpublish() {
    setBusy(true)
    setError('')
    try {
      await instance.current?.save()
      await request('/api/landing-pages/unpublish/' + id, {
        method: 'POST',
        body: {
          expectedVersion: instance.current?.version ?? payload?.version,
        },
      })
      setConfirm(false)
      setAdapter(null)
      setPayload(null)
      setAttempt((v) => v + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <ButtonLink href="/dashboard/pages" variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
            Your pages
          </ButtonLink>
          <p className="font-heading text-xl font-bold">
            Pixelcore Studio{' '}
            <span className="text-muted-foreground">/ PawTrail</span>
          </p>
        </div>
        <div className="flex gap-2">
          {payload?.capabilities.workspace.publicUrl && live && (
            <ButtonLink
              href={payload.capabilities.workspace.publicUrl}
              variant="outline"
              size="sm"
            >
              View published page
            </ButtonLink>
          )}
          {live && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm(true)}
            >
              Unpublish
            </Button>
          )}
        </div>
      </header>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 border-b bg-destructive/5 px-5 py-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {payload && adapter ? (
          <WebsiteEditor
            document={payload.document}
            data={payload.data}
            version={payload.version}
            adapter={adapter}
            appearance="light"
            onReady={(editor) => {
              instance.current = editor
              editor.update({ exitLabel: 'Back to organization pages' })
            }}
            onError={(e) => setError(e.message)}
          />
        ) : (
          <div
            role="status"
            className="flex h-full items-center justify-center gap-3"
          >
            <LoaderCircle className="size-6 motion-safe:animate-spin" />
            Opening your private Studio workspace…
          </div>
        )}
      </div>
      <Dialog
        open={confirm}
        onOpenChange={(v) => {
          if (!busy) setConfirm(v)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish this website?</DialogTitle>
            <DialogDescription>
              Your draft and revision history will remain. The existing shelter
              profile stays available.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep published
            </Button>
            <Button disabled={busy} onClick={unpublish}>
              {busy ? 'Unpublishing…' : 'Unpublish website'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
