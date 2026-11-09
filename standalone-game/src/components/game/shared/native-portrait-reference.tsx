import { useEffect, useRef, useState } from 'react'
import { fitPortraitDisplay } from '@/game/actor-rig/portrait-display'

/** A real authored PNG, fitted with the same integer-pixel rule as the live canvas. */
export function NativePortraitReference({ src, size, bounds, name }: { src: string; size: number[]; bounds?: number[]; name: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(() => fitPortraitDisplay(size[0], size[1], size, bounds))
  const [width, height] = size
  useEffect(() => {
    const node = container.current
    if (!node) return
    const fit = () => {
      setDisplay(fitPortraitDisplay(node.clientWidth, node.clientHeight, size, bounds))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(node)
    return () => observer.disconnect()
  }, [width, height, bounds])
  return <div ref={container} className="relative size-full overflow-hidden"><img src={src} alt={`${name}, authored expression reference`} width={width} height={height} style={display} className="absolute max-w-none [image-rendering:pixelated]"/></div>
}
