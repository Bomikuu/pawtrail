'use client'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger
export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn('ui-menu', className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  )
}
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn('ui-menu-item', className)}
      {...props}
    />
  )
}
export function DropdownMenuSeparator(
  props: ComponentProps<typeof DropdownPrimitive.Separator>,
) {
  return (
    <DropdownPrimitive.Separator className="ui-menu-separator" {...props} />
  )
}
