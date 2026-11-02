'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { X } from 'lucide-react'
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export function DialogContent({
  className,
  children,
  closeLabel = 'Close',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-overlay" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn('ui-dialog', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            variant="outline"
            className="ui-dialog-close"
            aria-label={closeLabel}
          >
            <X aria-hidden="true" size={20} />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
export function DialogTitle(
  props: ComponentProps<typeof DialogPrimitive.Title>,
) {
  return <DialogPrimitive.Title className="ui-dialog-title" {...props} />
}
export function DialogDescription(
  props: ComponentProps<typeof DialogPrimitive.Description>,
) {
  return <DialogPrimitive.Description className="ui-description" {...props} />
}
