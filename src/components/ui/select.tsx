import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
/** Native keyboard and mobile-picker semantics in the canonical control layer. */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn('ui-input', className)} {...props} />
}
