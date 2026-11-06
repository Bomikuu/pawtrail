'use client'
import { useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { ResourceRef } from '@/types/common'
export interface LinkedOption {
  ref: ResourceRef
  title: string
  href: string
}
export function LinkedEntityPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: LinkedOption[]
  value: ResourceRef[]
  onChange(value: ResourceRef[]): void
  disabled?: boolean
}) {
  const [search, setSearch] = useState('')
  const id = useId()
  const shown = options
    .filter((option) =>
      option.title.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 8)
  return (
    <fieldset
      disabled={disabled}
      className={
        'linked-picker [&_legend]:font-bold [&_legend]:mb-3 [border:0] [padding:1.5rem_0_0]'
      }
    >
      <legend>Connect this story</legend>
      <p>Choose the animals or care efforts in your update.</p>
      {!!value.length && (
        <div
          className={
            'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
          }
          aria-label="Selected connections"
        >
          {value.map((ref) => {
            const option = options.find(
              (option) =>
                option.ref.kind === ref.kind && option.ref.id === ref.id,
            )
            return (
              <Button
                type="button"
                variant="outline"
                key={`${ref.kind}:${ref.id}`}
                onClick={() =>
                  onChange(
                    value.filter(
                      (item) => item.kind !== ref.kind || item.id !== ref.id,
                    ),
                  )
                }
              >
                Unlink {option?.title ?? `unavailable ${ref.kind}`}
              </Button>
            )
          })}
        </div>
      )}
      <label htmlFor={id}>Find an animal or care effort</label>
      <Input
        id={id}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div
        className={
          'community-choice-row flex flex-wrap gap-2 items-center [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [.linked-picker_&]:mt-3'
        }
      >
        {shown.map((option) => {
          const selected = value.some(
            (ref) => ref.kind === option.ref.kind && ref.id === option.ref.id,
          )
          return (
            <Button
              type="button"
              variant="outline"
              key={`${option.ref.kind}:${option.ref.id}`}
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected
                    ? value.filter(
                        (ref) =>
                          ref.kind !== option.ref.kind ||
                          ref.id !== option.ref.id,
                      )
                    : [...value, option.ref],
                )
              }
            >
              {option.title}{' '}
              <span className="secondary-text">· {option.ref.kind}</span>
            </Button>
          )
        })}
      </div>
      {!shown.length && <p>No matching records. Try another name.</p>}
    </fieldset>
  )
}
