'use client'
import { Toaster as Sonner } from 'sonner'
export { toast } from 'sonner'
export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton
      gap={12}
      toastOptions={{ className: 'ui-toast' }}
    />
  )
}
