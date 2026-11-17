import { useRef, type ComponentProps, type ReactNode } from 'react'
import { Diamond, PawPrint, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

import { DIALOGUE_ART as art, dialogueFrame as frame } from './dialogue-frame'

/** Texture decorates the registry Button; labels, focus and actions remain live UI. */
export function DialogueNextButton({ className = '', style, ...props }: ComponentProps<typeof Button>) {
  return <Button
    {...props}
    style={{ ...frame('action', 16), ...style }}
    className={'h-auto min-h-9 min-w-20 max-w-full gap-1.5 whitespace-normal rounded-md border-[7px] border-transparent bg-[#ad571c] bg-clip-padding px-2 py-0.5 text-sm font-medium leading-tight text-[#fff3d9] [image-rendering:pixelated] [text-shadow:0_1px_0_#783813] transition-[filter,transform] hover:bg-[#ad571c] hover:brightness-110 focus-visible:ring-[#8b542a] active:translate-y-px sm:min-h-9 sm:min-w-24 sm:text-base ' + className}
  />
}

export function DialoguePageProgress({ current, total }: { current: number; total: number }) {
  const start = Math.max(0, Math.min(current - 3, total - 5))
  return <div className="flex items-center gap-1.5 text-[#795033]" aria-label={`Part ${current} of ${total}`}>
    <span aria-hidden="true" className="hidden items-center gap-1 min-[400px]:flex">
      {Array.from({ length: Math.min(total, 5) }, (_, index) => {
        const page = start + index + 1
        return <Diamond key={page} className={'size-2.5 stroke-[2.5] sm:size-3 ' + (page === current ? 'fill-[#e5a34f] text-[#a25e27]' : page < current ? 'fill-[#ac7847] text-[#895a32]' : 'fill-transparent text-[#b7956e]')} />
      })}
    </span>
    <span className="whitespace-nowrap text-xs font-medium tabular-nums sm:text-sm">{current} / {total}</span>
  </div>
}

/** Shared reference-guided parchment HUD; the conversation owns all progression. */
export function DialogueHud({
  title, subtitle, portrait, children, actions, progress, portraitControls, onClose, bodyFont = false,
}: {
  title: string
  subtitle: string
  portrait: ReactNode
  children: ReactNode
  actions: ReactNode
  progress?: ReactNode
  portraitControls?: ReactNode
  onClose: () => void
  bodyFont?: boolean
}) {
  const returnFocus = useRef(typeof document !== 'undefined' ? document.activeElement : null)
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/15 motion-reduce:animate-none"
        onCloseAutoFocus={event => {
          const target = returnFocus.current
          if (target instanceof HTMLElement && target.isConnected && target !== document.body) {
            event.preventDefault()
            target.focus({ preventScroll: true })
          }
        }}
        className="top-auto bottom-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[65dvh] w-[calc(100%-1rem)] max-w-[52rem] translate-y-0 gap-0 overflow-y-auto rounded-md border-[12px] border-transparent bg-[#fff0d1] bg-clip-padding p-2 text-[#57331d] shadow-xl selection:bg-[#e9bd7b] selection:text-[#45291e] [font-family:var(--font-dialogue)] [image-rendering:pixelated] data-[state=open]:slide-in-from-bottom-2 motion-reduce:animate-none sm:w-[calc(100%-2rem)] sm:max-w-[52rem] sm:border-[14px] sm:p-2"
        style={{...frame('panel', 24),...(bodyFont?{fontFamily:'var(--font-sans)'}:{})}}
      >
        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[208px_minmax(0,1fr)] sm:gap-4">
          <div className="self-start">
            <div className="relative h-[136px] w-28 sm:h-64 sm:w-52 overflow-hidden rounded-md border-[8px] border-transparent bg-[#edc997] bg-clip-padding" style={frame('portrait', 16)}>
              {portrait}
            </div>
            {portraitControls && <div className="mt-2">{portraitControls}</div>}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <header className="min-w-0 pr-8">
              <div className="flex min-h-8 w-fit min-w-0 max-w-[16rem] items-center gap-2 bg-[length:100%_100%] bg-no-repeat py-1 pr-6 pl-3 sm:gap-2" style={{ backgroundImage: `url(${art}ribbon.png)` }}>
                <PawPrint aria-hidden="true" className="size-4 shrink-0 fill-[#ffe7b0] text-[#ffe7b0]" />
                <DialogTitle style={bodyFont?{fontFamily:'var(--font-heading)'}:undefined} className="min-w-0 break-words text-lg font-medium leading-tight text-[#fff2d4] [text-shadow:0_1px_0_#71361f] sm:text-xl">{title}</DialogTitle>
              </div>
              <DialogDescription className="sr-only">{subtitle}</DialogDescription>
            </header>
            <div className="relative min-h-24 min-w-0 flex-1 rounded-md border-[8px] border-transparent bg-[#fff1d9] bg-clip-padding px-1 py-1 sm:px-2 sm:py-1.5" style={frame('speech', 16)}>
              <svg aria-hidden="true" viewBox="0 0 16 28" shapeRendering="crispEdges" className="pointer-events-none absolute -left-[15px] top-4 h-5 w-3">
                <path d="M16 0H13V5H10V8H6V11H2V13H0V15H2V17H6V20H10V23H13V28H16" fill="#fbe8c9" stroke="#b38a5e" strokeWidth="2" />
                <path d="M15 2V26" stroke="#fbe8c9" strokeWidth="3" />
              </svg>
              <PawPrint aria-hidden="true" className="pointer-events-none absolute right-2 bottom-2 size-5 fill-[#c99351]/15 text-transparent sm:right-2 sm:size-6" />
              <div className="relative z-10 min-w-0 break-words">{children}</div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
              {progress}
              <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>
            </div>
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close conversation" style={frame('close', 8)} className="absolute top-1 right-1 size-8 rounded-md border-[5px] border-transparent bg-[#ffe8bd] bg-clip-padding p-0 text-[#8a542e] hover:bg-[#ffe8bd] hover:brightness-110 focus-visible:ring-[#9a652f] sm:top-1 sm:right-1 sm:size-8">
          <X className="size-4 stroke-[3]" aria-hidden="true" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
