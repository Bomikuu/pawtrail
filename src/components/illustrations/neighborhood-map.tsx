import { PawMarker } from './paw-marker'
/** Diagram only: no coordinates, real map tiles, or claims about an animal's location. */
export function NeighborhoodMap({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`neighborhood-map ${compact ? 'map-compact' : ''}`}
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
      <span className="map-place">Neighborhood park</span>
      <PawMarker className="map-paw map-paw-one" />
      <PawMarker className="map-paw map-paw-two" />
      <span className="map-caption">
        Illustrative map · approximate areas only
      </span>
    </div>
  )
}
