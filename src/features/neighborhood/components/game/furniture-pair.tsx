import { useEffect, useRef, useState } from "react"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PixelFurniture } from "@/features/neighborhood/game/furniture/renderer"
import {
  furnitureDefinitions,
  projectedGeometry,
  facingLabel,
  type CouchStyle,
  type FurnitureDefinition,
} from "@/features/neighborhood/game/furniture/model"
import { PixelActor, humanClips } from "@/features/neighborhood/game/actor-rig/pixel-renderer"
import { characterCreator } from "@/features/neighborhood/game/creator/state"
import { loadGameFonts } from "@/features/neighborhood/game/font-loader"
import couchReference from "@/features/neighborhood/game/furniture/references/couch.json"
import { furnitureTurnaround } from "@/features/neighborhood/game/furniture/references/turnarounds"

function referenceView(definition: FurnitureDefinition, rotation: number) {
  const references = furnitureTurnaround(definition.model)?.referenceViews
  if (references)
    return references[String(rotation)] ?? references["0"]
  return { file: definition.reference, ...definition.referenceFrame,
    label: "Original front view" }
}

export function FurniturePair({
  rotation,
  style,
  seat,
  geometry,
  reduced,
  definition = furnitureDefinitions[0],
  onRotate,
}: {
  rotation: number
  style: CouchStyle
  seat: number
  geometry: boolean
  reduced: boolean
  definition?: FurnitureDefinition
  onRotate?: () => void
}) {
  const original = useRef<HTMLCanvasElement>(null),
    current = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null)
  const settings = useRef({ rotation, style, seat, geometry, reduced })
  settings.current = { rotation, style, seat, geometry, reduced }
  const [zoom, setZoom] = useState(2),
    [error, setError] = useState("")
  const [height, setHeight] = useState(50)
  useEffect(() => {
    const target = host.current
    if (!target) return
    let stopped = false
    const resize = () => {
      if (stopped) return
      setZoom(
        Math.max(
          1,
          Math.min(
            4,
            Math.floor(
              Math.min(
                (target.clientWidth - 48) / 192,
                (target.clientHeight - 60) / 112,
              ),
            ),
          ),
        ),
      )
    }
    const o = new ResizeObserver(resize)
    o.observe(target)
    resize()
    return () => {
      stopped = true
      o.disconnect()
    }
  }, [])
  useEffect(() => {
    let renderer: PixelFurniture | undefined,
      actor: PixelActor | undefined,
      frame = 0,
      stopped = false,
      last = 0,
      styleKey = ""
    const photos = new Map<number, HTMLImageElement>(),
      actorCanvas = document.createElement("canvas"),
      views = new Map<number, ReturnType<typeof projectedGeometry>>()
    const referenceFront = document.createElement("canvas")
    referenceFront.width = 64
    referenceFront.height = 64
    if (definition.model === "couch") {
      const pixels = new ImageData(64, 64)
      for (const name of ["leftArm", "rightArm"] as const) {
        const codes = atob(couchReference.layers[name])
        for (let i = 0; i < codes.length; i++) {
          const code = codes.charCodeAt(i)
          if (!code) continue
          const hex = couchReference.palette[code]
          pixels.data.set(
            [1, 3, 5]
              .map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
              .concat(255),
            i * 4,
          )
        }
      }
      referenceFront.getContext("2d")!.putImageData(pixels, 0, 0)
    }
    actorCanvas.width = 64
    actorCanvas.height = 80
    setError("")
    void loadGameFonts()
    for (const angle of furnitureTurnaround(definition.model) ? [0, 90, 180, 270] : [0]) {
      const photo = new Image()
      photo.onerror = () => {
        if (!stopped) setError("The reference could not load. Reopen this page to retry.")
      }
      photo.src = referenceView(definition, angle).file
      photos.set(angle, photo)
    }
    try {
      const appearance = characterCreator.getSnapshot().appearance
      renderer = new PixelFurniture(
        settings.current.style,
        appearance,
        definition,
      )
      actor = new PixelActor(appearance)
      const draw = (time: number) => {
        if (stopped) return
        frame = requestAnimationFrame(draw)
        if (document.hidden || time - last < 100) return
        last = time
        try {
          const s = settings.current,
            next = JSON.stringify(s.style),
            c = current.current?.getContext("2d"),
            r = original.current?.getContext("2d")
          if (!c || !r) return
          if (styleKey !== next) {
            renderer!.style(s.style)
            styleKey = next
          }
          if (!views.has(s.rotation))
            views.set(s.rotation, projectedGeometry(s.rotation, definition))
          const view = views.get(s.rotation)!
          setHeight((old) =>
            old === view.indicatorHeight ? old : view.indicatorHeight,
          )
          for (const ctx of [c, r]) {
            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, 96, 112)
            ctx.fillStyle = "#d7c29f"
            ctx.fillRect(0, 96, 96, 1)
          }
          const phase = s.reduced ? 0 : (time % 4000) / 4000,
            force = s.reduced ? 0 : Math.sin(time / 320) * 0.6
          c.drawImage(
            renderer!.frame(s.rotation, s.seat, false, phase, force),
            0,
            0,
          )
          const ref = referenceView(definition, s.rotation),
            photo = photos.get(s.rotation) ?? photos.get(0)!
          if (photo.complete && photo.naturalWidth)
            r.drawImage(photo, 48 - ref.anchor[0], 96 - ref.anchor[1])
          if (
            s.rotation === 0 && s.seat !== -1 &&
            (s.seat === -2 || definition.model === "couch")
          ) {
            const action = s.seat === -2 ? "idle" : "sit",
              clip = humanClips[action],
              index = s.reduced
                ? 0
                : Math.floor((time / 1000) * clip.fps) % (clip.frames ?? 8)
            actorCanvas
              .getContext("2d")!
              .putImageData(actor!.frame(action, "down", index), 0, 0)
            const seats = s.seat === -3 ? [0, 1] : [s.seat]
            for (const slot of seats) {
              if (!views.has(0)) views.set(0, projectedGeometry(0, definition))
              const contact = views.get(0)!.geometry.seats[slot]
              const x = slot === -2 ? 48 : contact.point[0],
                y = slot === -2 ? 107 : contact.point[1] - contact.elevation
              r.drawImage(actorCanvas, x - 32, y - 60)
            }
            if (definition.model === "couch" && s.seat !== -2)
              r.drawImage(
                referenceFront,
                48 - ref.anchor[0],
                96 - ref.anchor[1],
              )
          }
          if (s.geometry) {
            c.strokeStyle = "#b3442c"
            for (const [x, y, w, h] of view.geometry.ground)
              c.strokeRect(x + 0.5, y + 0.5, w, h)
            c.fillStyle = "#216b68"
            for (const q of view.geometry.seats)
              c.fillRect(q.point[0] - 1, q.point[1] - 1, 3, 3)
          }
        } catch (error) {
          console.error("PawTrail furniture render interrupted: " + (error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error)))
          setError(
            "The model renderer was interrupted. Reopen this page to retry.",
          )
          stopped = true
          cancelAnimationFrame(frame)
        }
      }
      frame = requestAnimationFrame(draw)
    } catch (error) {
      console.error("PawTrail furniture renderer could not open: " + (error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error)))
      setError("The 3D renderer could not open. Reopen this page to retry.")
    }
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      for (const photo of photos.values()) photo.onerror = null
      renderer?.dispose()
      actor?.dispose()
    }
  }, [definition.id])
  return (
    <div
      ref={host}
      className="relative grid min-h-[24rem] grid-cols-2 lg:h-full lg:min-h-0 items-center gap-3 overflow-auto bg-secondary/40 p-3 sm:gap-6 sm:p-6"
    >
      {error && (
        <p
          role="alert"
          className="absolute inset-x-4 top-4 z-20 rounded-md border bg-background p-3 text-sm"
        >
          {error}
        </p>
      )}
      {[
        {
          title: furnitureTurnaround(definition.model) && rotation !== 0
            ? "Turnaround reference" : "Original " + definition.model,
          ref: original,
          detail: referenceView(definition, rotation).label,
        },
        {
          title: definition.label,
          ref: current,
          detail: `${rotation}° · ${facingLabel(rotation)} · ${style.label}`,
        },
      ].map(({ title, ref, detail }, i) => (
        <figure key={i} className="flex min-w-0 flex-col items-center gap-3">
          <figcaption className="text-center">
            <p className="font-heading text-xl font-bold">{title}</p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </figcaption>
          <div
            className="relative shrink-0"
            style={{
              width: 96 * zoom,
              height: 112 * zoom + (zoom === 1 ? 32 : 0),
              paddingTop: zoom === 1 ? 32 : 0,
            }}
          >
            <canvas
              ref={ref}
              width={96}
              height={112}
              role="img"
              aria-label={title + " native model preview"}
              className="block [image-rendering:pixelated]"
              style={{ width: 96 * zoom, height: 112 * zoom }}
            />
            {i === 1 && onRotate && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-1/2 z-10 size-10 -translate-x-1/2 rounded-full bg-background shadow-sm"
                style={{
                  top: Math.max(
                    0,
                    (zoom === 1 ? 32 : 0) + (96 - height) * zoom - 44,
                  ),
                }}
                aria-label={"Rotate " + definition.label + " clockwise"}
                onClick={onRotate}
              >
                <RotateCw className="size-4" />
              </Button>
            )}
          </div>
        </figure>
      ))}
    </div>
  )
}
