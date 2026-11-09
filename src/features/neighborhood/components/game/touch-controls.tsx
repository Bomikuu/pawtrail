import { useEffect, useState, type PointerEvent } from "react";
import { Hand, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { send } from "@/features/neighborhood/game/store";
export function TouchControls({
  disabled,
  onMove,
  onInteract,
}: {
  disabled: boolean;
  onMove?: (x: number, y: number) => void;
  onInteract?: () => void;
}) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const stop = () => {
    setKnob({ x: 0, y: 0 });
    if (onMove) onMove(0, 0);
    else send({ type: "move", x: 0, y: 0 });
  };
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const r = e.currentTarget.getBoundingClientRect(),
      x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2,
      length = Math.hypot(x, y),
      scale = length > 34 ? 34 / length : 1;
    setKnob({ x: x * scale, y: y * scale });
    if (onMove) onMove((x * scale) / 34, (y * scale) / 34);
    else send({ type: "move", x: (x * scale) / 34, y: (y * scale) / 34 });
  };
  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 flex items-end justify-between md:hidden"
      aria-label="Touch controls"
    >
      <div
        className={
          "pointer-events-auto relative grid size-28 touch-none place-items-center rounded-full border-2 border-[#d5c5a8] bg-card/90 select-none " +
          (disabled ? "opacity-50" : "")
        }
        role="application"
        aria-label="Movement joystick. Drag in a direction to walk."
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <Move className="size-7 text-muted-foreground opacity-50" />
        <span
          className="absolute grid size-12 place-items-center rounded-full border bg-secondary shadow-sm"
          style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}
        >
          <span className="size-3 rounded-full bg-primary/70" />
        </span>
      </div>
      <Button
        disabled={disabled}
        className="pointer-events-auto size-14 rounded-md border-2 border-[#fff8ed] shadow-md"
        size="icon"
        onClick={() => (onInteract ? onInteract() : send({ type: "interact" }))}
        aria-label="Interact with the closest animal, person, or object"
      >
        <Hand className="size-6" />
      </Button>
    </div>
  );
}
