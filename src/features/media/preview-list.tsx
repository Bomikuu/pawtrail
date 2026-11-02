'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MediaAsset } from './types'
export interface MediaPreview {
  id: string
  filename: string
  alt: string
  file?: File
  asset?: MediaAsset
}
function FilePreview({ item }: { item: MediaPreview }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!item.file || !item.file.type.startsWith('image/')) return
    const next = URL.createObjectURL(item.file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [item.file])
  // Private server URLs and PDF contents never enter an image optimizer or embedded document viewer.
  return url ? (
    <img
      className="media-preview-image"
      src={url}
      alt={item.alt || `Preview of ${item.filename}`}
      width={160}
      height={120}
    />
  ) : (
    <p className="media-document">{item.filename}</p>
  )
}
export function PreviewList({
  items,
  onRemove,
  onAltChange,
  disabled = false,
}: {
  items: MediaPreview[]
  onRemove(id: string): void
  onAltChange(id: string, alt: string): void
  disabled?: boolean
}) {
  return (
    <ul className="media-preview-list">
      {items.map((item) => (
        <li key={item.id} className="media-preview-item">
          <FilePreview item={item} />
          <div className="media-preview-fields">
            <label htmlFor={`media-alt-${item.id}`}>
              Description for {item.filename}
            </label>
            <Input
              id={`media-alt-${item.id}`}
              value={item.alt}
              maxLength={500}
              disabled={disabled || !!item.asset}
              onChange={(event) => onAltChange(item.id, event.target.value)}
            />
            <span>
              {item.asset
                ? item.asset.visibility === 'public'
                  ? 'Published photograph'
                  : 'Uploaded privately'
                : 'Ready to upload'}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.filename}`}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
