'use client'
import * as AlertPrimitive from '@radix-ui/react-alert-dialog'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
export const AlertDialog = AlertPrimitive.Root
export const AlertDialogTrigger = AlertPrimitive.Trigger
export const AlertDialogCancel = AlertPrimitive.Cancel
export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertPrimitive.Content>) {
  return (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className="ui-overlay" />
      <AlertPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn('ui-dialog ui-confirm', className)}
        {...props}
      />
    </AlertPrimitive.Portal>
  )
}
export function AlertDialogTitle(
  props: ComponentProps<typeof AlertPrimitive.Title>,
) {
  return <AlertPrimitive.Title className="ui-dialog-title" {...props} />
}
export function AlertDialogDescription(
  props: ComponentProps<typeof AlertPrimitive.Description>,
) {
  return <AlertPrimitive.Description className="ui-description" {...props} />
}
