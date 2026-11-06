'use client'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import type { PrivateUser } from './types'
import { avatarPresets, getAvatarPreset } from './avatar-presets'

export function AvatarPicker({
  value,
  onChange,
  current,
  name,
  disabled = false,
}: {
  value: string | null
  onChange: (id: string) => void
  current?: PrivateUser['avatar']
  name: string
  disabled?: boolean
}) {
  const selected = getAvatarPreset(value)
  const image = selected ? { url: selected.src, alt: selected.label } : current
  return (
    <fieldset
      className={
        'avatar-picker [border:0] [margin:0_0_1.5rem] [padding:0_0_1.5rem] [border-bottom:1px_solid_var(--social-line)] min-w-0 [&_legend]:font-[800] [&_legend]:text-lg [&_legend]:leading-[1.35] [&_legend]:font-heading [&_legend]:mb-4'
      }
      disabled={disabled}
    >
      <legend>Choose your avatar</legend>
      <div
        className={
          'avatar-selection-preview flex items-center gap-4 mb-4 [&_strong]:text-[length:0.9375rem] [&_p]:[margin:0.25rem_0_0] [&_p]:text-muted-foreground [&_p]:text-[0.8125rem] max-[40rem]:gap-3'
        }
      >
        <CommunityAvatar name={name} image={image} large />
        <div>
          <strong>{selected?.label ?? 'Your current avatar'}</strong>
          <p>Save your profile to apply your choice.</p>
        </div>
      </div>
      {current && !getAvatarPreset(current.id) && (
        <Button
          type="button"
          variant="outline"
          aria-pressed={value === current.id}
          onClick={() => onChange(current.id)}
        >
          Keep my current photo
        </Button>
      )}
      <div
        className={
          'avatar-picker-grid grid grid-cols-[repeat(auto-fill,_minmax(4.5rem,_1fr))] gap-2 max-h-92 overflow-y-auto [overscroll-behavior:contain] p-2 [margin:0.5rem_-0.5rem_0.75rem] [scrollbar-gutter:stable] max-[40rem]:grid-cols-4 max-[40rem]:gap-1'
        }
        role="group"
        aria-label="Illustrated profile avatars"
      >
        {avatarPresets.map((avatar) => (
          <Button
            type="button"
            variant="ghost"
            key={avatar.id}
            className={
              'avatar-option [.avatar-picker-grid_&]:relative [.avatar-picker-grid_&]:flex [.avatar-picker-grid_&]:w-full [.avatar-picker-grid_&]:[aspect-ratio:1] [.avatar-picker-grid_&]:p-1.5 [.avatar-picker-grid_&]:[border:2px_solid_transparent] [.avatar-picker-grid_&]:rounded-xl [.avatar-picker-grid_&]:bg-[transparent] [.avatar-picker-grid_&]:min-w-0 [.avatar-picker-grid_&_img]:w-full [.avatar-picker-grid_&_img]:h-auto [.avatar-picker-grid_&_img]:[aspect-ratio:1] [.avatar-picker-grid_&_img]:object-cover [.avatar-picker-grid_&_img]:rounded-full [.avatar-picker-grid_&:hover]:bg-[#fff4e8] [.avatar-picker-grid_&[aria-pressed=true]]:border-[#be4a0a] [.avatar-picker-grid_&[aria-pressed=true]]:bg-[#fff4e8] [@media(forced-colors:_active)]:[.avatar-picker-grid_&[aria-pressed=true]]:border-[Highlight]'
            }
            aria-label={avatar.label}
            title={avatar.label}
            aria-pressed={value === avatar.id}
            onClick={() => onChange(avatar.id)}
          >
            <img
              src={avatar.src}
              width={192}
              height={192}
              alt=""
              loading="lazy"
            />
            {value === avatar.id && (
              <span
                className={
                  'avatar-option-check absolute inline-flex items-center justify-center bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-foreground text-card'
                }
              >
                <Check size={13} aria-hidden="true" />
              </span>
            )}
          </Button>
        ))}
      </div>
      <p
        className={
          'field-help text-sm text-[#6b625b] m-0 [.avatar-picker_>_&]:m-0 [.avatar-picker_>_&]:max-w-[65ch] [.avatar-picker_>_&]:text-xs [.achievement-proof-form_&]:text-xs'
        }
      >
        Illustrated avatars are shared when your profile or contribution
        identity is visible. Your privacy settings still apply.
      </p>
    </fieldset>
  )
}
