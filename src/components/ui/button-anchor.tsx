import type { ComponentProps } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
export function ButtonAnchor({
  className,
  variant,
  ...props
}: ComponentProps<'a'> & VariantProps<typeof buttonVariants>) {
  return (
    <a
      data-slot="button-anchor"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}
