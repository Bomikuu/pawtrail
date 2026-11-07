'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
import { BannerPicker } from '@/features/users/banner-picker'
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
  const [bannerId, setBannerId] = useState(extra.bannerId ?? 'meadow')
  const resolvedExtra =
    operation === 'profile'
      ? { ...extra, avatarId, bannerId }
      : operation === 'animal_edit'
        ? { ...extra, bannerId }
        : extra
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
      className={
        'workflow-form my-6 grid w-full min-w-0 max-w-3xl gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6 [&_[data-slot=native-select-wrapper]]:w-full [&_select]:min-h-11 [&_textarea]:min-h-32 [.workflow-panel_>_&]:m-0 [.workflow-panel_>_&]:max-w-none [.workflow-panel_>_&]:border-0 [.workflow-panel_>_&]:bg-transparent [.workflow-panel_>_&]:p-0 [.mission-evidence-details_&]:mt-3'
      }
      onSubmit={submit}
      noValidate
      aria-busy={pending}
    >
      {steps && (
        <ol
          className={
            'workflow-steps flex gap-4 list-none p-0 m-0 flex-wrap text-muted-foreground text-sm [&_li]:[border-bottom:2px_solid_#ede5d8] [&_li]:[padding:0.5rem_0] [&_[aria-current=step]]:text-[#0f766e] [&_[aria-current=step]]:border-[#0f766e] [&_[aria-current=step]]:font-bold max-[48rem]:gap-3'
          }
          aria-label="Progress"
        >
          {steps.map((label, i) => (
            <li key={label} aria-current={step === i ? 'step' : undefined}>
              {label}
            </li>
          ))}
        </ol>
      )}
      {(operation === 'profile' || operation === 'animal_edit') && (
        <BannerPicker
          kind={operation === 'animal_edit' ? 'animal' : 'person'}
          value={bannerId}
          onChange={setBannerId}
          disabled={pending}
        />
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
      <fieldset
        disabled={pending}
        className={'workflow-fields [border:0] p-0 m-0 min-w-0 grid gap-5'}
      >
        <legend className="sr-only">{steps?.[step] ?? 'Details'}</legend>
        {fields.map((f) => {
          const id = `${prefix}-${f.name}`
          return (
            <div
              key={f.name}
              className={
                'workflow-field grid min-w-0 content-start gap-2 [&[hidden]]:hidden [&_textarea]:min-h-32'
              }
              hidden={!!steps && (f.step ?? 0) !== step}
            >
              <label
                htmlFor={id}
                className={
                  f.type === 'checkbox'
                    ? 'flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm font-medium leading-relaxed'
                    : 'text-sm font-medium leading-6'
                }
              >
                {f.type === 'checkbox' ? (
                  <>
                    <Checkbox
                      id={id}
                      name={f.name}
                      className="mt-0.5 size-5"
                      required={f.required}
                      aria-describedby={f.help ? `${id}-help` : undefined}
                      checked={values[f.name] === true}
                      onCheckedChange={(checked) =>
                        setValues((v) => ({ ...v, [f.name]: checked === true }))
                      }
                    />
                    <span className="min-w-0">
                      {f.label}
                      {f.required ? ' *' : ''}
                    </span>
                  </>
                ) : (
                  f.label
                )}
                {f.required && f.type !== 'checkbox' ? ' *' : ''}
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
                  aria-describedby={f.help ? `${id}-help` : undefined}
                >
                  {f.options?.map((o) => (
                    <SelectOption key={o.value} value={o.value}>
                      {o.label}
                    </SelectOption>
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
                <p
                  id={`${id}-help`}
                  className={
                    'field-help text-sm text-muted-foreground m-0 [.avatar-picker_>_&]:m-0 [.avatar-picker_>_&]:max-w-[65ch] [.avatar-picker_>_&]:text-xs [.achievement-proof-form_&]:text-xs'
                  }
                >
                  {f.help}
                </p>
              )}
            </div>
          )
        })}
      </fieldset>
      {steps && step === steps.length - 1 && (
        <dl
          className={
            'workflow-review [margin:1.5rem_0] grid gap-4 [&_div]:[padding:0_0_1rem] [&_div]:[border-bottom:1px_solid_#ede5d8] [&_dt]:font-semibold [&_dt]:text-sm [&_dt]:text-muted-foreground [&_dd]:[margin:0.5rem_0_0] [&_dd]:whitespace-pre-wrap [&_dd]:[overflow-wrap:anywhere] [.app-shell_&]:bg-card [.app-shell_&]:p-5 [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl'
          }
        >
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
          <div
            className={
              'journal-row [padding:1.25rem_0] [border-bottom:1px_solid_#ede5d8] [overflow-wrap:anywhere] [&_h2]:text-xl [&_h2]:[margin:0.35rem_0] [&_p]:[margin:0.5rem_0] [.app-shell_&]:min-w-0 [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:[overflow-wrap:anywhere] [.app-shell_&]:p-5 [.app-shell_&]:[margin:0_0_1rem] max-[48rem]:[.app-shell_&]:p-4'
            }
            key={id}
          >
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
        <p
          className={'field-error m-0 text-foreground font-semibold'}
          role="alert"
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div
        className={
          'workflow-actions flex items-center gap-3 flex-wrap [margin:0.75rem_0] [.discovery-map_&_p]:m-0 [.discovery-map_&_p]:text-sm [.discovery-map_&_p]:text-muted-foreground max-[48rem]:[&_>_*]:max-w-full [.achievement-review-card_&]:mt-4 [.adoption-story_&]:gap-2.5 [.adoption-story_&_[data-slot=button]]:[flex:1_1_9rem]'
        }
      >
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
            loading={pending}
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
