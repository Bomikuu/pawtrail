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
      className={`animal-loader${compact ? ' animal-loader-compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="animal-loader-symbol" aria-hidden="true">
        <PawPrint size={compact ? 18 : 30} />
        <span className="animal-loader-orbit" />
      </span>
      <span className={compact ? 'sr-only' : 'animal-loader-label'}>
        {label}
      </span>
    </span>
  )
}
