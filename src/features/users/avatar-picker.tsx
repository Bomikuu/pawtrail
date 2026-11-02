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
    <fieldset className="avatar-picker" disabled={disabled}>
      <legend>Choose your avatar</legend>
      <div className="avatar-selection-preview">
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
        className="avatar-picker-grid"
        role="group"
        aria-label="Illustrated profile avatars"
      >
        {avatarPresets.map((avatar) => (
          <Button
            type="button"
            variant="ghost"
            key={avatar.id}
            className="avatar-option"
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
              <span className="avatar-option-check">
                <Check size={13} aria-hidden="true" />
              </span>
            )}
          </Button>
        ))}
      </div>
      <p className="field-help">
        Illustrated avatars are shared when your profile or contribution
        identity is visible. Your privacy settings still apply.
      </p>
    </fieldset>
  )
}
