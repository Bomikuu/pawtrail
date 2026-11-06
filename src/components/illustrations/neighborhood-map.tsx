import { PawMarker } from './paw-marker'
/** Diagram only: no coordinates, real map tiles, or claims about an animal's location. */
export function NeighborhoodMap({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`neighborhood-map [.hero-composition_&]:absolute [.hero-composition_&]:[inset:1rem_0_4rem] [.hero-composition_&]:min-h-0 relative min-h-80 overflow-hidden bg-border rounded-[var(--radius)] [border:1px_solid_var(--border)] [&_>_svg:first-child]:absolute [&_>_svg:first-child]:w-full [&_>_svg:first-child]:h-full ${compact ? 'map-compact' : ''}`}
      role="img"
      aria-label="Illustrative neighborhood map with paw markers; not a live map or exact animal locations"
    >
      <svg viewBox="0 0 500 320" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 90H500M0 245H500M105 0V320M320 0V320"
          stroke="var(--surface)"
          strokeWidth="24"
        />
        <path
          d="M410 0C300 120 500 160 390 320"
          stroke="var(--teal)"
          strokeOpacity=".16"
          strokeWidth="34"
          fill="none"
        />
        <path
          d="M0 90H500M0 245H500M105 0V320M320 0V320"
          stroke="var(--border)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <span
        className={
          'map-place absolute top-[15%] left-[28%] text-[0.8125rem] text-foreground'
        }
      >
        Neighborhood park
      </span>
      <PawMarker
        className={
          'map-paw absolute w-[2.2rem] h-[2.6rem] map-paw-one top-[35%] left-[19%]'
        }
      />
      <PawMarker
        className={
          'map-paw absolute w-[2.2rem] h-[2.6rem] map-paw-two top-[57%] right-[21%]'
        }
      />
      <span
        className={
          'map-caption absolute bottom-[0.6rem] left-3 right-3 text-xs text-foreground bg-background [padding:0.25rem_0.5rem] rounded-[0.375rem]'
        }
      >
        Illustrative map · approximate areas only
      </span>
    </div>
  )
}
