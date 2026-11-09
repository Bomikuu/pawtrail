'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Check, Circle, Download, LoaderCircle, PawPrint, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { captureRequest } from './api'
import { identificationPolicySchema, identificationSetupSchema } from './schemas'
import { useCaptureIdentity } from './workspace'

export function IdentificationSetup() {
  const { actor } = useCaptureIdentity()
  return actor.roles.includes('moderator') ? <ReviewerSetup actorId={actor.id} /> : <Card><CardContent className="space-y-3"><ShieldCheck className="size-9 text-primary" /><h1 className="text-2xl font-bold">Identification setup</h1><p className="max-w-prose text-muted-foreground">A real identity reviewer manages reference enrollment, calibration reports and automatic matching policies.</p><ButtonLink href="/spot">Return to camera</ButtonLink></CardContent></Card>
}

function ReviewerSetup({ actorId }: { actorId: string }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['capture', actorId, 'identification-setup'], queryFn: ({ signal }) => captureRequest('identity/setup', identificationSetupSchema, { signal }), retry: false })
  const [report, setReport] = useState<unknown>(null)
  const [filename, setFilename] = useState('')
  const [notes, setNotes] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  async function refresh() {
    await query.refetch()
    await client.invalidateQueries({ queryKey: ['capture', 'status'] })
  }
  async function importReport() {
    setPending(true); setError(''); setOutcome('')
    try {
      const result = await captureRequest('identity/calibrations', z.object({ reportId: z.string(), passed: z.boolean(), reasons: z.array(z.string()), policy: identificationPolicySchema }), {
        method: 'POST', body: { report, notes, acknowledgeRealData: acknowledged },
      })
      setOutcome(result.passed ? 'Report accepted. The policy is still disabled until you explicitly enable it below.' : 'Report recorded; automatic matching stays disabled. ' + result.reasons.join(' '))
      await refresh()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The report could not be imported.') }
    finally { setPending(false) }
  }
  async function activate(id: number, enabled: boolean) {
    setPending(true); setError(''); setOutcome('')
    try {
      await captureRequest('identity/policies/' + id + '/activation', identificationPolicySchema, { method: 'POST', body: { enabled } })
      setOutcome(enabled ? 'Automatic matching is enabled for the calibrated animal cohort. Uncertain cases still need review.' : 'Policy disabled. Future encounters return to suggestions and independent review.')
      await refresh()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The policy could not be changed.') }
    finally { setPending(false) }
  }
  function downloadManifest() {
    if (!query.data) return
    const cohort = query.data.animals.filter((row) => row.ready)
    const species = cohort[0]?.species ?? 'cat'
    const data = { species, knownAnimalIds: cohort.filter((row) => row.species === species).map((row) => row.animalId), observations: [] }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'pawtrail-calibration-manifest.json'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  if (query.isPending) return <div className="space-y-4" aria-label="Loading identification setup" aria-busy="true"><Skeleton className="h-9 w-72" /><Skeleton className="h-60 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
  if (query.error || !query.data) return <div role="alert" className="space-y-3"><p>{query.error?.message ?? 'Identification setup could not load.'}</p><Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Reconnect</Button></div>
  const data = query.data
  const steps = [
    { label: 'Local models installed', complete: !!data.modelVersion, detail: data.modelVersion ?? 'Model files are not installed.' },
    { label: 'Real identities independently confirmed', complete: data.confirmedAnimals > 0, detail: data.confirmedAnimals + ' confirmed animals · ' + data.reviewedEncounters + ' accepted reviewed encounters' },
    { label: 'Reference views ready', complete: data.qualifiedAnimals > 0, detail: data.qualifiedAnimals + ' animals have three reference photos across two viewpoints' },
    { label: 'Eligible calibration report', complete: data.policies.some((policy) => !policy.blockers.length), detail: data.calibrationReports ? 'Imported reports are evaluated against model, data and reference requirements.' : 'No calibration report yet. Collect real labeled encounters first.' },
    { label: 'Automatic policy enabled', complete: data.activePolicies > 0, detail: data.activePolicies ? 'Only calibrated identities and qualifying evidence can be accepted automatically.' : 'Suggestions and independent review remain available.' },
  ]
  return <section aria-label="Identification setup" className="mx-auto max-w-[900px] space-y-7">
    <header className="space-y-2"><h1 className="text-3xl font-bold">Build trust, one familiar face at a time.</h1><p className="max-w-prose text-muted-foreground">Prepare real references, measure the matching policy, then enable automatic identification for the animals it covers.</p></header>
    <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="identity-readiness"><h2 id="identity-readiness" className="mb-4 text-xl font-bold">Identification readiness</h2><ol className="divide-y">{steps.map((step) => <li key={step.label} className="flex gap-3 py-4">{step.complete ? <Check className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-400" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}<div className="min-w-0"><h3 className="font-semibold">{step.label}</h3><p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">{step.detail}</p></div></li>)}</ol><div className="mt-3 flex flex-wrap gap-2"><ButtonLink href="/spot/review" variant="outline">Review real encounters</ButtonLink><Button variant="ghost" disabled={query.isFetching} onClick={() => void refresh()}><RefreshCw className="size-4" />Refresh readiness</Button></div></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Reference coverage</h2>{!data.animals.length ? <div className="rounded-xl border border-dashed p-6 text-center"><PawPrint className="mx-auto mb-3 size-9 text-primary" /><h3 className="font-semibold">Your real reference gallery is ready to grow.</h3><p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">Submit actual animal encounters, confirm them independently, and enroll approved face, side and body views. Sample and game pictures are not reference evidence.</p></div> : <ul className="divide-y rounded-xl border bg-card">{data.animals.map((animal) => <li key={animal.animalId} className="flex flex-wrap items-center gap-3 p-4">{animal.photo ? <img src={animal.photo.url} alt={animal.photo.alt} className="size-12 rounded-full object-cover" /> : <PawPrint className="size-9 text-primary" />}<div className="min-w-0 flex-1"><ButtonLink href={'/spot/animals/' + animal.animalId} variant="link" className="h-auto px-0 font-semibold">{animal.name}</ButtonLink><p className="text-xs text-muted-foreground">{animal.referenceCount} photos · {animal.viewpoints.join(', ')}</p></div><Badge variant={animal.ready ? 'default' : 'secondary'}>{animal.ready ? 'Ready for calibration data' : 'More views needed'}</Badge></li>)}</ul>}</section>
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6"><h2 className="text-xl font-bold">Prepare and import calibration</h2><p className="max-w-prose text-sm leading-relaxed text-muted-foreground">The backend can prepare a report from independently reviewed observations with separate tuning and validation sessions. Unknown animals must stay outside the reference gallery. Download a manifest, add real observation IDs and splits, then use the documented backend command.</p><Button variant="outline" disabled={!data.qualifiedAnimals || pending} onClick={downloadManifest}><Download className="size-4" />Download cohort manifest</Button><p className="text-xs leading-relaxed text-muted-foreground">The pilot gate requires a one-sided {Math.round(data.requirements.confidence * 100)}% confidence upper bound of at most {data.requirements.maximumWrongMatchRate * 100}% wrong accepted identities, plus unknown-animal cases and useful coverage. This is a release target, not a current accuracy claim.</p>
      <label htmlFor="calibration-report" className="grid gap-2 text-sm font-medium">Calibration report JSON<Input id="calibration-report" type="file" accept="application/json,.json" disabled={pending} onChange={async (event) => {
        const file = event.currentTarget.files?.[0]; setReport(null); setFilename(''); setError(''); setOutcome('')
        if (!file) return
        if (file.size > 256 * 1024) { setError('Choose a calibration report up to 256 KiB.'); return }
        try { setReport(JSON.parse(await file.text())); setFilename(file.name) } catch { setError('This file is not valid JSON. Choose the generated calibration report.') }
      }} /></label>{filename && <p className="text-xs text-muted-foreground">Selected: {filename}</p>}
      <label htmlFor="calibration-notes" className="grid gap-2 text-sm font-medium">Report source and covered conditions<Textarea id="calibration-notes" minLength={10} maxLength={3000} value={notes} disabled={pending} placeholder="Describe the real dataset, lighting/area conditions and how identities were independently established." onChange={(event) => setNotes(event.target.value)} /></label>
      <label className="flex items-start gap-3 text-sm leading-relaxed"><Checkbox checked={acknowledged} disabled={pending} onCheckedChange={(value) => setAcknowledged(value === true)} /><span>I confirm this report comes from genuine independently labeled encounters, with no sample photos or reference/query leakage.</span></label><Button disabled={!report || !acknowledged || notes.trim().length < 10 || pending} onClick={() => void importReport()}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="size-4" />}Import report with policy disabled</Button>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Automatic policies</h2>{!data.policies.length && <p className="rounded-xl border p-5 text-sm text-muted-foreground">No policies yet. Import a genuine calibration report to prepare one. There is no seeded accuracy result or enabled default.</p>}{data.policies.map((policy) => <div key={policy.id} className="space-y-3 rounded-xl border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold capitalize">{policy.species} · {policy.version}</h3><Badge variant={policy.effective ? 'default' : 'secondary'}>{policy.effective ? 'Active' : policy.enabled ? 'Paused by requirements' : 'Disabled'}</Badge></div><p className="text-sm text-muted-foreground">Evaluated operating thresholds: similarity {policy.minimumSimilarity.toFixed(3)} · competitor margin {policy.minimumMargin.toFixed(3)}. These scores are not identity probabilities.</p>{policy.coverage !== null && <p className="text-xs text-muted-foreground">Validation automatic coverage {(policy.coverage * 100).toFixed(1)}% · wrong-match upper bound {((policy.wrongMatchUpperBound ?? 1) * 100).toFixed(3)}%</p>}{policy.blockers.map((blocker) => <p key={blocker} className="text-sm text-muted-foreground">{blocker}</p>)}<Button variant={policy.enabled ? 'outline' : 'default'} disabled={pending || (!policy.enabled && policy.blockers.length > 0)} onClick={() => void activate(policy.id, !policy.enabled)}>{policy.enabled ? 'Disable automatic matching' : 'Enable calibrated cohort'}</Button></div>)}</section>
    {error && <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}{outcome && <p role="status" className="rounded-lg bg-accent p-4 text-sm leading-relaxed">{outcome}</p>}
  </section>
}
