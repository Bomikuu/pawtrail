import type { ComponentProps, ReactNode } from "react";
import { Heart, PawPrint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const art = "/pawtrail-game/game-assets/dialogue-ui-v1/";

/** Authored game artwork around the official, focus-managed shadcn dialog. */
export function InteractionDialog({
  open,
  onClose,
  title,
  subtitle,
  portrait,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  portrait: ReactNode;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="isolate max-h-[90dvh] w-[calc(100%-1.25rem)] max-w-[68rem] gap-0 overflow-y-auto rounded-md border-[14px] border-transparent bg-[#fff2dc] p-4 text-[#45291e] shadow-2xl selection:bg-[#efc178] selection:text-[#45291e] motion-reduce:animate-none sm:max-w-[68rem] sm:p-7 lg:p-9"
        style={{
          borderImage: `url(${art}parchment.png) 32 fill / 14px / 0 stretch`,
        }}
      >
        <div className="relative z-10 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-4 gap-y-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-6 md:grid-cols-[224px_minmax(0,1fr)] md:items-start md:gap-x-8 lg:grid-cols-[256px_minmax(0,1fr)]">
          <div className="self-start md:row-span-2 md:pt-3">{portrait}</div>
          <header className="min-w-0 pr-6 sm:pr-8">
            <div
              className="flex min-h-20 max-w-[29rem] items-center gap-3 bg-contain bg-center bg-no-repeat px-5 pt-7 pb-3 sm:min-h-24 sm:px-7"
              style={{
                backgroundImage: `url(${art}nameplate.png)`,
                backgroundSize: "100% 100%",
              }}
            >
              <PawPrint
                aria-hidden="true"
                className="hidden size-8 shrink-0 fill-[#fff1d7] text-[#fff1d7] sm:block"
              />
              <DialogTitle className="break-words font-heading text-3xl leading-tight font-bold tracking-wide text-[#fff6e6] [text-shadow:1px_2px_0_#65321e] sm:text-4xl lg:text-5xl">
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="mt-2 flex w-fit max-w-full items-center gap-2 rounded-md border border-[#d99b53] bg-[#ffe1ad] px-3 py-1.5 text-xs leading-snug font-semibold text-[#68401f] sm:text-sm">
              <Heart
                aria-hidden="true"
                className="size-4 shrink-0 fill-[#eaa642] text-[#a05c23]"
              />
              {subtitle}
            </DialogDescription>
          </header>
          <div
            className="relative col-span-2 min-h-36 border-[10px] border-transparent bg-[#fff7e9] p-3 sm:min-h-44 sm:p-4 md:col-span-1"
            style={{
              borderImage: `url(${art}speech.png) 24 fill / 10px / 0 stretch`,
            }}
          >
            <PawPrint
              aria-hidden="true"
              className="pointer-events-none absolute right-3 bottom-3 size-9 fill-[#bd8749]/15 text-transparent"
            />
            <div className="relative z-10">{children}</div>
          </div>
        </div>
        <div className="relative z-10 mt-6 flex min-h-20 flex-wrap items-end justify-end gap-3 pb-1 md:mt-8 md:pl-64">
          {actions}
        </div>
        <img
          src={art + "garden.png"}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute bottom-1 left-1 z-0 hidden w-[34%] max-w-[23rem] [image-rendering:pixelated] md:block"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close interaction"
          className="absolute top-0 right-0 z-20 size-10 rounded-md border-2 border-[#805132] bg-[#ffe5b5] text-[#59341f] hover:bg-[#f3ce93] hover:text-[#45291e] focus-visible:ring-[#694b2d] sm:top-1 sm:right-1"
        >
          <X className="size-6 stroke-[3]" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/** Game presentation only; action semantics and state stay in the registry Button. */
export function InteractionAction({
  className = "",
  style,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      style={{
        borderImage: `url(${art}action.png) 24 fill / 10px / 0 stretch`,
        ...style,
      }}
      className={`h-auto min-h-14 max-w-full gap-3 rounded-md border-[10px] border-transparent bg-[#e98919] px-4 py-2 text-base leading-snug font-bold whitespace-normal text-[#fff7e5] [-webkit-text-stroke:2px_#87421e] [paint-order:stroke_fill] transition-[filter,transform] hover:bg-[#e98919] hover:brightness-110 focus-visible:ring-[#694b2d] active:translate-y-px disabled:opacity-60 sm:min-h-16 sm:px-6 sm:text-xl ${className}`}
    >
      {children}
    </Button>
  );
}

export function InteractionPortrait({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-sm border-[10px] border-transparent bg-[#b9e5ed] [image-rendering:pixelated] sm:border-[12px]"
      style={{
        borderImage: `url(${art}portrait-frame.png) 24 / 12px / 0 stretch`,
      }}
    >
      <img
        src="/assets/game/community/tree.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute right-[-15%] bottom-0 h-[90%] w-auto opacity-70 [image-rendering:pixelated]"
      />
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#a9bf60]" />
      <div className="relative z-10 flex size-full items-end justify-center">
        {children}
      </div>
    </div>
  );
}
