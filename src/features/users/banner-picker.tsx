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
      className={
        'profile-banner-picker min-w-0 p-0 [margin:0_0_1.5rem] [border:0] [scroll-margin-top:6rem] [&_legend]:font-[800] [&_legend]:text-lg [&_legend]:leading-[1.35] [&_legend]:font-heading [&_legend]:mb-3'
      }
      id="profile-banner-picker"
      disabled={disabled}
    >
      <legend>
        {kind === 'animal'
          ? 'Choose this pet’s cover'
          : 'Choose your profile banner'}
      </legend>
      <div
        className={
          'profile-banner-preview relative h-40 overflow-hidden rounded-xl bg-[#e2eddd] mb-3 [&_>_span]:absolute [&_>_span]:bottom-2 [&_>_span]:left-2 [&_>_span]:[padding:0.25rem_0.5rem] [&_>_span]:bg-[#fffaf1] [&_>_span]:text-foreground [&_>_span]:rounded-[0.375rem] [&_>_span]:text-xs [&_>_span]:[font-weight:650] max-[48rem]:h-32'
        }
      >
        <ProfileBanner id={selected.id} />
        <span>{selected.label}</span>
      </div>
      <div
        className={'profile-banner-options grid grid-cols-2 gap-3'}
        role="group"
        aria-label="Illustrated profile banners"
      >
        {profileBanners.map((banner) => (
          <Button
            key={banner.id}
            type="button"
            variant="ghost"
            className={
              'profile-banner-option [.profile-banner-options_&]:flex [.profile-banner-options_&]:flex-col [.profile-banner-options_&]:items-stretch [.profile-banner-options_&]:gap-0 [.profile-banner-options_&]:h-auto [.profile-banner-options_&]:min-h-11 [.profile-banner-options_&]:p-0 [.profile-banner-options_&]:overflow-hidden [.profile-banner-options_&]:[border:2px_solid_transparent] [.profile-banner-options_&]:rounded-xl [.profile-banner-options_&]:bg-[#fffaf1] [.profile-banner-options_&]:text-foreground [.profile-banner-options_&]:text-left [.profile-banner-options_&]:whitespace-normal [.profile-banner-options_&:hover]:bg-[#f4ead9] [.profile-banner-options_&[aria-pressed=true]]:border-[color:var(--teal)] [.profile-banner-options_&[aria-pressed=true]]:bg-[#e6f1eb] [&_>_img]:[aspect-ratio:3_/_1] [&_>_img]:h-auto [&_>_img]:w-full [&_>_span]:flex [&_>_span]:justify-between [&_>_span]:items-center [&_>_span]:gap-2 [&_>_span]:p-2.5 [&_>_span]:text-xs [&_>_span_>_svg]:text-[color:var(--teal)] [&_>_span_>_svg]:shrink-0 [@media(forced-colors:_active)]:[.profile-banner-options_&[aria-pressed=true]]:[outline:2px_solid_Highlight]'
            }
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
      <p
        className={
          'field-help text-sm text-muted-foreground m-0 [.avatar-picker_>_&]:m-0 [.avatar-picker_>_&]:max-w-[65ch] [.avatar-picker_>_&]:text-xs [.achievement-proof-form_&]:text-xs'
        }
      >
        {kind === 'animal'
          ? 'Submit changes for review to apply this cover. Pet profile edits remain private until publication is approved.'
          : 'Save your profile to apply your choice. Banners are visible on your public profile; your privacy settings still apply.'}
      </p>
    </fieldset>
  )
}
