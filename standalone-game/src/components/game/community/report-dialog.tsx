import { useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Paperclip, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mapRequest, downloadMapEvidence } from '@/game/housing/client'
import { MapLocationPicker } from './location-picker'
import type {
  MapEntity,
  MyReports,
  Point,
  PrivateReport,
} from '@/game/discovery/types'
export type ReportMode =
  'incident' | 'help' | 'mine' | 'information' | 'appeal' | 'offer'
const categories = {
  poisoning: 'Possible poisoning',
  abuse: 'Possible abuse or neglect',
  violence: 'Violence affecting animal welfare',
  dangerous_conditions: 'Dangerous conditions',
  animal_conflict: 'Animal conflict',
  other: 'Other welfare concern',
}
const helpCategories = {
  food: 'Food',
  water: 'Drinking water',
  transport: 'Transport',
  vet: 'Veterinary assistance',
  supplies: 'Shelter supplies',
  rescue: 'Rescue coordination',
  other: 'Other help',
}
const statusLabels: Record<string, string> = {
  submitted: 'Submitted privately',
  under_review: 'Under review',
  needs_info: 'Needs more information',
  corroborated: 'Corroborated',
  resolved: 'Resolved',
  rejected: 'Rejected',
  archived: 'Archived',
  active: 'Active help request',
}
function Options({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (v: string) => void
  options: Record<string, string>
  label: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="pawtrail-game text-foreground">
        {Object.entries(options).map(([id, name]) => (
          <SelectItem key={id} value={id}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
function entitySubject(entity: MapEntity | null) {
  if (!entity) return null
  if (entity.animal)
    return {
      id: 'animal:' + entity.animal.id,
      kind: 'animal',
      sample: entity.sample,
    }
  return ['home', 'shelter', 'hub', 'animal', 'horde'].includes(entity.kind)
    ? { id: entity.id, kind: entity.kind, sample: entity.sample }
    : entity.subject
}
export function ReportDialog({
  mode,
  onClose,
  entity,
  center,
  onSaved,
  loginHref,
}: {
  mode: ReportMode | null
  onClose: () => void
  entity: MapEntity | null
  center: Point | null
  onSaved: () => void
  loginHref: string
}) {
  const [description, setDescription] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('dangerous_conditions')
  const [priority, setPriority] = useState('medium')
  const [area, setArea] = useState('')
  const [location, setLocation] = useState<Point | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [observed, setObserved] = useState('')
  const [witnessed, setWitnessed] = useState(false)
  const [urgent, setUrgent] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [mine, setMine] = useState<MyReports | null>(null)
  const [queue, setQueue] = useState<{
    incidents: PrivateReport[]
    help: PrivateReport[]
  } | null>(null)
  const [reviewMode, setReviewMode] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!mode) return
    setDescription('')
    setTitle('')
    setCategory(mode === 'help' ? 'food' : 'dangerous_conditions')
    setArea(entity?.area ?? '')
    setLocation(entity?.coordinates ?? center)
    setLocationLabel(
      entity ? 'Near ' + entity.name : center ? 'Your chosen map area' : '',
    )
    const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setObserved(local)
    setFiles([])
    setMessage('')
    setError('')
    setMine(null)
    setQueue(null)
    setReviewMode(false)
    setWitnessed(false)
    setUrgent(false)
    const abort = new AbortController()
    if (mode !== 'mine')
      mapRequest<MyReports>('map/mine/', undefined, abort.signal)
        .then(setMine)
        .catch(() => {})
    return () => abort.abort()
  }, [mode, entity?.id])
  useEffect(() => {
    if (mode !== 'mine') return
    const abort = new AbortController()
    mapRequest<MyReports>('map/mine/', undefined, abort.signal)
      .then(setMine)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message)
      })
    if (reviewMode)
      mapRequest<{ incidents: PrivateReport[]; help: PrivateReport[] }>(
        'map/moderation/',
        undefined,
        abort.signal,
      )
        .then(setQueue)
        .catch((e) => {
          if (!abort.signal.aborted) setError(e.message)
        })
    return () => abort.abort()
  }, [mode, refresh, reviewMode])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'information' || mode === 'appeal') {
        if (!entity?.incident)
          throw new Error('Choose a published report first.')
        const result = await mapRequest<{ notice: string }>(
          'incidents/' + entity.incident.id + '/corrections/',
          { kind: mode === 'appeal' ? 'appeal' : 'information', description },
        )
        setMessage(result.notice)
      } else if (mode === 'offer') {
        if (!entity?.help)
          throw new Error('Choose an active help request first.')
        const result = await mapRequest<{ notice: string }>(
          'help-requests/' + entity.help.id + '/offers/',
          { description },
        )
        setMessage(result.notice)
      } else {
        if (!location)
          throw new Error(
            'Choose a point on the map or use your current location.',
          )
        const coordinates = location
        const common = {
          description,
          category,
          coordinates,
          area,
          subject: entitySubject(entity),
        }
        const result = await mapRequest<{ id: string; notice: string }>(
          mode === 'help' ? 'help-requests/' : 'incidents/',
          mode === 'help'
            ? { ...common, title, priority }
            : {
                ...common,
                occurredAt: new Date(observed).toISOString(),
                witnessed,
                urgent,
              },
        )
        const failed: string[] = []
        if (mode === 'incident')
          for (const file of files) {
            const body = new FormData()
            body.set('file', file)
            try {
              await mapRequest('incidents/' + result.id + '/evidence/', body)
            } catch {
              failed.push(file.name)
            }
          }
        setMessage(
          result.notice +
            (failed.length
              ? ' Evidence upload failed for ' +
                failed.join(', ') +
                '. Your report was saved; add those files from My reports.'
              : ''),
        )
      }
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const current = reviewMode && queue ? queue : mine
  return (
    <Dialog
      open={!!mode}
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="pawtrail-game max-h-[90dvh] overflow-y-auto sm:max-w-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {mode === 'mine'
              ? 'Your community reports'
              : mode === 'help'
                ? 'Request help'
                : mode === 'offer'
                  ? 'Offer practical help'
                  : mode === 'appeal'
                    ? 'Report incorrect information'
                    : mode === 'information'
                      ? 'Add information privately'
                      : 'Report an animal welfare concern'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'mine'
              ? 'Private reports, attachments and review decisions.'
              : mode === 'help'
                ? 'Help requests are separate from welfare allegations. A reviewer checks the public summary.'
                : mode === 'offer'
                  ? 'Your offer is shared privately with the request organizer.'
                  : 'Reports and evidence are private until reviewed. A submission does not establish a confirmed finding.'}
          </DialogDescription>
        </DialogHeader>
        {mode === 'mine' ? (
          <div className="space-y-4">
            {mine?.canReview && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={!reviewMode ? 'default' : 'outline'}
                  onClick={() => setReviewMode(false)}
                >
                  My reports
                </Button>
                <Button
                  size="sm"
                  variant={reviewMode ? 'default' : 'outline'}
                  onClick={() => setReviewMode(true)}
                >
                  <ShieldCheck className="size-4" />
                  Review queue
                </Button>
              </div>
            )}
            {!current && !error && (
              <p
                role="status"
                className="rounded-xl bg-muted p-4 text-sm motion-safe:animate-pulse"
              >
                Loading private reports…
              </p>
            )}
            {current &&
              [...current.incidents, ...current.help].length === 0 && (
                <div className="rounded-xl border p-5 text-sm">
                  <p className="font-bold">No reports here yet.</p>
                  <p className="mt-1 text-muted-foreground">
                    A private submission or help request will appear here with
                    its review status.
                  </p>
                </div>
              )}
            {current &&
              [...current.incidents, ...current.help].map((row) => (
                <PrivateReportCard
                  key={row.recordType + row.id + ':' + row.version}
                  report={row}
                  review={reviewMode && !!mine?.canReview}
                  onSaved={() => {
                    setRefresh((n) => n + 1)
                    onSaved()
                  }}
                />
              ))}
            {reviewMode &&
              mine?.canReview &&
              entity &&
              ['home', 'shelter', 'hub', 'animal', 'horde'].includes(
                entity.kind,
              ) && <ContributionForm entity={entity} onSaved={onSaved} />}
          </div>
        ) : message ? (
          <div className="space-y-3 rounded-xl border bg-secondary/40 p-4">
            <p role="status" className="text-sm leading-relaxed">
              {message}
            </p>
            <Button onClick={onClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {!mine && (
              <p className="rounded-lg bg-secondary p-3 text-xs leading-relaxed">
                Sign in or reconnect before sending a report.{' '}
                <a href={loginHref} className="font-bold underline">
                  Sign in
                </a>
              </p>
            )}
            {entity && (
              <p className="text-xs text-muted-foreground">
                Related to {entity.name}
                {entity.sample ? ' · sample record' : ''}
              </p>
            )}
            {(mode === 'incident' || mode === 'help') && (
              <>
                {mode === 'help' && (
                  <label className="block space-y-1.5 text-sm font-semibold">
                    Request title
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      minLength={5}
                      maxLength={120}
                      required
                    />
                  </label>
                )}
                <label className="block space-y-1.5 text-sm font-semibold">
                  Category
                  <Options
                    label="Report category"
                    value={category}
                    onChange={setCategory}
                    options={mode === 'help' ? helpCategories : categories}
                  />
                </label>
              </>
            )}
            <label className="block space-y-1.5 text-sm font-semibold">
              {mode === 'appeal'
                ? 'What should the reviewer correct?'
                : mode === 'offer'
                  ? 'How can you help?'
                  : 'What did you observe or what help is needed?'}
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minLength={mode === 'offer' ? 10 : 20}
                maxLength={4000}
                required
                placeholder="Share concrete details. Include uncertainty where you are unsure."
                className="min-h-28 font-normal"
              />
            </label>
            {(mode === 'incident' || mode === 'help') && (
              <>
                <label className="block space-y-1.5 text-sm font-semibold">
                  Approximate area
                  <Input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    maxLength={120}
                    placeholder="Neighborhood or nearby public landmark"
                    required
                  />
                </label>
                <MapLocationPicker
                  value={location}
                  label={locationLabel}
                  onChange={(point, label) => {
                    setLocation(point)
                    setLocationLabel(label)
                    setArea((current) => (current.trim() ? current : label))
                  }}
                />
                {mode === 'help' ? (
                  <label className="block space-y-1.5 text-sm font-semibold">
                    Priority
                    <Options
                      label="Help priority"
                      value={priority}
                      onChange={setPriority}
                      options={{
                        low: 'Low',
                        medium: 'Medium',
                        high: 'High',
                        critical: 'Critical · expires after four hours',
                      }}
                    />
                  </label>
                ) : (
                  <>
                    <label className="block space-y-1.5 text-sm font-semibold">
                      When did you observe it?
                      <Input
                        type="datetime-local"
                        value={observed}
                        onChange={(e) => setObserved(e.target.value)}
                        required
                      />
                    </label>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="report-witness" className="text-sm">
                        I witnessed this directly
                      </label>
                      <Switch
                        id="report-witness"
                        checked={witnessed}
                        onCheckedChange={setWitnessed}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="report-urgent" className="text-sm">
                        Urgent assistance may be needed
                      </label>
                      <Switch
                        id="report-urgent"
                        checked={urgent}
                        onCheckedChange={setUrgent}
                      />
                    </div>
                    <label className="block space-y-1.5 text-sm font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Paperclip className="size-4" />
                        Optional private evidence
                      </span>
                      <Input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files ?? []).slice(0, 6))
                        }
                      />
                      <span className="block text-xs font-normal text-muted-foreground">
                        Up to six files, 10 MB each. Attachments are available
                        only to you and authorized reviewers.
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !mine} className="w-full">
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {busy
                ? 'Saving privately…'
                : mode === 'help'
                  ? 'Submit help request'
                  : mode === 'offer'
                    ? 'Send private offer'
                    : mode === 'appeal' || mode === 'information'
                      ? 'Send to reviewer'
                      : 'Submit private report'}
            </Button>
          </form>
        )}
        {mode === 'mine' && error && (
          <p role="alert" className="text-sm text-destructive">
            {error}{' '}
            <a href={loginHref} className="underline">
              Sign in
            </a>
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PrivateReportCard({
  report: r,
  review,
  onSaved,
}: {
  report: PrivateReport
  review: boolean
  onSaved: () => void
}) {
  const [status, setStatus] = useState(r.status),
    [summary, setSummary] = useState(r.publicSummary),
    [published, setPublished] = useState(r.published),
    [severity, setSeverity] = useState(r.severity ?? 'unknown'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function save() {
    setBusy(true)
    setError('')
    try {
      await mapRequest('map/moderation/' + r.recordType + '/' + r.id + '/', {
        version: r.version,
        status,
        published,
        publicSummary: summary,
        severity,
        notes: 'Reviewed through the community map',
      })
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function attach(files: FileList | null) {
    if (!files) return
    setBusy(true)
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const body = new FormData()
        body.set('file', file)
        await mapRequest('incidents/' + r.id + '/evidence/', body)
      }
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer text-sm font-bold">
        {r.title ??
          categories[r.category as keyof typeof categories] ??
          r.category}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {statusLabels[r.status] ?? r.status}
        </span>
      </summary>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
        {r.description}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {r.area} ·{' '}
        {r.recordType === 'incident'
          ? 'Private evidence and location'
          : 'Help request'}{' '}
        · revision {r.version}
      </p>
      {r.evidence?.map((file) => (
        <Button
          key={file.id}
          size="sm"
          variant="link"
          className="mt-1 max-w-full justify-start px-0 text-xs"
          onClick={() =>
            void downloadMapEvidence(file.id, file.name).catch((e) =>
              setError(e.message),
            )
          }
        >
          <Paperclip className="size-3" />
          <span className="truncate">{file.name}</span>
        </Button>
      ))}
      {r.offers?.map((offer, i) => (
        <div key={i} className="mt-2 rounded-lg bg-muted p-3 text-xs">
          <p className="font-bold">Private offer from {offer.name}</p>
          <p className="mt-1 whitespace-pre-wrap">{offer.description}</p>
        </div>
      ))}
      {r.recordType === 'incident' && !review && (
        <label className="mt-3 block text-xs font-semibold">
          Add private evidence
          <Input
            type="file"
            disabled={busy}
            accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm"
            onChange={(e) => void attach(e.target.files)}
          />
        </label>
      )}
      {r.corrections?.map((c, i) => (
        <div key={i} className="mt-3 rounded-lg bg-muted p-3 text-xs">
          <p className="font-bold">
            {c.kind === 'appeal'
              ? 'Correction request'
              : 'Additional information'}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{c.description}</p>
        </div>
      ))}
      {review && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <Options
            label="Review status"
            value={status}
            onChange={setStatus}
            options={Object.fromEntries(
              (r.recordType === 'incident'
                ? [
                    'submitted',
                    'under_review',
                    'needs_info',
                    'corroborated',
                    'resolved',
                    'rejected',
                    'archived',
                  ]
                : ['under_review', 'active', 'resolved', 'rejected']
              ).map((k) => [k, statusLabels[k]]),
            )}
          />
          {r.recordType === 'incident' && (
            <Options
              label="Reviewed severity"
              value={severity}
              onChange={setSeverity}
              options={{
                unknown: 'Severity not determined',
                low: 'Low',
                medium: 'Medium',
                high: 'High',
                critical: 'Critical',
              }}
            />
          )}
          <label className="block space-y-1 text-xs font-semibold">
            Approved public summary
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={1500}
              placeholder="Factual wording only. Omit identifying details and private evidence."
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={'publish-' + r.id} className="text-xs">
              Publish generalized summary
            </label>
            <Switch
              id={'publish-' + r.id}
              checked={published}
              onCheckedChange={setPublished}
            />
          </div>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save review'}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </details>
  )
}
function ContributionForm({
  entity,
  onSaved,
}: {
  entity: MapEntity
  onSaved: () => void
}) {
  const [kind, setKind] = useState('approved_mission'),
    [reference, setReference] = useState('platform:'),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    setMessage('')
    try {
      await mapRequest('reputation/events/', {
        kind,
        sourceReference: reference,
        subject: entitySubject(entity),
        coordinates: entity.coordinates,
        occurredAt: new Date().toISOString(),
      })
      setMessage(
        'Verified contribution recorded. Welfare concerns remain independent.',
      )
      onSaved()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="text-sm font-bold text-foreground">
        Document a contribution · {entity.name}
      </h3>
      <Options
        label="Verified contribution type"
        value={kind}
        onChange={setKind}
        options={{
          feeding: 'Verified feeding',
          approved_mission: 'Approved mission',
          care: 'Documented care',
          volunteering: 'Volunteering',
          rescue: 'Verified rescue assistance',
          shelter_support: 'Shelter support',
          incident_response: 'Verified incident response',
        }}
      />
      <label className="block text-xs font-semibold">
        Evidence reference
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="platform:record-id or review:document-id"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Use documented platform evidence. Local game actions and Kibble are
        excluded.
      </p>
      <Button size="sm" disabled={busy} onClick={() => void save()}>
        Record verified contribution
      </Button>
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </section>
  )
}
