import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { AnimalLoader } from './animal-loader'
import { cn } from '@/lib/utils'

/** Product loading feedback composed with the official shadcn Button. */
export function LoadingButton({
  loading = false,
  children,
  className,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, 'asChild'> & { loading?: boolean }) {
  return (
    <Button
      {...props}
      disabled={loading || disabled}
      aria-busy={loading}
      className={cn('relative', className)}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center gap-2',
          loading && 'invisible',
        )}
      >
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <AnimalLoader compact label="Working…" />
        </span>
      )}
    </Button>
  )
}
