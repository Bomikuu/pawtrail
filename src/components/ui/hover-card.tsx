'use client'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger
export function HoverCardContent({
  className,
  children,
  ...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        sideOffset={10}
        collisionPadding={12}
        align="start"
        className={cn('ui-hover-card', className)}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  )
}
