'use client'
import { useRef, useState, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: ReactElement
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void> | void
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const busy = useRef(false)
  async function confirm() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(false)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      setError(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy.current) {
          setOpen(next)
          setError(false)
        }
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault()
        }}
      >
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        {error && (
          <p role="alert">Couldn’t complete this action. Please try again.</p>
        )}
        <div className={'dialog-actions flex gap-3 justify-end flex-wrap mt-6'}>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button disabled={pending} onClick={() => void confirm()}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
