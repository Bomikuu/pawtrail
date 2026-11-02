'use client'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
import { AvatarPicker } from '@/features/users/avatar-picker'
import type { PrivateUser } from '@/features/users/types'
import { useSession } from '@/features/auth/session-provider'
import { performOperation, type Operation, type Extra } from './actions'

export type Field = {
  name: string
  label: string
  type?:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'datetime-local'
    | 'textarea'
    | 'select'
    | 'checkbox'
  options?: { value: string; label: string }[]
  value?: string | boolean
  help?: string
  required?: boolean
  step?: number
  min?: number
  max?: number
}
export function WorkflowForm({
  operation,
  fields,
  extra = {},
  submitLabel = 'Save',
  steps,
  uploads,
  allowDraft = false,
  initialPhotos = [],
  initialEvidence = [],
  initialAvatar,
}: {
  operation: Operation
  fields: Field[]
  extra?: Extra
  submitLabel?: string
  steps?: string[]
  uploads?: 'photos' | 'evidence' | 'both'
  allowDraft?: boolean
  initialPhotos?: string[]
  initialEvidence?: string[]
  initialAvatar?: PrivateUser['avatar']
}) {
  const prefix = useId(),
    router = useRouter(),
    queries = useQueryClient()
  const { session, updateIdentity } = useSession()
  const [avatarId, setAvatarId] = useState(extra.avatarId ?? null)
  const resolvedExtra = operation === 'profile' ? { ...extra, avatarId } : extra
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.value ?? (f.type === 'checkbox' ? false : ''),
      ]),
    ),
  )
  const [photos, setPhotos] = useState<MediaAsset[]>([]),
    [evidence, setEvidence] = useState<MediaAsset[]>([])
  const [retainedPhotos, setRetainedPhotos] = useState(initialPhotos),
    [retainedEvidence, setRetainedEvidence] = useState(initialEvidence)
  const [readyPhotos, setReadyPhotos] = useState(true),
    [readyEvidence, setReadyEvidence] = useState(true)
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [step, setStep] = useState(0)
  const receipt = useRef({ fingerprint: '', key: '' })
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const draft =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') ===
      'draft'
    const photoIds = [
        ...new Set([...retainedPhotos, ...photos.map((p) => p.id)]),
      ],
      evidenceIds = [
        ...new Set([...retainedEvidence, ...evidence.map((p) => p.id)]),
      ]
    const fingerprint = JSON.stringify({
      operation,
      values,
      extra: resolvedExtra,
      photos: photoIds,
      evidence: evidenceIds,
      draft,
    })
    if (receipt.current.fingerprint !== fingerprint)
      receipt.current = { fingerprint, key: crypto.randomUUID() }
    setPending(true)
    setError('')
    setMessage('')
    try {
      const r = await performOperation(
        operation,
        values,
        resolvedExtra,
        photoIds,
        evidenceIds,
        receipt.current.key,
        draft,
      )
      setMessage(r.message)
      if (r.identity) updateIdentity(r.identity, session.cacheScope)
      await queries.invalidateQueries()
      router.refresh()
      if (
        ['expense', 'donation', 'campaign_update'].includes(operation) &&
        !r.href
      ) {
        setValues(
          Object.fromEntries(
            fields.map((f) => [f.name, f.type === 'checkbox' ? false : '']),
          ),
        )
        setPhotos([])
        setEvidence([])
        receipt.current = { fingerprint: '', key: '' }
      }
      if (r.href) router.push(r.href)
    } catch (reason) {
      setError(
        reason instanceof z.ZodError
          ? reason.issues
              .slice(0, 4)
              .map((i) => {
                const aliases: Record<string, string> = {
                  goalMinor: 'goal',
                  exactLatitude: 'latitude',
                  exactLongitude: 'longitude',
                }
                const key = String(i.path.at(-1) ?? '')
                const label =
                  fields.find((f) => f.name === (aliases[key] ?? key))?.label ??
                  'Details'
                return `${label}: ${i.code === 'custom' ? i.message : 'please complete or correct this field'}`
              })
              .join('. ')
          : reason instanceof Error
            ? reason.message
            : 'Could not save. Your entries remain here; please try again.',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <form
      className="workflow-form"
      onSubmit={submit}
      noValidate
      aria-busy={pending}
    >
      {steps && (
        <ol className="workflow-steps" aria-label="Progress">
          {steps.map((label, i) => (
            <li key={label} aria-current={step === i ? 'step' : undefined}>
              {label}
            </li>
          ))}
        </ol>
      )}
      {operation === 'profile' && (
        <AvatarPicker
          value={avatarId}
          onChange={setAvatarId}
          current={initialAvatar}
          name={String(values.displayName ?? 'Your profile')}
          disabled={pending}
        />
      )}
      <fieldset disabled={pending} className="workflow-fields">
        <legend className="sr-only">{steps?.[step] ?? 'Details'}</legend>
        {fields.map((f) => {
          const id = `${prefix}-${f.name}`
          return (
            <div
              key={f.name}
              className="workflow-field"
              hidden={!!steps && (f.step ?? 0) !== step}
            >
              <label htmlFor={id}>
                {f.type === 'checkbox' ? (
                  <>
                    <Input
                      id={id}
                      name={f.name}
                      type="checkbox"
                      checked={values[f.name] === true}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [f.name]: e.target.checked }))
                      }
                    />{' '}
                    {f.label}
                  </>
                ) : (
                  f.label
                )}
                {f.required ? ' *' : ''}
              </label>
              {f.type === 'textarea' ? (
                <Textarea
                  id={id}
                  name={f.name}
                  rows={5}
                  value={String(values[f.name])}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.name]: e.target.value }))
                  }
                  required={f.required}
                  aria-describedby={f.help ? `${id}-help` : undefined}
                />
              ) : f.type === 'select' ? (
                <Select
                  id={id}
                  name={f.name}
                  value={String(values[f.name])}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.name]: e.target.value }))
                  }
                  required={f.required}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              ) : f.type !== 'checkbox' ? (
                <Input
                  id={id}
                  name={f.name}
                  type={f.type ?? 'text'}
                  value={String(values[f.name])}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.name]: e.target.value }))
                  }
                  min={f.min}
                  max={f.max}
                  required={f.required}
                  aria-describedby={f.help ? `${id}-help` : undefined}
                />
              ) : null}
              {f.help && (
                <p id={`${id}-help`} className="field-help">
                  {f.help}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>
      {steps && step === steps.length - 1 && (
        <dl className="workflow-review">
          {fields
            .filter((f) => f.type !== 'checkbox')
            .map((f) => (
              <div key={f.name}>
                <dt>{f.label}</dt>
                <dd>{String(values[f.name] || 'Not provided')}</dd>
              </div>
            ))}
        </dl>
      )}
      <div
        hidden={
          !!steps && step !== steps.length - 2 && step !== steps.length - 1
        }
      >
        {[...retainedPhotos, ...retainedEvidence].map((id, i) => (
          <div className="journal-row" key={id}>
            <a
              href={`/api/v1/media/${id}/content`}
              target="_blank"
              rel="noreferrer"
            >
              Previously saved attachment {i + 1}
            </a>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setRetainedPhotos((v) => v.filter((r) => r !== id))
                setRetainedEvidence((v) => v.filter((r) => r !== id))
              }}
            >
              Remove from this draft
            </Button>
          </div>
        ))}
        {(uploads === 'photos' || uploads === 'both') && (
          <section>
            <h2>Photographs</h2>
            <UploadField
              value={photos}
              onChange={setPhotos}
              disabled={pending}
              maxAttachments={Math.max(
                0,
                6 -
                  evidence.length -
                  retainedPhotos.length -
                  retainedEvidence.length,
              )}
              onReadyChange={setReadyPhotos}
            />
          </section>
        )}
        {(uploads === 'evidence' || uploads === 'both') && (
          <section>
            <h2>Private evidence</h2>
            <UploadField
              purpose="private_evidence"
              value={evidence}
              onChange={setEvidence}
              disabled={pending}
              maxAttachments={Math.max(
                0,
                6 -
                  photos.length -
                  retainedPhotos.length -
                  retainedEvidence.length,
              )}
              onReadyChange={setReadyEvidence}
            />
          </section>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="workflow-actions">
        {!!steps && step > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        {!!steps && step < steps.length - 1 ? (
          <Button
            type="button"
            disabled={pending || !readyPhotos || !readyEvidence}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={pending || !readyPhotos || !readyEvidence}
          >
            {pending ? 'Saving…' : submitLabel}
          </Button>
        )}
        {allowDraft && (
          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="outline"
            disabled={pending || !readyPhotos || !readyEvidence}
          >
            Save private draft
          </Button>
        )}
      </div>
    </form>
  )
}
