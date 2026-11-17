import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ActorIllustration } from '@/game/creator/illustrations'
import {loadActorIllustration,type IllustrationTrack} from '@/game/creator/illustration-assets'
import { Switch } from '@/components/ui/switch'
import {drawIllustrationMotion} from '@/game/creator/illustration-motion'

export function IllustrationPreview({ illustration:source,presentation='preview',playing=true }: { illustration: ActorIllustration;presentation?:'preview'|'cutin';playing?:boolean }) {
  const [variantId,setVariantId]=useState('normal')
  const variant=source.variants?.find(entry=>entry.id===variantId)??source.variants?.[0]
  const illustration=useMemo(()=>variant?{...source,folder:variant.folder,motion:variant.motion}:source,[source,variant])
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(false)
  const controls = useRef({ sync: () => {}, restart: () => {} })
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [size, setSize] = useState(illustration.compositionSize??illustration.nativeSize)
  const [hasLayers,setHasLayers]=useState(false)
  const [background,setBackground]=useState(true),[aura,setAura]=useState(true)
  const layerVisibility=useRef({background:true,aura:true})
  useEffect(()=>{layerVisibility.current={background,aura};controls.current.sync()},[background,aura])
  const [zoom, setZoom] = useState(1)
  const [animationInfo, setAnimationInfo] = useState({ frames: 0, cycleMs: 0 })
  const [rigged,setRigged]=useState(false)

  useEffect(() => {
    pausedRef.current = paused || !playing
    controls.current.sync()
  }, [paused, playing])

  useEffect(() => {
    if (!stage.current) return
    const fit = () => {
      const available=Math.min((stage.current?.clientWidth??size[0])/size[0],presentation==='cutin'?(stage.current?.clientHeight??size[1])/size[1]:2)
      setZoom(illustration.rendering==='smooth'?Math.max(.25,Math.min(2,available)):Math.max(1,Math.min(2,Math.floor(available))))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [size,presentation,illustration.rendering])

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
      if(ready&&!cancelled)render()
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
        const {data,image,layers,rigImage}=await loadActorIllustration(illustration)
        if (cancelled || !canvas.current) return
        const context = canvas.current.getContext('2d')
        if (!context) throw new Error('Illustration canvas unavailable')
        const [width, height] = data.compositionSize??data.nativeSize
        canvas.current.width = width
        canvas.current.height = height
        context.imageSmoothingEnabled = illustration.rendering==='smooth'
        setSize(data.compositionSize??data.nativeSize)
        setHasLayers(layers.length>0)
        const cycle = data.durationMs.reduce((total, duration) => total + duration, 0)
        setRigged(!!data.motionRig)
        setAnimationInfo({ frames: data.frames.length, cycleMs: data.motionRig?.cycleMs??cycle })
        const frameAt=(track:IllustrationTrack,time:number)=>{
          let phase=time%track.durationMs.reduce((a,b)=>a+b,0),step=0
          while(step<track.sequence.length-1&&phase>=track.durationMs[step]){phase-=track.durationMs[step];step++}
          return {rect:track.frames.find(frame=>frame.id===track.sequence[step])?.rect,delay:track.durationMs[step]-phase}
        }
        render = () => {
          const time=elapsed+(startedAt?performance.now()-startedAt:0)
          context.clearRect(0, 0, width, height)
          if(layers.length){
            if(data.backdrop&&presentation!=='cutin'){context.fillStyle=data.backdrop;context.fillRect(0,0,width,height)}
            let delay=1000
            for(const layer of layers){
              if(layer.data.id==='background'&&(presentation==='cutin'||!layerVisibility.current.background)||layer.data.id==='aura'&&!layerVisibility.current.aura)continue
              const frame=frameAt(layer.data,time);if(!frame.rect)continue
              context.globalAlpha=layer.data.opacity??1
              if(layer.data.id==='actor'&&data.motionRig&&rigImage)drawIllustrationMotion(context,rigImage,data.motionRig,time)
              else context.drawImage(layer.image,...frame.rect,...layer.data.offset,...layer.data.nativeSize)
              context.globalAlpha=1
              delay=Math.min(delay,frame.delay)
            }
            return Math.max(1,data.motionRig?Math.min(1000/30,delay):delay)
          }
          const frame=frameAt(data,time);if(!frame.rect)return 0
          if(data.motionRig&&rigImage)drawIllustrationMotion(context,rigImage,data.motionRig,time)
          else context.drawImage(image,...frame.rect,0,0,width,height)
          return Math.max(1,data.motionRig?Math.min(1000/30,frame.delay):frame.delay)
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
   <div className="relative shrink-0" style={{width:size[0]*zoom,height:size[1]*zoom,imageRendering:illustration.rendering==='smooth'?'auto':'pixelated'}}>
    {still&&<img src={illustration.folder+(illustration.compositionSize?'/actor-poster.webp':'/poster.webp')} alt="" width={size[0]} height={size[1]} style={{imageRendering:illustration.rendering==='smooth'?'auto':'pixelated'}} className="absolute inset-0 size-full object-contain"/>}
    <canvas ref={canvas} width={illustration.nativeSize[0]} height={illustration.nativeSize[1]} style={{imageRendering:illustration.rendering==='smooth'?'auto':'pixelated'}} className={'size-full '+(still?'invisible':'')}/>
   </div>
  </div>
  return (
    <section id="loading-illustration" className="overflow-hidden rounded-md border bg-card shadow-sm" aria-label={illustration.name + ' animated illustration'}>
      <div className="flex items-start justify-between gap-3 p-4">
        <div><h3 className="font-heading text-xl font-semibold">Animated illustration</h3><p className="mt-1 text-xs text-muted-foreground">{illustration.name} · {illustration.style} · {illustration.motion}</p></div>
        <Wind className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      {presentation==='preview'&&source.variants&&<div className="flex gap-2 px-4 pb-3" role="group" aria-label="Illustration pose">{source.variants.map(entry=><Button type="button" key={entry.id} size="sm" variant={variant?.id===entry.id?'secondary':'outline'} aria-pressed={variant?.id===entry.id} onClick={()=>setVariantId(entry.id)}>{entry.label}</Button>)}</div>}
      <div ref={stage} className="grid min-h-64 place-items-center overflow-hidden bg-[#eee4d0] py-3">
        <div className="relative shrink-0" style={{ width: size[0] * zoom, height: size[1] * zoom }}>
          {still && <img src={illustration.folder + '/poster.webp'} width={size[0]} height={size[1]} alt={illustration.name + ' resting illustration'} style={{imageRendering:illustration.rendering==='smooth'?'auto':'pixelated'}} className="absolute inset-0 size-full" />}
          <canvas ref={canvas} width={illustration.nativeSize[0]} height={illustration.nativeSize[1]} role="img" aria-label={illustration.name + ': ' + illustration.motion} aria-hidden={still} style={{imageRendering:illustration.rendering==='smooth'?'auto':'pixelated'}} className={'size-full ' + (still ? 'invisible' : '')} />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={status !== 'ready' || reduced} onClick={() => setPaused(value => !value)}>{paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}{paused ? 'Play' : 'Pause'}</Button>
          <Button type="button" size="sm" variant="ghost" disabled={status !== 'ready' || reduced} onClick={() => controls.current.restart()}><RotateCcw className="size-3.5" />Restart</Button>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{size[0]} × {size[1]} · {Number(zoom.toFixed(2))}×</span>
        </div>
        {hasLayers&&<div className="flex flex-wrap gap-4 text-xs"><label className="flex items-center gap-2"><Switch checked={background} onCheckedChange={setBackground} disabled={reduced}/>Background</label><label className="flex items-center gap-2"><Switch checked={aura} onCheckedChange={setAura} disabled={reduced}/>Aura</label></div>}
        {status === 'error' ? <div role="alert" className="flex flex-wrap items-center gap-2 text-xs"><p>The animation could not load. Showing the resting artwork.</p><Button type="button" size="sm" variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry</Button></div> : <p className="text-xs text-muted-foreground" role="status">{status === 'loading' ? 'Preparing the illustration animation…' : reduced ? 'Still artwork shown for your reduced-motion preference.' : `${rigged?'Continuous hair & cloth motion':animationInfo.frames+' authored drawings'} · ${(animationInfo.cycleMs / 1000).toFixed(1)}-second loop${hasLayers?' · 3 independent layers':''}${paused || !playing ? ' · paused' : ''}`}</p>}
      </div>
    </section>
  )
}
