import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

/** Shared map-detail frame; each entity keeps its own content and actions. */
export function DetailDrawer({
  title,
  summary,
  description,
  portrait,
  status,
  open,
  onClose,
  children,
}: {
  title: string
  summary: string
  description: string
  portrait?: ReactNode
  status?: ReactNode
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  return (
    <Sheet
      open={open}
      modal={false}
      onOpenChange={(value) => {
        if (!value) onClose()
      }}
    >
      <SheetContent
        side="right"
        inert={!open}
        showCloseButton={false}
        className="pawtrail-game inset-y-0 z-40 h-dvh w-full max-w-[28rem] gap-0 overflow-hidden border-l bg-card p-0 text-foreground sm:max-w-[28rem] data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none motion-reduce:transition-none"
        onInteractOutside={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          heading.current?.focus({ preventScroll: true })
        }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader
          className={
            'relative shrink-0 flex-row gap-4 border-b p-4 pr-12 sm:p-5 sm:pr-12 ' +
            (portrait ? 'items-center' : 'items-start')
          }
        >
          {portrait}
          <div className="min-w-0 flex-1">
            <SheetTitle
              ref={heading}
              tabIndex={-1}
              className="font-heading text-3xl font-bold leading-tight outline-none [overflow-wrap:anywhere]"
            >
              {title}
            </SheetTitle>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {summary}
            </p>
            {status && <div className="mt-3">{status}</div>}
            <SheetDescription className="sr-only">
              {description}
            </SheetDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 shrink-0 rounded-md"
            aria-label="Close details"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
