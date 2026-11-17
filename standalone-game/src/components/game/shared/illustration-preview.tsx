import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActorIllustration } from '@/game/creator/illustrations'
import {loadActorIllustration} from '@/game/creator/illustration-assets'

export function IllustrationPreview({ illustration,presentation='preview' }: { illustration: ActorIllustration;presentation?:'preview'|'cutin' }) {
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(false)
  const controls = useRef({ sync: () => {}, restart: () => {} })
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [size, setSize] = useState(illustration.nativeSize)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    pausedRef.current = paused
    controls.current.sync()
  }, [paused])

  useEffect(() => {
    if (!stage.current) return
    const fit = () => setZoom(Math.max(1, Math.min(2, Math.floor(Math.min((stage.current?.clientWidth ?? size[0])/size[0],presentation==='cutin'?(stage.current?.clientHeight??size[1])/size[1]:2)))))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [size,presentation])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let cancelled = false, visible = true, ready = false, elapsed = 0, startedAt = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let render = () => 0
    let observer: IntersectionObserver | undefined
    setStatus('loading')
    setReduced(media.matches)

    const stop = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      if (startedAt) elapsed += performance.now() - startedAt
      startedAt = 0
    }
    const tick = () => {
      if (cancelled) return
      const delay = render()
      if (delay > 0) timer = setTimeout(tick, delay)
    }
    const sync = () => {
      stop()
      if (ready && !cancelled && visible && !document.hidden && !media.matches && !pausedRef.current) {
        startedAt = performance.now()
        tick()
      }
    }
    const motionChanged = () => { setReduced(media.matches); sync() }
    controls.current = {
      sync,
      restart: () => { stop(); elapsed = 0; render(); sync() },
    }
    document.addEventListener('visibilitychange', sync)
    media.addEventListener('change', motionChanged)
    if (stage.current) {
      observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
      observer.observe(stage.current)
    }

    const load = async () => {
      try {
        const {data,image}=await loadActorIllustration(illustration)
        if (cancelled || !canvas.current) return
        const context = canvas.current.getContext('2d')
        if (!context) throw new Error('Illustration canvas unavailable')
        const [width, height] = data.nativeSize
        canvas.current.width = width
        canvas.current.height = height
        context.imageSmoothingEnabled = false
        setSize(data.nativeSize)
        const cycle = data.durationMs.reduce((total, duration) => total + duration, 0)
        const frames = new Map(data.frames.map(frame => [frame.id, frame.rect]))
        render = () => {
          let phase = (elapsed + (startedAt ? performance.now() - startedAt : 0)) % cycle
          let step = 0
          while (step < data.sequence.length - 1 && phase >= data.durationMs[step]) {
            phase -= data.durationMs[step]
            step++
          }
          const rect = frames.get(data.sequence[step])
          if (!rect) return 0
          context.clearRect(0, 0, width, height)
          context.drawImage(image, ...rect, 0, 0, width, height)
          return Math.max(1, data.durationMs[step] - phase)
        }
        ready = true
        render()
        setStatus('ready')
        sync()
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    void load()
    return () => {
      cancelled = true
      stop()
      observer?.disconnect()
      media.removeEventListener('change', motionChanged)
      document.removeEventListener('visibilitychange', sync)
      controls.current = { sync: () => {}, restart: () => {} }
    }
  }, [illustration, attempt,presentation])

  const still = reduced || status !== 'ready'
  if(presentation==='cutin')return <div ref={stage} className="flex size-full items-end justify-center overflow-hidden" aria-hidden="true">
   <div className="relative shrink-0" style={{width:size[0]*zoom,height:size[1]*zoom}}>
    {still&&<img src={illustration.folder+'/poster.webp'} alt="" width={size[0]} height={size[1]} className="absolute inset-0 size-full [image-rendering:pixelated]"/>}
    <canvas ref={canvas} width={illustration.nativeSize[0]} height={illustration.nativeSize[1]} className={'size-full [image-rendering:pixelated] '+(still?'invisible':'')}/>
   </div>
  </div>
  return (
    <section id="loading-illustration" className="overflow-hidden rounded-md border bg-card shadow-sm" aria-label={illustration.name + ' loading illustration'}>
      <div className="flex items-start justify-between gap-3 p-4">
        <div><h3 className="font-heading text-xl font-semibold">Loading illustration</h3><p className="mt-1 text-xs text-muted-foreground">{illustration.name} · {illustration.style} · {illustration.motion}</p></div>
        <Wind className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <div ref={stage} className="grid min-h-64 place-items-center overflow-hidden bg-[#eee4d0] py-3">
        <div className="relative shrink-0" style={{ width: size[0] * zoom, height: size[1] * zoom }}>
          {still && <img src={illustration.folder + '/poster.webp'} width={size[0]} height={size[1]} alt={illustration.name + ' in her loading-screen pose'} className="absolute inset-0 size-full [image-rendering:pixelated]" />}
          <canvas ref={canvas} width={illustration.nativeSize[0]} height={illustration.nativeSize[1]} role="img" aria-label={illustration.name + ': ' + illustration.motion} aria-hidden={still} className={'size-full [image-rendering:pixelated] ' + (still ? 'invisible' : '')} />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={status !== 'ready' || reduced} onClick={() => setPaused(value => !value)}>{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}{paused ? 'Play' : 'Pause'}</Button>
          <Button type="button" size="sm" variant="ghost" disabled={status !== 'ready' || reduced} onClick={() => controls.current.restart()}><RotateCcw className="size-3.5" />Restart</Button>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{size[0]} × {size[1]} · {zoom}×</span>
        </div>
        {status === 'error' ? <div role="alert" className="flex flex-wrap items-center gap-2 text-xs"><p>The animation could not load. Showing the resting artwork.</p><Button type="button" size="sm" variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry</Button></div> : <p className="text-xs text-muted-foreground" role="status">{status === 'loading' ? 'Preparing the hair and cape animation…' : reduced ? 'Still artwork shown for your reduced-motion preference.' : 'Six authored drawings · 2.4-second loop'}</p>}
      </div>
    </section>
  )
}
