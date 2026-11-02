'use client'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { profileBanners, getProfileBanner } from './banner-presets'
import { ProfileBanner } from './profile-banner'
export function BannerPicker({
  value,
  onChange,
  disabled = false,
  kind = 'person',
}: {
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  kind?: 'person' | 'animal'
}) {
  const selected = getProfileBanner(value)
  return (
    <fieldset
      className="profile-banner-picker"
      id="profile-banner-picker"
      disabled={disabled}
    >
      <legend>
        {kind === 'animal'
          ? 'Choose this pet’s cover'
          : 'Choose your profile banner'}
      </legend>
      <div className="profile-banner-preview">
        <ProfileBanner id={selected.id} />
        <span>{selected.label}</span>
      </div>
      <div
        className="profile-banner-options"
        role="group"
        aria-label="Illustrated profile banners"
      >
        {profileBanners.map((banner) => (
          <Button
            key={banner.id}
            type="button"
            variant="ghost"
            className="profile-banner-option"
            aria-pressed={selected.id === banner.id}
            aria-label={banner.label + ': ' + banner.description}
            onClick={() => onChange(banner.id)}
          >
            <ProfileBanner id={banner.id} preview />
            <span>
              {banner.label}
              {selected.id === banner.id && (
                <Check size={16} aria-hidden="true" />
              )}
            </span>
          </Button>
        ))}
      </div>
      <p className="field-help">
        {kind === 'animal'
          ? 'Submit changes for review to apply this cover. Pet profile edits remain private until publication is approved.'
          : 'Save your profile to apply your choice. Banners are visible on your public profile; your privacy settings still apply.'}
      </p>
    </fieldset>
  )
}
