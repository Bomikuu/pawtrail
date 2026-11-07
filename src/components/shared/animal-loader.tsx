import { PawPrint } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AnimalLoader({
  label = 'Finding your next pawprint…',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'animal-loader inline-flex flex-col items-center gap-3.5 p-4 text-[color:var(--teal)]',
        compact && 'animal-loader-compact flex-row gap-0 p-0 align-middle',
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'animal-loader-symbol relative inline-grid size-16 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-800 motion-safe:animate-pulse dark:bg-orange-950/50 dark:text-orange-300',
          compact &&
            'size-5.5 bg-transparent text-current dark:bg-transparent dark:text-current',
        )}
        aria-hidden="true"
      >
        <PawPrint className={compact ? 'size-4' : 'size-7'} />
        <span
          className={cn(
            'absolute -inset-[3px] rounded-full border-2 border-orange-200 border-t-orange-600 motion-safe:animate-spin dark:border-orange-900 dark:border-t-orange-400 forced-colors:border-[CanvasText] forced-colors:border-t-[Highlight]',
            compact && '-inset-0.5 border',
          )}
        />
      </span>
      <span
        className={
          compact
            ? 'sr-only'
            : 'text-center text-sm leading-relaxed text-muted-foreground'
        }
      >
        {label}
      </span>
    </span>
  )
}
