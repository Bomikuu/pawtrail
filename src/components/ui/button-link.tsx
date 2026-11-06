import type { ComponentProps } from 'react'
import type Link from 'next/link'
import { Button } from './button'
import { NavigationLink } from '@/components/layout/navigation-link'
/** Route action composed with the official shadcn Button. */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <NavigationLink {...props} className={className} />
    </Button>
  )
}
