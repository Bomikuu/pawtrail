import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
export function Progress({ className, ...props }: ComponentProps<'progress'>) {
  return <progress className={cn('ui-progress', className)} {...props} />
}
