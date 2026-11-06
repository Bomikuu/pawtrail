import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { AnimalLoader } from '@/components/shared/animal-loader'
export const buttonVariants = cva('ui-button', {
  variants: {
    variant: {
      default: 'ui-button-primary',
      outline: 'ui-button-outline',
      ghost: 'ui-button-ghost',
    },
  },
  defaultVariants: { variant: 'default' },
})
export function Button({
  className,
  variant,
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'
  const busy = !asChild && loading
  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, className }),
        busy && 'ui-button-loading',
      )}
      {...props}
      aria-busy={busy || props['aria-busy']}
      disabled={busy || props.disabled}
    >
      {busy ? (
        <>
          {children}
          <span className="button-loading-indicator">
            <AnimalLoader compact label="Working…" />
          </span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}
