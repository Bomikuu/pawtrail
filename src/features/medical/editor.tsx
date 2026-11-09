'use client'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { LockKeyhole, Save, Syringe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
import { getBrowserApi } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import { medicalKindLabels, type MedicalInput, type MedicalKind, type MedicalRecord } from './schemas'

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return <div className="grid min-w-0 content-start gap-2 [&>[data-slot=native-select-wrapper]]:w-full"><label htmlFor={id} className="text-sm font-semibold">{label}</label>{children}{hint && <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}</div>
}
export function MedicalEditor({ animal, record, onSaved, onCancel }: { animal: { id: string; name: string }; record: MedicalRecord | null; onSaved(record: MedicalRecord): void; onCancel(): void }) {
  const details = record?.privateDetails
  const [kind, setKind] = useState<MedicalKind>(record?.kind ?? 'vaccination')
  const [status, setStatus] = useState<'planned' | 'performed'>(record?.status ?? 'planned')
  const [shared, setShared] = useState(record?.visibility === 'public')
  const [attachments, setAttachments] = useState<MediaAsset[]>(details?.attachments ?? [])
  const [ready, setReady] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const busy = useRef(false)
  const retry = useRef<{ body: string; key: string } | null>(null)
  const uploadApi = useMemo(() => {
    const api = getBrowserApi().media
    const retained = new Set(details?.attachments.map((asset) => asset.id))
    return { ...api, upload: ((input, options) => api.upload({ ...input, purpose: 'private_evidence', sensitive: true }, options)) as typeof api.upload,
      remove: ((id, options) => retained.has(id) ? Promise.resolve() : api.remove(id, options)) as typeof api.remove }
  }, [details])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || !ready || conflict) return
    const form = new FormData(event.currentTarget)
    const text = (key: string) => String(form.get(key) ?? '').trim()
    const payload: MedicalInput = {
      kind, status, title: text('title'), eventDate: text('eventDate') || null, followUpDate: text('followUpDate') || null,
      vaccineProduct: text('vaccineProduct'), doseLabel: text('doseLabel'), batchReference: text('batchReference'),
      providerName: text('providerName'), clinicName: text('clinicName'), notes: text('notes'),
      visibility: shared ? 'public' : 'private', publicSummary: text('publicSummary'), mediaIds: attachments.map((asset) => asset.id),
    }
    const input = record ? { ...payload, expectedVersion: record.version, changeReason: text('changeReason') } : payload
    const body = JSON.stringify(input)
    if (retry.current?.body !== body) retry.current = { body, key: crypto.randomUUID() }
    busy.current = true
    setPending(true)
    setError('')
    try {
      const api = getBrowserApi().medical
      const options = { idempotencyKey: retry.current!.key }
      const result = record ? await api.update(animal.id, record.id, { ...payload, expectedVersion: record.version, changeReason: text('changeReason') }, options) : await api.create(animal.id, payload, options)
      onSaved(result)
    } catch (reason) {
      const stale = reason instanceof ApiError && reason.status === 409
      setConflict(stale)
      setError(stale ? 'This record changed in another session. Your draft is still here. Copy any changes you need, close the editor, refresh history and reopen the latest record.' : reason instanceof Error ? reason.message : 'The record couldn’t be saved. Your draft is still here; try again.')
    } finally { busy.current = false; setPending(false) }
  }
  return <section aria-labelledby="medical-editor-title" className="rounded-xl border bg-card p-5 sm:p-7">
    <header className="mb-6 flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Syringe aria-hidden="true" className="size-5" /></span><div><h2 id="medical-editor-title" className="font-heading text-2xl font-bold">{record ? 'Correct care record' : `Add care for ${animal.name}`}</h2><p className="mt-1 text-sm text-muted-foreground">Enter what was recorded. Leave unknown details blank.</p></div></header>
    <form onSubmit={(event) => void save(event)} aria-busy={pending} className="space-y-7">
      <fieldset disabled={pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <legend className="sr-only">Care details</legend>
        <Field id="medical-kind" label="Record type"><NativeSelect id="medical-kind" value={kind} onChange={(event) => setKind(event.target.value as MedicalKind)} className="w-full">{Object.entries(medicalKindLabels).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></Field>
        <Field id="medical-status" label="Care status" hint="Planned care is not a completed vaccination or treatment."><NativeSelect id="medical-status" aria-describedby="medical-status-hint" value={status} onChange={(event) => setStatus(event.target.value as 'planned' | 'performed')} className="w-full"><NativeSelectOption value="planned">Planned</NativeSelectOption><NativeSelectOption value="performed">Performed — recorded by care team</NativeSelectOption></NativeSelect></Field>
        <div className="sm:col-span-2"><Field id="medical-title" label="Record name (private) *"><Input id="medical-title" name="title" required maxLength={160} defaultValue={details?.title ?? ''} placeholder="e.g. Vaccination appointment" /></Field></div>
        <Field id="medical-date" label={status === 'performed' ? 'Date performed *' : 'Scheduled date'}><Input id="medical-date" type="date" name="eventDate" required={status === 'performed'} defaultValue={record?.eventDate ?? ''} /></Field>
        <Field id="medical-follow-up" label="Follow-up date" hint="Use the date given by the care provider, if any."><Input id="medical-follow-up" name="followUpDate" type="date" defaultValue={record?.followUpDate ?? ''} aria-describedby="medical-follow-up-hint" /></Field>
        {kind === 'vaccination' && <><div className="sm:col-span-2"><Field id="medical-product" label="Vaccine / product (private)"><Input id="medical-product" name="vaccineProduct" maxLength={160} defaultValue={details?.vaccineProduct ?? ''} /></Field></div><Field id="medical-dose" label="Dose label (private)"><Input id="medical-dose" name="doseLabel" maxLength={80} defaultValue={details?.doseLabel ?? ''} /></Field><Field id="medical-batch" label="Batch reference (private)"><Input id="medical-batch" name="batchReference" maxLength={100} defaultValue={details?.batchReference ?? ''} /></Field></>}
        <Field id="medical-provider" label="Care provider (private)"><Input id="medical-provider" name="providerName" maxLength={160} defaultValue={details?.providerName ?? ''} /></Field>
        <Field id="medical-clinic" label="Clinic / organization (private)"><Input id="medical-clinic" name="clinicName" maxLength={160} defaultValue={details?.clinicName ?? ''} /></Field>
        <div className="sm:col-span-2"><Field id="medical-notes" label="Care notes (private)"><Textarea id="medical-notes" name="notes" maxLength={5000} rows={4} defaultValue={details?.notes ?? ''} placeholder="Record instructions or observations supplied by the care team." /></Field></div>
      </fieldset>
      <section className="space-y-4 border-t pt-5"><div className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole aria-hidden="true" className="size-4" />Private documents</div><p className="max-w-prose text-xs leading-relaxed text-muted-foreground">For the uploader and authorized animal managers. Uploads do not establish veterinary verification. Saved documents remain in the correction history when removed from an entry.</p><UploadField value={attachments} onChange={setAttachments} api={uploadApi} purpose="private_evidence" privateHelp="Private images and PDFs are available to the uploader and authorized animal managers." disabled={pending} onReadyChange={setReady} /></section>
      <section className="space-y-4 border-t pt-5"><label htmlFor="medical-share" className="flex cursor-pointer items-start gap-3 text-sm font-semibold"><Checkbox id="medical-share" checked={shared} disabled={pending} onCheckedChange={(value) => setShared(value === true)} /><span>Share a summary on {animal.name}’s public profile<span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">Shares the care type, status, dates and summary below. Private fields and documents stay private.</span></span></label>{shared && <Field id="medical-summary" label="Public summary *"><Textarea id="medical-summary" name="publicSummary" required maxLength={500} rows={3} disabled={pending} defaultValue={record?.publicSummary ?? ''} placeholder="Write only the information you intend to share publicly." /></Field>}</section>
      {record && <Field id="medical-reason" label="Reason for correction *"><Input id="medical-reason" name="changeReason" required maxLength={300} disabled={pending} placeholder="Explain what changed and why." /></Field>}
      {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm leading-relaxed text-foreground">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 border-t pt-5"><Button type="submit" disabled={pending || !ready || conflict} className="rounded-md"><Save aria-hidden="true" className="size-4" />{pending ? 'Saving record…' : record ? 'Save correction' : 'Save care record'}</Button><Button type="button" variant="outline" className="rounded-md text-foreground" disabled={pending} onClick={onCancel}>Close editor</Button>{!ready && <p role="status" className="text-xs text-muted-foreground">Upload or remove selected files before saving.</p>}</div>
    </form>
  </section>
}
