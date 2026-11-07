'use client'

import { useState } from 'react'
import { Check, ChevronDown, PawPrint } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { avatarPresets, getAvatarPreset } from '@/features/users/avatar-presets'
import { cn } from '@/lib/utils'

const featuredAvatars = [
  avatarPresets[0],
  avatarPresets[3],
  avatarPresets[18],
  avatarPresets[26],
]

export function RegistrationAvatarPicker({
  value,
  onChange,
  disabled,
}: {
  value: string | undefined
  onChange(id: string): void
  disabled: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const selected = getAvatarPreset(value) ?? avatarPresets[0]

  return (
    <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
      <legend className="sr-only">Profile avatar</legend>
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-7">
        <Avatar className="row-span-1 size-20 border-4 border-card bg-[#fff0e2] ring-1 ring-border sm:row-span-2 sm:size-28">
          <AvatarImage src={selected.src} alt={`${selected.label} profile avatar`} />
          <AvatarFallback><PawPrint aria-hidden="true" className="size-8 text-primary" /></AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-heading text-lg font-semibold">Profile avatar</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Pick a little personality. You can change it later.
          </p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
          {featuredAvatars.map((avatar) => (
            <Button
              key={avatar.id}
              type="button"
              variant="outline"
              className={cn(
                'relative size-12 rounded-xl bg-transparent p-1 shadow-none',
                value === avatar.id && 'border-primary bg-primary/5 ring-1 ring-primary',
              )}
              aria-label={`Choose ${avatar.label}`}
              aria-pressed={value === avatar.id}
              disabled={disabled}
              onClick={() => onChange(avatar.id)}
            >
              <Avatar className="size-9">
                <AvatarImage src={avatar.src} alt="" />
                <AvatarFallback><PawPrint aria-hidden="true" className="size-4" /></AvatarFallback>
              </Avatar>
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-11 gap-1.5 px-2 text-xs text-muted-foreground"
            aria-expanded={expanded}
            aria-controls="registration-avatar-options"
            disabled={disabled}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? 'Show less' : 'View all'}
            <ChevronDown aria-hidden="true" className={cn('size-3.5', expanded && 'rotate-180')} />
          </Button>
        </div>
      </div>
      {expanded && (
        <div
          id="registration-avatar-options"
          role="group"
          aria-label="All illustrated avatars"
          className="mt-5 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto overscroll-contain p-1 sm:grid-cols-8"
        >
          {avatarPresets.map((avatar) => (
            <Button
              key={avatar.id}
              type="button"
              variant="ghost"
              className={cn(
                'relative h-auto min-w-0 rounded-xl border border-transparent p-1.5',
                value === avatar.id && 'border-primary bg-primary/5',
              )}
              aria-label={`Choose ${avatar.label}`}
              aria-pressed={value === avatar.id}
              disabled={disabled}
              onClick={() => onChange(avatar.id)}
            >
              <Avatar className="aspect-square h-auto w-full">
                <AvatarImage src={avatar.src} alt="" loading="lazy" />
                <AvatarFallback><PawPrint aria-hidden="true" className="size-5" /></AvatarFallback>
              </Avatar>
              {value === avatar.id && (
                <span className="absolute right-0.5 bottom-0.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden="true" className="size-3" />
                </span>
              )}
            </Button>
          ))}
        </div>
      )}
    </fieldset>
  )
}
