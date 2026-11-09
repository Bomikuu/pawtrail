import type { ComponentProps } from 'react'
import { Button } from './button'
/** External/document action composed with the official shadcn Button. */
export function ButtonAnchor({
  variant,
  size,
  className,
  ...props
}: ComponentProps<'a'> &
  Pick<ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a {...props} />
    </Button>
  )
}
