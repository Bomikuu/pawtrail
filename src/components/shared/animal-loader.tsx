import { PawPrint } from 'lucide-react'

export function AnimalLoader({
  label = 'Finding your next pawprint…',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <span
      className={`animal-loader inline-flex flex-col items-center gap-3.5 p-4 text-[color:var(--teal)] [.data-state_>_&]:flex [.data-state_>_&]:mb-3 [.profile-preview_>_&]:flex [.profile-preview_>_&]:min-h-40 [.profile-preview_>_&]:justify-center${compact ? ' animal-loader-compact p-0 flex-row gap-0 [vertical-align:middle]' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={
          'animal-loader-symbol relative inline-grid [place-items:center] w-16 h-16 rounded-full bg-[#fff0df] text-[#a64613] [.animal-loader-compact_&]:w-5.5 [.animal-loader-compact_&]:h-5.5 [.animal-loader-compact_&]:bg-[transparent] [.animal-loader-compact_&]:text-[color:var(--teal)] [.button-loading-indicator_&]:text-foreground [@media(forced-colors:_active)]:[border:1px_solid_CanvasText] [@media(forced-colors:_active)]:text-[CanvasText] [@media(forced-colors:_active)]:[.button-loading-indicator_&]:text-[CanvasText] [.dark_&]:bg-[#302116] [.dark_&]:text-[#ffb27d] [.dark_.animal-loader-compact_&]:bg-[transparent]'
        }
        aria-hidden="true"
      >
        <PawPrint size={compact ? 18 : 30} />
        <span
          className={
            'animal-loader-orbit absolute [inset:-3px] [border:2px_solid_#eedaca] [border-top-color:#e96b19] rounded-full [animation:paw-orbit_900ms_linear_infinite] [.animal-loader-compact_&]:[inset:-2px] [.animal-loader-compact_&]:[border-width:1px] motion-reduce:[animation:none] [@media(forced-colors:_active)]:border-[CanvasText] [.dark_&]:border-[#48413a] [.dark_&]:[border-top-color:#f97316]'
          }
        />
      </span>
      <span
        className={
          compact
            ? 'sr-only'
            : 'animal-loader-label text-muted-foreground text-sm text-center [line-height:1.5]'
        }
      >
        {label}
      </span>
    </span>
  )
}
