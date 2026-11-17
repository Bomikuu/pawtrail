import { useEffect, useRef, type RefObject } from 'react'
import { RotateCcw, RotateCw, Rotate3D } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export const wrapRotation = (degrees: number) => (Math.round(degrees) % 360 + 360) % 360
export const directionRotation = (direction: string) => Math.max(0, ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right'].indexOf(direction)) * 45

export function ModelRotationControls({ degrees, onChange, onReset }: { degrees: number; onChange: (degrees: number) => void; onReset: () => void }) {
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Rotate comparison models">
    <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold"><Rotate3D className="size-4" />Rotate both</span>
    <Button variant="outline" size="icon" className="size-9" aria-label="Rotate left 45 degrees" onClick={() => onChange(wrapRotation(degrees - 45))}><RotateCcw className="size-4" /></Button>
    <Slider aria-label="Model rotation" className="w-28 sm:w-40" min={0} max={360} step={2} value={[degrees]} onValueChange={([value]) => onChange(wrapRotation(value))} />
    <Button variant="outline" size="icon" className="size-9" aria-label="Rotate right 45 degrees" onClick={() => onChange(wrapRotation(degrees + 45))}><RotateCw className="size-4" /></Button>
    <output className="w-10 text-right text-xs tabular-nums">{Math.round(degrees)}°</output>
    <Button variant="ghost" size="sm" onClick={onReset}>Reset view</Button>
  </div>
}

/** Shared mouse/touch rotation. Ctrl+wheel leaves normal page scrolling available. */
export function useModelRotation(host: RefObject<HTMLElement | null>, options: { enabled: boolean; degrees: number; zoom: number; maxZoom: number; minZoom?: number; onRotate: (degrees: number) => void; onZoom: (zoom: number) => void }) {
  const latest = useRef(options)
  latest.current = options
  useEffect(() => {
    const element = host.current
    if (!element || !options.enabled) return
    let drag: { id: number; x: number; degrees: number } | undefined
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      drag = { id: event.pointerId, x: event.clientX, degrees: latest.current.degrees }
      element.setPointerCapture(event.pointerId)
      element.style.cursor = 'grabbing'
    }
    const move = (event: PointerEvent) => {
      if (drag?.id !== event.pointerId || Math.abs(event.clientX - drag.x) < 3) return
      latest.current.onRotate(wrapRotation(drag.degrees + (event.clientX - drag.x) * .55))
    }
    const end = () => { drag = undefined; element.style.cursor = 'grab' }
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      event.preventDefault()
      const value = latest.current
      value.onZoom(Math.max(value.minZoom ?? 1, Math.min(value.maxZoom, value.zoom + (event.deltaY < 0 ? 1 : -1))))
    }
    element.style.cursor = 'grab'
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', end)
    element.addEventListener('pointercancel', end)
    element.addEventListener('lostpointercapture', end)
    element.addEventListener('wheel', wheel, { passive: false })
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', end)
      element.removeEventListener('pointercancel', end)
      element.removeEventListener('lostpointercapture', end)
      element.removeEventListener('wheel', wheel)
      element.style.cursor = ''
    }
  }, [host, options.enabled])
}
