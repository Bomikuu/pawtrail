'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getBrowserApi } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { MediaAsset, MediaUpload } from './types'
import { MAX_ATTACHMENTS } from './schemas'
import { PreviewList, type MediaPreview } from './preview-list'

export function UploadField({
  value,
  onChange,
  purpose = 'public_image',
  shelterId,
  api,
  disabled = false,
}: {
  value: MediaAsset[]
  onChange(assets: MediaAsset[]): void
  purpose?: MediaUpload['purpose']
  shelterId?: string
  api?: PawTrailApi['media']
  disabled?: boolean
}) {
  const id = useId()
  const [drafts, setDrafts] = useState<MediaPreview[]>([])
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [sensitive, setSensitive] = useState(false)
  const active = useRef<AbortController | null>(null)
  useEffect(() => () => active.current?.abort(), [])
  const service = () => api ?? getBrowserApi().media
  const items = [
    ...value.map((asset) => ({
      id: asset.id,
      filename: asset.alt,
      alt: asset.alt,
      asset,
    })),
    ...drafts,
  ]
  function choose(files: FileList | null) {
    if (!files) return
    setError('')
    const next = Array.from(files)
    if (items.length + next.length > MAX_ATTACHMENTS) {
      setError('Choose up to six attachments in total.')
      return
    }
    const types = [
      'image/jpeg',
      'image/png',
      'image/webp',
      ...(purpose === 'private_evidence' ? ['application/pdf'] : []),
    ]
    if (
      next.some(
        (file) =>
          !types.includes(file.type) ||
          !file.size ||
          file.size > 10 * 1024 * 1024,
      )
    ) {
      setError(
        'Choose JPEG, PNG or WebP images, or private PDF evidence, up to 10 MiB each.',
      )
      return
    }
    setDrafts((current) => [
      ...current,
      ...next.map((file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        file,
        alt: '',
      })),
    ])
  }
  async function upload() {
    if (drafts.some((item) => !item.alt.trim())) {
      setError('Describe every attachment before uploading.')
      return
    }
    setPending(true)
    setError('')
    const controller = new AbortController()
    active.current = controller
    const uploaded = [...value]
    let uploadingId: string | undefined
    try {
      for (const item of drafts) {
        uploadingId = item.id
        const asset = await service().upload(
          {
            file: item.file!,
            filename: item.filename,
            alt: item.alt,
            purpose,
            sensitive,
            ...(shelterId ? { shelterId } : {}),
          },
          { signal: controller.signal, idempotencyKey: item.id },
        )
        if (controller.signal.aborted) return
        uploaded.push(asset)
        onChange([...uploaded])
        setDrafts((current) => current.filter((entry) => entry.id !== item.id))
      }
    } catch (reason) {
      if (
        !controller.signal.aborted &&
        reason instanceof ApiError &&
        reason.code === 'UPLOAD_EXPIRED'
      ) {
        // The old receipt cannot be reused. Preserve the file and description for a fresh attempt.
        setDrafts((current) =>
          current.map((item) =>
            item.id === uploadingId
              ? { ...item, id: crypto.randomUUID() }
              : item,
          ),
        )
      }
      if (!controller.signal.aborted)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Upload failed. Your selections are still here; try again.',
        )
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }
  async function remove(itemId: string) {
    const asset = value.find((item) => item.id === itemId)
    if (!asset) {
      setDrafts((current) => current.filter((item) => item.id !== itemId))
      return
    }
    setPending(true)
    setError('')
    try {
      await service().remove(itemId)
      onChange(value.filter((item) => item.id !== itemId))
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Removal failed. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <fieldset
      className="media-upload"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      <legend>Attachments</legend>
      <p id={`${id}-help`}>
        {purpose === 'private_evidence'
          ? 'Evidence stays private to you and authorized organization staff. PDFs download as documents.'
          : 'Photos stay private until reviewed for publication.'}{' '}
        Choose up to six files, 10 MiB each.
      </p>
      <label htmlFor={`${id}-files`}>Attachments</label>
      <Input
        id={`${id}-files`}
        type="file"
        multiple
        accept={`image/jpeg,image/png,image/webp${purpose === 'private_evidence' ? ',application/pdf' : ''}`}
        aria-describedby={`${id}-help`}
        disabled={disabled || pending}
        onChange={(event) => {
          choose(event.target.files)
          event.target.value = ''
        }}
      />
      {purpose === 'public_image' && (
        <label className="media-sensitive" htmlFor={`${id}-sensitive`}>
          <Input
            id={`${id}-sensitive`}
            type="checkbox"
            className="media-sensitive-input"
            checked={sensitive}
            onChange={(event) => setSensitive(event.target.checked)}
            disabled={disabled || pending}
          />
          Contains sensitive animal imagery
        </label>
      )}
      <PreviewList
        items={items}
        disabled={disabled || pending}
        onAltChange={(itemId, alt) =>
          setDrafts((current) =>
            current.map((item) =>
              item.id === itemId ? { ...item, alt } : item,
            ),
          )
        }
        onRemove={(itemId) => {
          void remove(itemId)
        }}
      />
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <p role="status">
        {pending
          ? 'Uploading attachments…'
          : `${value.length} of ${MAX_ATTACHMENTS} attachments uploaded`}
      </p>
      <Button
        type="button"
        disabled={disabled || pending || !drafts.length}
        onClick={() => {
          void upload()
        }}
      >
        {pending ? 'Uploading…' : 'Upload attachments'}
      </Button>
    </fieldset>
  )
}
