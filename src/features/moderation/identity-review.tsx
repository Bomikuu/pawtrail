'use client'
import { useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { captureRequest } from '@/features/capture/api'
import { observationListSchema, observationSchema, receiptSchema } from '@/features/capture/schemas'
import { useCaptureIdentity } from '@/features/capture/workspace'
import { AnimalSearch } from '@/features/capture/animal-search'
import { IdentityStatus } from '@/features/sightings/identity-status'
import { RewardOutcome } from '@/features/capture/reward-outcome'

export function IdentityReview() {
  const { actor } = useCaptureIdentity()
  const client = useQueryClient()
  const reviewer = actor.roles.includes('moderator')
  const [selected, setSelected] = useState<string | null>(null)
  const [scope, setScope] = useState('pending')
  const query = useInfiniteQuery({ queryKey: ['capture', actor.id, 'review', scope], initialPageParam: '', enabled: reviewer,
    queryFn: ({ signal, pageParam }) => captureRequest('moderation/animal-identities?limit=12&scope=' + scope + (pageParam ? '&cursor=' + encodeURIComponent(pageParam) : ''), observationListSchema, { signal }),
    getNextPageParam: (last) => last.nextCursor ?? undefined, retry: false,
  })
  if (!reviewer) return <Card><CardContent className="space-y-3"><ShieldCheck className="size-8 text-primary" /><h1 className="text-2xl font-bold">Independent identity review</h1><p className="text-muted-foreground">This workspace requires an authorized real reviewer account. Sample moderator accounts do not grant access.</p></CardContent></Card>
  return <main className="space-y-6"><header><h1 className="text-3xl font-bold">Give every identity a careful look.</h1><p className="mt-2 max-w-prose text-muted-foreground">Compare the animal and the encounter evidence separately. You cannot review your own report.</p></header>
    <div className="flex flex-wrap items-center gap-3"><label className="text-sm" htmlFor="identity-review-scope">Show</label><NativeSelect id="identity-review-scope" value={scope} onChange={(event) => setScope(event.target.value)}><NativeSelectOption value="pending">Awaiting review</NativeSelectOption><NativeSelectOption value="all">All submitted encounters</NativeSelectOption></NativeSelect><Button variant="ghost" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Refresh</Button></div>
    {query.isPending && <Skeleton className="h-60 w-full rounded-xl" />}
    {query.error && <p role="alert">{query.error.message}</p>}
    {!query.isPending && !query.error && !query.data?.pages.some((page) => page.items.length) && <Card><CardContent className="space-y-3 text-center"><CheckCircle2 className="mx-auto size-10 text-primary" /><h2 className="text-xl font-bold">No encounters waiting here.</h2><p className="text-sm text-muted-foreground">New submitted photos will appear here. Your own observations are excluded for independent review.</p></CardContent></Card>}
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]"><div className="space-y-3">{query.data?.pages.flatMap((page) => page.items).map((item) => <Button key={item.observationId} variant="outline" className={'h-auto w-full justify-start whitespace-normal p-3 text-left ' + (selected === item.observationId ? 'border-primary bg-primary/5' : '')} onClick={() => setSelected(item.observationId)}><img src={item.photoUrl} alt="Encounter awaiting identity review" className="size-16 shrink-0 rounded-lg object-cover" /><span className="min-w-0"><span className="block font-semibold">{item.name}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{item.areaLabel || 'Area not supplied'}</span><span className="block text-xs font-normal text-muted-foreground">{item.publicationState === 'published' ? 'Published · open to inspect' : item.evidenceState === 'rejected' ? 'Rejected' : 'Needs review'}</span></span></Button>)}{query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>Load more encounters</Button>}</div>
    {selected ? <ReviewDetail key={selected} id={selected} onChanged={() => { void client.invalidateQueries({ queryKey: ['capture', actor.id] }) }} /> : query.data?.pages.some((page) => page.items.length) ? <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Select an encounter to compare its photo, proposed identity, and evidence.</div> : null}</div>
  </main>
}

function ReviewDetail({ id, onChanged }: { id: string; onChanged(): void }) {
  const { actor } = useCaptureIdentity()
  const query = useQuery({ queryKey: ['capture', actor.id, 'review-detail', id], queryFn: ({ signal }) => captureRequest('observations/' + id, observationSchema, { signal }), retry: false })
  const [animal, setAnimal] = useState<string | null>(null)
  const [animalName, setAnimalName] = useState('')
  const [reason, setReason] = useState('')
  const [evidence, setEvidence] = useState(false)
  const [action, setAction] = useState('confirm')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewpoint, setViewpoint] = useState('body')
  const [provenance, setProvenance] = useState('')
  if (query.isPending) return <div aria-busy="true" className="space-y-4"><Skeleton className="aspect-[4/3] rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
  if (query.error || !query.data) return <p role="alert">{query.error?.message ?? 'This observation could not be loaded.'}</p>
  const detail = query.data
  const target = animal ?? detail.proposedAnimalId ?? detail.animalId
  async function decide() {
    setPending(true); setError(''); setSuccess('')
    try {
      await captureRequest('moderation/animal-identities/' + id + '/decision', receiptSchema, { method: 'POST', key: crypto.randomUUID(), body: { version: detail.version, action, animalId: target, reason, evidenceAccepted: evidence } })
      setSuccess('Review recorded. The decision history and published sightings have been updated.')
      onChanged(); await query.refetch()
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Review failed. Reload before trying again.') }
    finally { setPending(false) }
  }
  async function enroll() {
    if (!detail.animalId) return
    setPending(true); setError(''); setSuccess('')
    try {
      await captureRequest('animals/' + detail.animalId + '/references', z.object({ id: z.string(), active: z.boolean() }), { method: 'POST', body: { observationId: id, viewpoint, provenance, traits: {} } })
      setSuccess('Reference photo enrolled independently. Future matches can compare against it.')
      onChanged()
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Reference enrollment failed.') }
    finally { setPending(false) }
  }
  return <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6"><img src={detail.photoUrl} alt="Private animal photo for identity review" className="max-h-96 w-full rounded-lg bg-muted object-contain" /><IdentityStatus identity={detail.identityState} evidence={detail.evidenceState} publication={detail.publicationState} method={detail.method} /><RewardOutcome receipt={detail} />
    <div className="space-y-2 text-sm"><p><strong>Capture:</strong> {detail.source === 'browser_camera' ? 'Browser camera assertion' : 'Imported/device photo'} · {detail.capturedAt ? new Date(detail.capturedAt).toLocaleString('en-PH') : 'Time not supplied'}</p><p><strong>Area:</strong> {detail.areaLabel || 'Unknown'}</p><p><strong>Reporter’s observation:</strong> {detail.notes || 'No additional notes.'}</p><p><strong>Evidence signals:</strong> {detail.analysis?.evidenceFlags.map((flag) => flag.replaceAll('_', ' ')).join('; ') || 'No automated evidence flags; this does not prove authenticity.'}</p></div>
    <details className="rounded-lg bg-muted p-3 text-sm"><summary className="cursor-pointer font-medium">Private capture evidence</summary><dl className="mt-3 space-y-2"><div><dt className="font-semibold">Reported coordinates</dt><dd>{detail.privateEvidence.latitude !== null ? detail.privateEvidence.latitude.toFixed(5) + ', ' + detail.privateEvidence.longitude?.toFixed(5) : 'Not supplied'}</dd></div><div><dt className="font-semibold">Source and accuracy</dt><dd>{detail.privateEvidence.locationSource || 'Unknown'} · {detail.privateEvidence.accuracyMeters !== null ? Math.round(detail.privateEvidence.accuracyMeters) + ' m' : 'accuracy unknown'}</dd></div><div><dt className="font-semibold">Location fix</dt><dd>{detail.privateEvidence.measuredAt ? new Date(detail.privateEvidence.measuredAt).toLocaleString('en-PH') : 'Not supplied'}</dd></div><div><dt className="font-semibold">Server received</dt><dd>{new Date(detail.privateEvidence.receivedAt).toLocaleString('en-PH')}</dd></div><div><dt className="font-semibold">Photo GPS metadata</dt><dd>{detail.privateEvidence.metadataLocationPresent ? 'Present; used only as supporting evidence' : 'Not present'}</dd></div></dl><p className="mt-3 text-xs text-muted-foreground">These coordinates are private and are not shown on public maps. Browser and metadata assertions can be inaccurate.</p></details>
    {detail.analysis?.candidates.length ? <div className="grid gap-3 sm:grid-cols-2">{detail.analysis.candidates.map((candidate) => <Button key={candidate.animalId} variant="outline" disabled={pending} className={'h-auto flex-col items-start whitespace-normal p-3 text-left ' + (target === candidate.animalId ? 'border-primary' : '')} onClick={() => { setAnimal(candidate.animalId); setAnimalName(candidate.name) }}>{candidate.photo && <img src={candidate.photo.url} alt={candidate.photo.alt} className="aspect-[4/3] w-full rounded-md object-cover" />}<span className="font-bold">{candidate.name}</span><span className="text-xs text-muted-foreground">{candidate.reasons.map((item) => item.replaceAll('_', ' ')).join(' · ')}</span></Button>)}</div> : null}
    <AnimalSearch disabled={pending} onSelect={(value, label) => { setAnimal(value); setAnimalName(label) }} />
    {target && <p className="text-sm">Reviewing identity: <strong>{animalName || (detail.animalId ? 'the linked animal record' : 'the reporter’s proposed animal')}</strong></p>}
    <label className="grid gap-2 text-sm font-medium" htmlFor="identity-action">Decision<NativeSelect id="identity-action" value={action} disabled={pending} onChange={(event) => setAction(event.target.value)}><NativeSelectOption value="confirm">Confirm identity</NativeSelectOption><NativeSelectOption value="reassign">Assign a different animal</NativeSelectOption><NativeSelectOption value="dispute">Mark identity disputed</NativeSelectOption><NativeSelectOption value="reject">Reject encounter evidence</NativeSelectOption></NativeSelect></label>
    {['confirm', 'reassign'].includes(action) && <label className="flex items-start gap-3 text-sm leading-relaxed"><Checkbox checked={evidence} disabled={pending} onCheckedChange={(value) => setEvidence(value === true)} /><span>I independently checked the encounter evidence and accept it for publication. Identity alone does not establish a fresh sighting.</span></label>}
    <label className="grid gap-2 text-sm font-medium" htmlFor="identity-reason">Why is this decision supported?<Textarea id="identity-reason" minLength={10} maxLength={3000} placeholder="Describe distinguishing markings, reference comparisons, and any time/place limitations." value={reason} disabled={pending} onChange={(event) => setReason(event.target.value)} /></label>
    <Button disabled={pending || reason.trim().length < 10 || (['confirm', 'reassign'].includes(action) && !target)} onClick={() => void decide()}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="size-4" />}Record decision</Button>
    {detail.identityState === 'confirmed' && detail.publicationState === 'published' && detail.animalId && <details className="space-y-3 border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">Enroll this independently checked photo as a reference</summary><div className="mt-4 space-y-3"><p className="text-xs leading-relaxed text-muted-foreground">Automatic decisions alone cannot enroll references. Your own observations cannot be enrolled by you.</p><label className="grid gap-2 text-sm" htmlFor="reference-viewpoint">Visible viewpoint<NativeSelect id="reference-viewpoint" value={viewpoint} disabled={pending} onChange={(event) => setViewpoint(event.target.value)}>{['face', 'left', 'right', 'body', 'other'].map((view) => <NativeSelectOption key={view} value={view}>{view}</NativeSelectOption>)}</NativeSelect></label><label className="grid gap-2 text-sm" htmlFor="reference-provenance">Reference evidence<Input id="reference-provenance" minLength={10} maxLength={3000} value={provenance} disabled={pending} placeholder="How was this animal’s identity established?" onChange={(event) => setProvenance(event.target.value)} /></label><Button variant="outline" disabled={pending || provenance.trim().length < 10} onClick={() => void enroll()}>Enroll reference</Button></div></details>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{success && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p>}
    <details className="border-t pt-4 text-sm"><summary className="cursor-pointer font-semibold">Decision history</summary><ol className="mt-3 space-y-3">{detail.history.map((entry, index) => <li key={index} className="border-b pb-3"><p className="font-medium">{entry.method} · {entry.action}</p><p className="mt-1 text-muted-foreground">{entry.reason}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString('en-PH')}</p></li>)}</ol></details>
  </section>
}
