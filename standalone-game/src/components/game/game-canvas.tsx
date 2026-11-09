import { loadGameFonts } from "@/game/font-loader";
import { useEffect, useRef } from "react";
import { publish } from "@/game/store";
export function GameCanvas({ attempt }: { attempt: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const failed = (event: Event) => {
      sessionStorage.setItem("pawtrail:canvas-recovery", "1");
      publish({ phase: "error", error: String((event as CustomEvent).detail) });
    };
    window.addEventListener("pawtrail:renderer-error", failed);
    let canceled = false,
      release: (() => void) | undefined;
    publish({ phase: "loading", load: 0, error: "" });
    Promise.all([import("@/game/runtime/session"), loadGameFonts()])
      .then(async ([{ mountWorld, resetWorldRenderer }]) => {
        if (canceled || !host.current) return;
        if (attempt) resetWorldRenderer();
        const cleanup = await mountWorld(host.current, "World");
        if (canceled) cleanup();
        else release = cleanup;
      })
      .catch(() =>
        publish({
          phase: "error",
          error: "The neighborhood could not start. Try again.",
        }),
      );
    return () => {
      canceled = true;
      window.removeEventListener("pawtrail:renderer-error", failed);
      release?.();
    };
  }, [attempt]);
  return (
    <div ref={host} className="absolute inset-0 overflow-hidden bg-[#6a9039]" />
  );
}
