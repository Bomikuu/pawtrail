import Link from 'next/link'
import type { ComponentProps } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from './button'
import { cn } from '@/lib/utils'
import { LinkPending } from '@/components/layout/link-pending'
/** Internal route action. Ordinary navigation should use Link directly. */
export function ButtonLink({
  className,
  variant,
  children,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      data-slot="button-link"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    >
      {children}
      <LinkPending />
    </Link>
  )
}
