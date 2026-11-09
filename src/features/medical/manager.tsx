'use client'
import { useRef, useState } from 'react'
import { Archive, ArrowDown, ChevronDown, FileText, History, LockKeyhole, Plus, RotateCcw, Stethoscope, Syringe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { Badge } from '@/components/ui/badge'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { getBrowserApi } from '@/lib/api/client'
import { MedicalEditor } from './editor'
import { medicalDate } from './date'
import { medicalKindLabels, type MedicalPage, type MedicalRecord } from './schemas'

export function MedicalManager({ animal, initial }: { animal: { id: string; name: string }; initial: MedicalPage }) {
  const [page, setPage] = useState(initial)
  const [archive, setArchive] = useState<'active' | 'archived' | 'all'>('active')
  const [editor, setEditor] = useState<MedicalRecord | 'new' | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [stale, setStale] = useState(false)
  const requests = useRef(0)
  const archiveKeys = useRef(new Map<string, string>())
  async function load(nextArchive = archive, cursor?: string) {
    const serial = ++requests.current
    setPending(true)
    setError('')
    try {
      const result = await getBrowserApi().medical.list(animal.id, { scope: 'manage', archive: nextArchive, limit: 12, ...(cursor ? { cursor } : {}) })
      if (serial !== requests.current) return
      setPage((current) => cursor ? { ...result, items: [...current.items, ...result.items.filter((row) => !current.items.some((old) => old.id === row.id))] } : result)
      setStale(false)
    } catch (reason) { if (serial === requests.current) { setError(reason instanceof Error ? reason.message : 'Care history couldn’t load. Refresh to try again.'); setStale(true) } }
    finally { if (serial === requests.current) setPending(false) }
  }
  async function saved() {
    setEditor(null)
    setMessage('Care record saved. Refreshing history…')
    setStale(true)
    await load()
    setMessage('Care record saved.')
  }
  async function toggleArchive(record: MedicalRecord) {
    const key = `${record.id}:${record.version}:${record.archived}`
    if (!archiveKeys.current.has(key)) archiveKeys.current.set(key, crypto.randomUUID())
    try {
      await getBrowserApi().medical.update(animal.id, record.id, { expectedVersion: record.version, archived: !record.archived, changeReason: record.archived ? 'Restored to active care history' : 'Archived from active care history' }, { idempotencyKey: archiveKeys.current.get(key)! })
      if (editor !== 'new' && editor?.id === record.id) setEditor(null)
      setMessage(record.archived ? 'Record restored.' : 'Record archived. Correction history is retained.')
      setStale(true)
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The record couldn’t be updated. Refresh history before trying again.')
      throw reason
    }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-y py-4"><p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span><strong className="text-foreground">{page.summary.recordsCount}</strong> active records</span><span>{page.summary.performedCount} performed · {page.summary.plannedCount} planned</span></p><Button className="rounded-md" disabled={editor !== null || pending || stale} onClick={() => { setEditor('new'); setMessage('') }}><Plus aria-hidden="true" className="size-4" />Add care record</Button></div>
    <p className="flex max-w-prose items-start gap-2 text-xs leading-relaxed text-muted-foreground"><LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />This record book is private to authorized animal managers. Only deliberately shared summaries appear on the public profile.</p>
    {message && <p role="status" className="text-sm font-medium">{message}</p>}
    {error && <div role="alert" className="rounded-md border p-4 text-sm"><p>{error}</p><Button variant="outline" className="mt-3 rounded-md text-foreground" disabled={pending} onClick={() => void load()}>Refresh history</Button></div>}
    {editor && <MedicalEditor key={editor === 'new' ? 'new' : `${editor.id}:${editor.version}`} animal={animal} record={editor === 'new' ? null : editor} onSaved={() => void saved()} onCancel={() => setEditor(null)} />}
    <section aria-labelledby="medical-history-title" aria-busy={pending} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="medical-history-title" className="font-heading text-2xl font-bold">Care history</h2><div className="flex items-center gap-2"><label htmlFor="medical-archive" className="sr-only">Show records</label><NativeSelect id="medical-archive" value={archive} disabled={pending || editor !== null} onChange={(event) => { const next = event.target.value as typeof archive; setArchive(next); void load(next) }}><NativeSelectOption value="active">Active records</NativeSelectOption><NativeSelectOption value="archived">Archived records</NativeSelectOption><NativeSelectOption value="all">All records</NativeSelectOption></NativeSelect><Button variant="outline" size="icon" className="shrink-0 rounded-md text-foreground" disabled={pending || editor !== null} onClick={() => void load()} aria-label="Refresh care history"><RotateCcw aria-hidden="true" className="size-4" /></Button></div></div>
      {pending && <p role="status" className="text-sm text-muted-foreground">Loading care history…</p>}
      {!page.items.length && !pending && !stale ? <div className="flex items-start gap-4 rounded-lg bg-secondary/50 p-5 sm:p-7"><Stethoscope aria-hidden="true" className="mt-1 size-7 shrink-0 text-primary" /><div className="max-w-lg space-y-2"><h3 className="font-heading text-xl font-bold">{archive === 'archived' ? 'No archived care records' : 'Start a clear care history'}</h3><p className="text-sm leading-relaxed text-muted-foreground">{archive === 'archived' ? 'Records you archive will remain available here with their correction history.' : `No medical entries have been recorded for ${animal.name}. Add a planned appointment or care that was performed, using the information you have.`}</p><p className="text-xs text-muted-foreground">A missing record does not indicate vaccination or health status.</p></div></div> : <ol className="divide-y border-y">{page.items.map((record) => {
        const Icon = record.kind === 'vaccination' ? Syringe : Stethoscope
        const privateDetails = record.privateDetails
        return <li key={record.id} className="space-y-4 py-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary"><Icon aria-hidden="true" className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{medicalKindLabels[record.kind]} · {record.visibility === 'public' ? 'Summary shared publicly' : 'Private'}</p><h3 className="mt-1 break-words font-heading text-xl font-bold">{privateDetails?.title ?? record.title}</h3></div><Badge variant="secondary" className="rounded-md text-foreground">{record.archived ? 'Archived' : record.status === 'performed' ? 'Performed · reported' : 'Planned'}</Badge></div><p className="mt-3 text-sm text-muted-foreground">{record.status === 'performed' ? 'Performed' : 'Scheduled'}: {medicalDate(record.eventDate)}{record.followUpDate && <> · Follow-up: {medicalDate(record.followUpDate)}</>}</p>
          {privateDetails && <><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[['Vaccine / product', privateDetails.vaccineProduct], ['Dose / batch', [privateDetails.doseLabel, privateDetails.batchReference].filter(Boolean).join(' · ')], ['Care provider', privateDetails.providerName], ['Clinic', privateDetails.clinicName]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl>{privateDetails.notes && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{privateDetails.notes}</p>}{privateDetails.attachments.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{privateDetails.attachments.map((asset) => <li key={asset.id}><ButtonAnchor href={asset.url} variant="outline" className="max-w-full rounded-md text-foreground"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="max-w-52 truncate">{asset.alt || 'Private document'}</span></ButtonAnchor></li>)}</ul>}</>}
          {record.visibility === 'public' && <div className="mt-4 rounded-md bg-secondary/50 p-3"><p className="text-xs font-semibold">Public summary</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{record.publicSummary}</p></div>}
          <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" className="rounded-md text-foreground" disabled={editor !== null || stale || pending || record.archived} onClick={() => setEditor(record)}>Correct record</Button><ConfirmDialog title={record.archived ? 'Restore this care record?' : 'Archive this care record?'} description={record.archived ? 'Returns this record to active history. A previously shared summary will appear publicly again.' : 'Removes this record from active history and the public profile. Private documents and correction history are retained.'} confirmLabel={record.archived ? 'Restore record' : 'Archive record'} trigger={<Button variant="outline" className="rounded-md text-foreground" disabled={editor !== null || stale || pending}>{record.archived ? <RotateCcw aria-hidden="true" className="size-4" /> : <Archive aria-hidden="true" className="size-4" />}{record.archived ? 'Restore' : 'Archive'}</Button>} onConfirm={() => toggleArchive(record)} /></div>
          {privateDetails && <Collapsible className="mt-4"><CollapsibleTrigger asChild><Button variant="ghost" className="rounded-md px-0 text-foreground"><History aria-hidden="true" className="size-4" />Correction history<ChevronDown aria-hidden="true" className="size-4" /></Button></CollapsibleTrigger><CollapsibleContent><ol className="mt-2 space-y-3 border-t pt-4">{privateDetails.history.map((entry) => <li key={entry.version} className="text-xs"><p className="font-medium">Version {entry.version} · {entry.action} · {new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(entry.at))}</p><p className="mt-1 text-muted-foreground">{entry.reason}</p></li>)}</ol><p className="mt-3 text-xs text-muted-foreground">Showing up to 10 recent revisions. Earlier versions remain stored.</p></CollapsibleContent></Collapsible>}
        </div></div></li>
      })}</ol>}
      {page.nextCursor && <Button variant="outline" className="rounded-md text-foreground" disabled={pending || stale || editor !== null} onClick={() => void load(archive, page.nextCursor!)}><ArrowDown aria-hidden="true" className="size-4" />Load more care records</Button>}
    </section>
  </div>
}
