'use client'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ArrowRight, CheckCircle2, LoaderCircle, MapPin, PawPrint, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { captureRequest } from './api'
import { analysisSchema, receiptSchema, observationSchema, type AnalysisResult, type CaptureLocation, type Crop, type ObservationReceipt } from './schemas'
import { useCaptureIdentity } from './workspace'
import { CameraPanel } from './camera-panel'
import { LocationStep } from './location-step'
import { AnalysisProgress } from './analysis-progress'
import { MatchCandidates } from './match-candidates'
import { AnimalSearch } from './animal-search'
import { RewardOutcome } from './reward-outcome'

const reasonText: Record<string, string> = {
  no_usable_cat_or_dog: 'We could not find a clear cat or dog. Try a closer photo with the animal in view.',
  photo_too_dark: 'The animal is too dark to compare. Try a brighter view without disturbing them.',
  photo_lacks_detail: 'The photo does not show enough detail. Hold the camera steady and try again.',
  animal_too_small: 'The animal appears too small to compare. A closer photo may help.',
  selected_crop_not_animal: 'That selection does not match a detected animal. Choose one of the detected animals or retake the photo.',
  recognition_models_unavailable: 'The server’s recognition models are unavailable. Your photo is saved; retry after they are installed.',
  analysis_failed_retry_available: 'Photo analysis stopped unexpectedly. Your photo is saved; try checking it again.',
  worker_retry_limit: 'Analysis could not finish after several attempts. Your photo is saved in My encounters.',
}
function message(reason: unknown) { return reason instanceof Error ? reason.message : 'Something interrupted this step. Your selected photo is still here.' }

export function CaptureFlow({ requestedAnimal, observationId }: { requestedAnimal?: string; observationId?: string }) {
  const { actor, status } = useCaptureIdentity()
  const client = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [remotePreview, setRemotePreview] = useState<string | null>(null)
  const [source, setSource] = useState<'browser_camera' | 'gallery'>('browser_camera')
  const [capturedAt, setCapturedAt] = useState<string | null>(null)
  const [galleryTime, setGalleryTime] = useState('')
  const [location, setLocation] = useState<CaptureLocation | null>(null)
  const [areaLabel, setAreaLabel] = useState('')
  const [description, setDescription] = useState('')
  const [cloudConsent, setCloudConsent] = useState(false)
  const [observation, setObservation] = useState<ObservationReceipt | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [manualName, setManualName] = useState('')
  const [registerNew, setRegisterNew] = useState(false)
  const [allowAutomatic, setAllowAutomatic] = useState(true)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [pollTick, setPollTick] = useState(0)
  const requestKey = useRef('')
  const uploadKey = useRef('')
  const submitKey = useRef('')
  const uploaded = useRef<string | null>(null)
  const captureId = useRef<string | null>(null)
  const draftKey = 'pawtrail-capture-draft-' + actor.id
  const checking = analysis?.status === 'queued' || analysis?.status === 'running'
  const finished = !!observation?.submittedAt

  useEffect(() => {
    try { setResumeId(localStorage.getItem(draftKey)) } catch { /* Private browsing can disable storage. */ }
  }, [draftKey])
  useEffect(() => {
    if (observationId && /^[a-f0-9-]{36}$/.test(observationId)) void resume(observationId)
  }, [observationId])
  useEffect(() => {
    if (!file) { setLocalPreview(null); return }
    const url = URL.createObjectURL(file)
    setLocalPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(() => {
    if (!observation || !checking) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    let attempts = 0
    async function poll() {
      try {
        const result = await captureRequest('observations/' + observation!.observationId + '/analysis', analysisSchema, { signal: controller.signal })
        if (controller.signal.aborted) return
        setAnalysis(result)
        if (result.status === 'complete') {
          if (requestedAnimal && result.candidates.some((row) => row.animalId === requestedAnimal)) setSelected(requestedAnimal)
          else if (result.automaticAnimalId) setSelected(result.automaticAnimalId)
          return
        }
        if (result.status === 'queued' || result.status === 'running') timer = setTimeout(() => void poll(), Math.min(5000, 1500 + attempts++ * 250))
      } catch (reason) {
        if (!controller.signal.aborted) setError(message(reason))
      }
    }
    timer = setTimeout(() => void poll(), 1000)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [observation?.observationId, observation?.version, checking, pollTick, requestedAnimal])

  function reset() {
    setFile(null); setRemotePreview(null); setObservation(null); setAnalysis(null); setSelected(null); setRegisterNew(false); setAllowAutomatic(true)
    setName(''); setNotes(''); setDescription(''); setError(''); setManualName(''); setResumeId(null); setLocation(null); setCapturedAt(null); setGalleryTime('')
    requestKey.current = ''; uploadKey.current = ''; submitKey.current = ''; uploaded.current = null; captureId.current = null
    try { localStorage.removeItem(draftKey) } catch { /* Optional recovery only. */ }
  }
  async function resume(id: string) {
    setPending(true); setError('')
    try {
      const data = await captureRequest('observations/' + id, observationSchema)
      setObservation(data); setRemotePreview(data.photoUrl); setAnalysis(data.analysis); setResumeId(null)
      setSelected(data.proposedAnimalId); setNotes(data.notes); setSource(data.source === 'gallery' ? 'gallery' : 'browser_camera')
    } catch (reason) { setError(message(reason)) }
    finally { setPending(false) }
  }
  async function analyzePhoto() {
    if (!file) return
    setPending(true); setUploading(true); setError('')
    try {
      requestKey.current ||= crypto.randomUUID()
      uploadKey.current ||= crypto.randomUUID()
      if (!uploaded.current) {
        const form = new FormData()
        form.set('file', file); form.set('alt', description.trim() || 'Cat or dog photographed for an animal encounter')
        const asset = await captureRequest('media', z.object({ id: z.string() }), { method: 'POST', body: form, key: uploadKey.current })
        uploaded.current = asset.id
      }
      if (!captureId.current) {
        const date = source === 'gallery' && galleryTime ? new Date(galleryTime).toISOString() : capturedAt
        const data = await captureRequest('captures', z.object({ captureId: z.string() }), { method: 'POST', key: requestKey.current, body: { mediaId: uploaded.current, source, capturedAt: date, location, areaLabel, cloudConsent } })
        captureId.current = data.captureId
      }
      const record = observation ?? await captureRequest('captures/' + captureId.current + '/observations', receiptSchema, { method: 'POST', body: {} })
      setObservation(record)
      try { localStorage.setItem(draftKey, record.observationId) } catch { /* Server record remains durable. */ }
      const result = await captureRequest('observations/' + record.observationId + '/analysis', analysisSchema, { method: 'POST', body: { version: record.version } })
      setAnalysis(result)
    } catch (reason) { setError(message(reason)) }
    finally { setPending(false); setUploading(false) }
  }
  async function reanalyze(crop: Crop | null = null) {
    if (!observation) return
    setPending(true); setError('')
    try {
      const record = await captureRequest('observations/' + observation.observationId + '/selection', receiptSchema, { method: 'POST', body: { version: observation.version, crop } })
      setObservation(record); setSelected(null); submitKey.current = ''
      const result = await captureRequest('observations/' + record.observationId + '/analysis', analysisSchema, { method: 'POST', body: { version: record.version } })
      setAnalysis(result)
    } catch (reason) { setError(message(reason)) }
    finally { setPending(false) }
  }
  async function startSavedAnalysis() {
    if (!observation) return
    setPending(true); setError('')
    try {
      const result = await captureRequest('observations/' + observation.observationId + '/analysis', analysisSchema, { method: 'POST', body: { version: observation.version } })
      setAnalysis(result)
    } catch (reason) { setError(message(reason)) }
    finally { setPending(false) }
  }
  async function submit() {
    if (!observation) return
    setPending(true); setError('')
    try {
      submitKey.current ||= crypto.randomUUID()
      const result = await captureRequest('observations/' + observation.observationId + '/submit', receiptSchema, { method: 'POST', key: submitKey.current, body: {
        observationVersion: observation.version, proposedAnimalId: registerNew ? null : selected, registerNew, allowAutomaticMatch: allowAutomatic && !registerNew,
        name: registerNew ? name : '', description: registerNew ? description : '', notes,
      } })
      setObservation(result)
      void client.invalidateQueries({ queryKey: ['capture', actor.id] })
      try { localStorage.removeItem(draftKey) } catch { /* No evidence is stored in browser storage. */ }
    } catch (reason) { setError(message(reason)) }
    finally { setPending(false) }
  }
  return <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,800px)_260px]">
    <section aria-label="Record an animal encounter" className="min-w-0 space-y-6">
      <header className="space-y-2"><h1 className="text-3xl font-bold leading-tight">Every encounter can help.</h1><p className="max-w-prose text-muted-foreground">A photo can reconnect a familiar animal’s story—or begin a new one.</p></header>
      {resumeId && !observation && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm"><span>You have a saved encounter to finish.</span><Button variant="outline" disabled={pending} onClick={() => void resume(resumeId)}>Resume encounter</Button></div>}
      {finished ? <Card><CardContent className="space-y-4"><CheckCircle2 className="size-10 text-emerald-700 dark:text-emerald-400" /><h2 className="text-2xl font-bold">{observation.publicationState === 'published' ? 'A helpful sighting, recorded.' : 'Your encounter is saved.'}</h2><p className="max-w-prose text-muted-foreground">{observation.method === 'automatic' && observation.publicationState === 'published' ? 'The approved matching policy confirmed the identity and accepted the encounter evidence.' : observation.publicationState === 'published' ? 'An independent reviewer confirmed the animal and accepted this encounter.' : observation.identityState === 'confirmed' ? 'The animal identity is confirmed; the encounter evidence still needs attention before publication.' : registerNew || observation.animalId ? 'The animal record is provisional until an independent reviewer checks the identity and encounter.' : 'An independent reviewer can help confirm which animal you met. Your photo has not been treated as proof of an identity.'}</p><div className="flex flex-wrap gap-2"><Badge variant="secondary">{observation.identityState === 'confirmed' ? 'Identity confirmed' : 'Identity awaiting review'}</Badge><Badge variant="outline">{observation.publicationState === 'published' ? 'Published sighting' : 'Not published yet'}</Badge></div><RewardOutcome receipt={observation} /><div className="flex flex-wrap gap-2">{observation.animalId && <ButtonLink href={'/spot/animals/' + observation.animalId} variant="outline">View animal record</ButtonLink>}<Button onClick={reset}><CameraIcon />Spot another animal</Button><ButtonLink href="/spot/history" variant="ghost">My encounters</ButtonLink></div></CardContent></Card>
      : <>
        <CameraPanel preview={localPreview ?? remotePreview} disabled={pending || !!observation} onRetake={reset} onPhoto={(next, method, time) => {
          reset(); setFile(next); setSource(method); setCapturedAt(time); setGalleryTime(''); setLocation(null)
        }} />
        {!observation && file && <Card><CardContent className="space-y-5">
          <label htmlFor="capture-description" className="grid gap-2 text-sm font-medium">What can you see?<Textarea id="capture-description" maxLength={3000} placeholder="For example: gray cat with a white chin and a notch on the left ear." value={description} onChange={(event) => setDescription(event.target.value)} disabled={pending} /></label>
          {source === 'gallery' && <label htmlFor="capture-time" className="grid gap-2 text-sm font-medium">When was it taken? <span className="font-normal text-muted-foreground">Optional—leave blank if unknown.</span><Input id="capture-time" type="datetime-local" value={galleryTime} onChange={(event) => setGalleryTime(event.target.value)} disabled={pending} /></label>}
          <LocationStep value={location} onChange={setLocation} gallery={source === 'gallery'} disabled={pending} />
          <label htmlFor="capture-area" className="grid gap-2 text-sm font-medium">Neighborhood or area <span className="font-normal text-muted-foreground">Optional; avoid home addresses.</span><Input id="capture-area" maxLength={120} placeholder="For example: Riverside neighborhood" value={areaLabel} onChange={(event) => setAreaLabel(event.target.value)} disabled={pending} /></label>
          {status.externalComparisonAvailable && <label className="flex items-start gap-3 text-sm"><Checkbox checked={cloudConsent} disabled={pending} onCheckedChange={(value) => setCloudConsent(value === true)} /><span>Allow an additional external AI comparison if local matching is uncertain. Animal photos, without location metadata, may be sent to the configured provider.</span></label>}
          <Button disabled={pending} onClick={() => void analyzePhoto()}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ArrowRight className="size-4" />}{pending ? 'Saving photo…' : 'Check photo & find matches'}</Button>
        </CardContent></Card>}
        {(uploading || checking) && <AnalysisProgress stage={uploading ? 'uploading' : analysis?.stage ?? 'queued'} />}
        {observation && !analysis && !uploading && <Button disabled={pending} onClick={() => void startSavedAnalysis()}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="size-4" />}Check saved photo</Button>}
        {checking && <p className="text-sm text-muted-foreground">Your photo is saved. You can return through <ButtonLink href="/spot/history" variant="link" className="h-auto px-0">My encounters</ButtonLink> if processing takes a little longer.</p>}
        {analysis?.status === 'selection_required' && <section className="space-y-4"><h2 className="text-xl font-bold">Which animal did you meet?</h2><p className="text-sm text-muted-foreground">We found more than one animal. Choose the one this observation is about.</p><div className="grid grid-cols-2 gap-3">{analysis.detections.map((detected, index) => <Button key={detected.id} variant="outline" disabled={pending} className="h-auto flex-col gap-3 p-3" onClick={() => void reanalyze(detected.crop)}><div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted"><img src={localPreview ?? remotePreview ?? ''} alt={'Detected ' + detected.species + ' ' + (index + 1)} className="absolute max-w-none" style={{ width: (100 / detected.crop.width) + '%', height: (100 / detected.crop.height) + '%', left: (-detected.crop.x / detected.crop.width * 100) + '%', top: (-detected.crop.y / detected.crop.height * 100) + '%' }} /></div>Select {detected.species} {index + 1}</Button>)}</div></section>}
        {analysis && ['needs_retake', 'unavailable', 'failed'].includes(analysis.status) && <Card><CardContent className="space-y-3"><h2 className="text-xl font-bold">{analysis.status === 'needs_retake' ? 'A clearer photo would help' : 'Your photo is saved; analysis needs attention'}</h2>{analysis.reasons.map((reason) => <p key={reason} className="text-sm text-muted-foreground">{reasonText[reason] ?? 'This photo needs another look before it can be compared.'}</p>)}<div className="flex flex-wrap gap-2"><Button onClick={reset} variant="outline">Choose another photo</Button>{analysis.status !== 'needs_retake' && <Button onClick={() => void reanalyze()} disabled={pending}><RefreshCw className="size-4" />Retry analysis</Button>}</div></CardContent></Card>}
        {analysis?.status === 'complete' && <div className="space-y-6">
          <MatchCandidates candidates={analysis.candidates} selected={selected} onSelect={(id) => { setSelected(id); setAllowAutomatic(id !== null && id === analysis.automaticAnimalId); setManualName(''); setRegisterNew(false); submitKey.current = '' }} automaticId={analysis.automaticAnimalId} disabled={pending} />
          <AnimalSearch disabled={pending} onSelect={(id, label) => { setSelected(id); setAllowAutomatic(false); setManualName(label); setRegisterNew(false); submitKey.current = '' }} />
          {manualName && <p className="text-sm">Proposed identity: <strong>{manualName}</strong>. A reviewer will compare the evidence.</p>}
          {!selected && <div className="space-y-3"><label className="flex items-center gap-3 text-sm font-medium"><Checkbox checked={registerNew} disabled={pending} onCheckedChange={(value) => { setRegisterNew(value === true); submitKey.current = '' }} />Start a provisional animal profile</label>{registerNew && <label className="grid gap-2 text-sm" htmlFor="capture-animal-name">Name or temporary nickname<Input id="capture-animal-name" maxLength={100} placeholder="For example: Smokey, or Riverside gray cat" value={name} disabled={pending} onChange={(event) => { setName(event.target.value); submitKey.current = '' }} /></label>}<p className="text-xs text-muted-foreground">No match does not necessarily mean a new animal. Leaving the identity open is also helpful.</p></div>}
          <label className="grid gap-2 text-sm font-medium" htmlFor="capture-notes">Add a useful observation<Textarea id="capture-notes" maxLength={3000} placeholder="What were they doing? Is there a detail that helps distinguish them?" value={notes} disabled={pending} onChange={(event) => { setNotes(event.target.value); submitKey.current = '' }} /></label>
          {analysis.evidenceFlags.length > 0 && <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">Some encounter evidence needs review, such as photo freshness, capture location, or similarity to an earlier photo. This does not mean your report is false.</p>}
          {analysis.cloudResult && <p className="text-sm leading-relaxed text-muted-foreground">Additional comparison: {analysis.cloudResult.observations}</p>}
          <div className="flex flex-wrap gap-2"><Button disabled={pending} onClick={() => void submit()}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="size-4" />}{pending ? 'Saving encounter…' : 'Submit encounter'}</Button><Button variant="ghost" disabled={pending} onClick={() => void reanalyze()}>Refresh matches</Button></div>
        </div>}
      </>}
      {error && <div role="alert" className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm"><p>{error}</p>{checking && <Button variant="outline" onClick={() => { setError(''); setPollTick((tick) => tick + 1) }}>Reconnect to analysis</Button>}</div>}
    </section>
    <aside className="space-y-5 text-sm xl:sticky xl:top-24"><div className="rounded-xl border bg-card p-5"><PawPrint className="mb-3 size-7 text-primary" /><h2 className="font-bold">A photo, not a guess.</h2><p className="mt-2 leading-relaxed text-muted-foreground">Markings and reference photos help identify an animal. A nearby location supports the comparison; it cannot prove who they are.</p></div><div className="space-y-3 px-1"><h2 className="flex items-center gap-2 font-semibold"><MapPin className="size-4" />Reported areas, not live tracking</h2><p className="leading-relaxed text-muted-foreground">Public records show approximate historical areas. Exact coordinates and original photo metadata are private.</p></div>{!status.modelsInstalled && <p className="rounded-lg bg-muted p-4 text-muted-foreground">Recognition models are not installed yet. Uploaded photos remain private and saved.</p>}</aside>
  </div>
}
function CameraIcon() { return <PawPrint className="size-4" /> }
