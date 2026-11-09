"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, Gamepad2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearGameReturn, gameHref, readGameReturn } from "@/game/platform";

/** Only the originating browser tab receives a return link; no arbitrary redirect URL is stored. */
export function GameReturnLink() {
  const pathname = usePathname();
  const [animalId, setAnimalId] = useState<string | null>(null);
  useEffect(() => {
    setAnimalId(readGameReturn());
  }, [pathname]);
  if (!animalId || pathname === "/play" || pathname.startsWith("/play/"))
    return null;
  return (
    <aside
      className="fixed bottom-20 left-3 z-40 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl border bg-background p-2 text-foreground shadow-lg md:bottom-4 md:left-4"
      aria-label="Return to your game"
    >
      <Button asChild variant="ghost" className="gap-2">
        <a href={gameHref(animalId)}>
          <ArrowLeft className="size-4" />
          <Gamepad2 className="size-4" />
          <span>Return to neighborhood</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Dismiss game return link"
        onClick={() => {
          clearGameReturn();
          setAnimalId(null);
        }}
      >
        <X className="size-4" />
      </Button>
    </aside>
  );
}
