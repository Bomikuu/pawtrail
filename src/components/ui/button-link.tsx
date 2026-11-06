import type Link from 'next/link'
import { NavigationLink } from '@/components/layout/navigation-link'
import type { ComponentProps } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
/** Internal route action. Ordinary navigation should use Link directly. */
export function ButtonLink({
  className,
  variant,
  children,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <NavigationLink
      data-slot="button-link"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    >
      {children}
    </NavigationLink>
  )
}
