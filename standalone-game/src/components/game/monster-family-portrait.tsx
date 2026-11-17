import { useEffect, useRef, useState } from 'react'

/** Uses this creature's own authored alert/threat/hurt pixels, never face masks. */
export function MonsterFamilyPortrait({ assets, state, playing, enraged = false }: { assets: string; state: string; playing: boolean; enraged?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null), [error, setError] = useState(false)
  const expression = ['hurt','defeated'].includes(state) ? 'hurt' : ['warning','striking','enraging','threatening'].includes(state) ? 'threatening' : 'alert'
  useEffect(() => {
    const controller = new AbortController(), image = new Image(), reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, cancelled = false, last = 0
    setError(false)
    fetch(assets + 'manifest.json', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Portrait manifest unavailable')
      const { portrait } = await response.json() as { portrait: { file: string; cellWidth: number; cellHeight: number; states: string[]; enragedRow?: number } }
      const frame = Math.max(0, portrait.states.indexOf(expression)), output = canvas.current!
      output.width = portrait.cellWidth; output.height = portrait.cellHeight
      const context = output.getContext('2d')!
      const draw = (time: number) => {
        if (cancelled) return
        if (time-last > 1000/24) {
          last = time; context.imageSmoothingEnabled = false; context.clearRect(0,0,output.width,output.height)
          const breath = playing && !reduced.matches && !document.hidden ? Math.sin(time/420)*.6 : 0
          context.drawImage(image,frame*portrait.cellWidth,(enraged ? portrait.enragedRow ?? 0 : 0)*portrait.cellHeight,portrait.cellWidth,portrait.cellHeight,0,-breath,output.width,output.height+breath)
        }
        if (playing && !reduced.matches) raf = requestAnimationFrame(draw)
      }
      image.onload = () => draw(performance.now()+100)
      image.onerror = () => { if (!cancelled) setError(true) }
      image.src = assets + portrait.file
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true; controller.abort(); cancelAnimationFrame(raf); image.onload = image.onerror = null }
  }, [assets, expression, playing, enraged])
  return <div className="mt-3 flex items-center gap-3 rounded-md border p-2"><canvas ref={canvas} width={128} height={128} role="img" aria-label={`${expression} creature portrait`} className="size-20 shrink-0 [image-rendering:pixelated]" /><div><p className="text-xs font-medium">Portrait · {expression}</p><p className="mt-1 text-xs text-muted-foreground">{error ? 'Portrait unavailable. Reload to retry.' : 'Creature-specific artwork follows its encounter state.'}</p></div></div>
}
