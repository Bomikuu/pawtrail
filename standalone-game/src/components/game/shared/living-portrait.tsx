import { useEffect, useRef, useState } from 'react'
import { Maximize2, Pause, Play, PawPrint, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { resolvePortraitSubject, type PortraitSubject } from '@/game/actor-rig/portrait-source'
import { PORTRAIT_EXPRESSIONS, type PortraitExpression, type PortraitView } from '@/game/actor-rig/portrait-state'
import type { PhotoPortraitPose, PortraitBlink, PortraitMouth } from '@/game/actor-rig/photo-portrait-catalog'
import { fitPortraitDisplay } from '@/game/actor-rig/portrait-display'
import { authoredActorPortrait } from '@/game/actor-rig/authored-actor-portrait'
import { portraitForAction } from '@/game/actor-rig/action-portrait'
import { PortraitAngleSelect, resolvePortraitAngle } from './portrait-angle-select'

const posters = new Map<string, string>()
function remember(key: string, poster: string) {
  if (posters.size >= 24) posters.delete(posters.keys().next().value!)
  posters.set(key, poster)
}
type PortraitProps = {
  subject?: PortraitSubject; identity?: string; name: string; fallback?: string; className?: string
  expression?: PortraitExpression; talking?: boolean; inspectable?: boolean
  collection?: string; pose?: PhotoPortraitPose; blink?: PortraitBlink
  collectionRevision?: string
  onPoseChange?: (pose: PhotoPortraitPose) => void
  paused?: boolean; onPausedChange?: (paused: boolean) => void; controls?: boolean
  mouth?: PortraitMouth; breathing?: boolean
}

/** Original illustrated busts with native drawn eye/mouth layers; no WebGL or rotation. */
export function LivingPortrait({ subject, identity, name, fallback, className = '', expression = 'idle', talking = false, inspectable = true, collection, collectionRevision, pose, onPoseChange, blink = 'auto', paused: controlledPaused, onPausedChange, controls = true, mouth = 'auto', breathing = true }: PortraitProps) {
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null)
  const wake = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false), [available, setAvailable] = useState(false)
  const [internalPaused, setInternalPaused] = useState(false), pausedRef = useRef(false)
  const paused = controlledPaused ?? internalPaused
  const setPaused = (value: boolean) => { setInternalPaused(value); onPausedChange?.(value) }
  const [inspectOpen, setInspectOpen] = useState(false)
  const [kind, setKind] = useState<'actor'|'cat'>(subject?.kind ?? 'actor')
  const [failedImage, setFailedImage] = useState<string>(), [poster, setPoster] = useState<string>()
  const [pixelDisplay, setPixelDisplay] = useState<ReturnType<typeof fitPortraitDisplay>>()
  const [loadError, setLoadError] = useState<string>(), [retry, setRetry] = useState(0)
  const view = useRef<PortraitView>({ yaw: 0, expression, talking })
  view.current = { yaw: 0, expression, talking, pose, blink, mouth, breathing }; pausedRef.current = paused || inspectOpen
  const sourceKey = JSON.stringify([subject, identity, collection, collectionRevision, retry])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => { if (media.matches) setPaused(true) }
    change(); media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => { wake.current() }, [paused, inspectOpen, expression, talking, pose, blink, mouth, breathing])
  useEffect(() => {
    let cancelled = false, raf = 0, visible = true, elapsed = 0, last = 0, previous = -1, currentFrame = 0
    let renderer: import('@/game/actor-rig/portrait-renderer').DialoguePortraitRenderer | undefined
    let observer: IntersectionObserver | undefined
    let resizeObserver: ResizeObserver | undefined
    setReady(false); setAvailable(false); setPoster(undefined); setLoadError(undefined); setPixelDisplay(undefined)
    const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0 }
    let resume = () => {}, redraw = () => {}
    wake.current = () => { redraw(); resume() }
    const visibility = () => resume()
    document.addEventListener('visibilitychange', visibility)
    const start = async () => {
      try {
        const { createPortraitRenderer, PORTRAIT_SIZE, PORTRAIT_FPS, PORTRAIT_FRAMES, PORTRAIT_STYLE } = await import('@/game/actor-rig/portrait-renderer')
        if (cancelled || !canvas.current) return
        let key: string
        if (collection) {
          key = `photo-collection-v2:${collection}:${collectionRevision ?? ''}`
          setKind('actor'); setPoster(posters.get(key))
          const { createPhotoPortraitRenderer } = await import('@/game/actor-rig/photo-portrait-renderer')
          if (cancelled) return
          renderer = await createPhotoPortraitRenderer(collection, collectionRevision)
        } else {
          const resolved = subject ?? (identity ? await resolvePortraitSubject(identity) : null)
          if (cancelled || !resolved) return
          setKind(resolved.kind)
          key = PORTRAIT_STYLE + JSON.stringify([resolved, identity])
          setPoster(posters.get(key))
          renderer = await createPortraitRenderer(resolved, identity)
        }
        if (cancelled) { renderer.dispose(); renderer = undefined; return }
        const target = canvas.current, context = target.getContext('2d')
        if (!context) throw new Error('Portrait canvas unavailable.')
        target.width = renderer.nativeSize?.[0] ?? PORTRAIT_SIZE
        target.height = renderer.nativeSize?.[1] ?? PORTRAIT_SIZE
        context.imageSmoothingEnabled = false
        if (renderer.nativeSize && container.current) {
          const size = renderer.nativeSize, bounds = renderer.contentBounds
          const fit = () => {
            if (!container.current || cancelled) return
            setPixelDisplay(fitPortraitDisplay(container.current.clientWidth, container.current.clientHeight, size, bounds))
          }
          fit()
          if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(fit)
            resizeObserver.observe(container.current)
          }
        }
        redraw = () => {
          if (cancelled || !renderer) return
          try { context.putImageData(renderer.frame(currentFrame, view.current), 0, 0) }
          catch { stop(); renderer.dispose(); renderer=undefined; setReady(false); setAvailable(false); setLoadError('The portrait animation stopped. Try loading it again.') }
        }
        // A neutral first frame doubles as the automatic dialogue profile picture.
        context.putImageData(renderer.frame(0, { ...view.current, steady: true }), 0, 0)
        const picture = target.toDataURL('image/png')
        remember(key, picture); setPoster(picture)
        redraw()
        if (!renderer) return
        setReady(true); setAvailable(true)
        const tick = (time: number) => {
          if (cancelled || !renderer) return
          if (last) elapsed += Math.min(200, time - last)
          last = time
          const nextFrame = Math.floor(elapsed * PORTRAIT_FPS / 1000)
          currentFrame = renderer.nativeSize ? nextFrame : nextFrame % PORTRAIT_FRAMES
          if (currentFrame !== previous) { redraw(); previous = currentFrame }
          if (renderer) raf = requestAnimationFrame(tick)
        }
        resume = () => {
          stop()
          if (!cancelled && visible && !document.hidden && !pausedRef.current && renderer) raf = requestAnimationFrame(tick)
        }
        if (container.current && typeof IntersectionObserver !== 'undefined') {
          observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume() })
          observer.observe(container.current)
        }
        resume()
      } catch {
        renderer?.dispose(); renderer = undefined
        if (!cancelled) { setReady(false); setAvailable(false); setLoadError('This portrait could not load. Please try again.') }
      }
    }
    void start()
    return () => {
      cancelled=true;stop();observer?.disconnect();resizeObserver?.disconnect();renderer?.dispose()
      document.removeEventListener('visibilitychange',visibility);wake.current=()=>{}
    }
    // The serialized appearance owns asset loading; expression edits reuse its layers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey])

  const image = poster ?? fallback
  const position = pixelDisplay ? 'absolute max-w-none [image-rendering:pixelated]' : 'absolute inset-0 size-full object-contain [image-rendering:pixelated]'
  return <>
    <div ref={container} className={`relative size-full overflow-hidden ${className}`}>
      {image && failedImage!==image
        ? <img src={image} alt={`${name} portrait`} aria-hidden={ready} onError={()=>setFailedImage(image)} style={pixelDisplay} className={`${position} ${ready?'invisible':''}`} />
        : <div aria-hidden={ready} className={`absolute inset-0 flex items-center justify-center ${ready?'invisible':''}`}><PawPrint aria-hidden="true" className="size-10 animate-pulse text-[#86582f] motion-reduce:animate-none"/><span className="sr-only">Loading {name} portrait</span></div>}
      <canvas ref={canvas} role="img" aria-hidden={!ready} aria-label={`${name}, animated 2D portrait`}
        style={pixelDisplay} className={`${position} ${ready?'opacity-100':'opacity-0'}`}/>
      {loadError&&<div role="alert" className="absolute inset-x-2 bottom-2 z-20 rounded-md border bg-background/95 p-3 text-xs text-foreground"><p>{loadError}</p><Button variant="outline" size="sm" className="mt-2 rounded-md" onClick={()=>setRetry(value=>value+1)}><RotateCcw className="size-3.5"/>Retry portrait</Button></div>}
      {controls&&available&&<div className="absolute bottom-1 right-1 z-10 flex gap-1">
        {inspectable&&<Button variant="outline" size="icon" className="size-7 rounded-md border-[#bc8751] bg-[#fff7e9]/95 text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]" onClick={()=>setInspectOpen(true)} aria-label={`Open ${name} portrait preview`} title="Preview expressions"><Maximize2 className="size-3.5"/></Button>}
        <Button variant="outline" size="icon" className="size-7 rounded-md border-[#bc8751] bg-[#fff7e9]/95 text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]" onClick={()=>setPaused(!paused)} aria-label={`${paused?'Play':'Pause'} portrait animation`} aria-pressed={paused} title={`${paused?'Play':'Pause'} portrait animation`}>{paused?<Play className="size-3.5"/>:<Pause className="size-3.5"/>}</Button>
      </div>}
    </div>
    {inspectable&&inspectOpen&&<PortraitInspector open onClose={()=>setInspectOpen(false)} subject={subject} identity={identity} name={name} fallback={fallback} kind={kind} collection={collection} collectionRevision={collectionRevision} pose={pose} onPoseChange={onPoseChange} initialExpression={expression} initialBlink={blink}/>}
  </>
}

function PortraitInspector({open,onClose,kind,initialExpression='idle',initialBlink='auto',onPoseChange,...portrait}:{open:boolean;onClose:()=>void;kind:'actor'|'cat';initialExpression?:PortraitExpression;initialBlink?:PortraitBlink}&Pick<PortraitProps,'subject'|'identity'|'name'|'fallback'|'collection'|'collectionRevision'|'pose'|'onPoseChange'>){
  const [expression,setExpression]=useState<PortraitExpression>(initialExpression)
  const [blink,setBlink]=useState<PortraitBlink>(initialBlink)
  const [talking,setTalking]=useState(false)
  const authored=portrait.collection||(portrait.subject?.kind==='actor'&&authoredActorPortrait(portrait.subject.appearance))
  const [angle,setAngle]=useState<PhotoPortraitPose>(()=>resolvePortraitAngle(typeof authored==='string'?authored:undefined,portrait.pose??'three-quarter-left'))
  return <Dialog open={open} onOpenChange={value=>{if(!value)onClose()}}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md bg-[#fff7e9] font-body text-[#45291e] sm:max-w-2xl"><DialogHeader><DialogTitle className="font-heading text-3xl">{portrait.name} · Portrait preview</DialogTitle><DialogDescription className="text-[#805d3c]">Original 2D artwork with blinking and drawn expressions.</DialogDescription></DialogHeader>
    <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="mx-auto aspect-square w-full max-w-96 overflow-hidden rounded-md border border-[#bc8751]/40 bg-[#e3e7ce]"><LivingPortrait {...portrait} pose={angle} expression={expression} blink={blink} talking={talking} inspectable={false}/></div>
      <div className="space-y-5">
        <PortraitAngleSelect collection={typeof authored==='string'?authored:undefined} value={angle} onChange={value=>{setAngle(value);onPoseChange?.(value)}}/>
        <section><h3 className="mb-2 font-heading text-xl font-semibold">Expression</h3><div className="grid grid-cols-2 gap-2">{(kind==='cat'?['idle','happy'] as const:authored?['idle','smile','happy','sad','angry','surprised'] as const:PORTRAIT_EXPRESSIONS).map(value=><Button key={value} variant={expression===value?'secondary':'outline'} className="rounded-md text-xs capitalize" aria-pressed={expression===value} onClick={()=>{setExpression(value);setBlink('auto')}}>{value==='idle'?'Neutral':value}</Button>)}</div></section>
        {authored&&<Button variant={talking?'secondary':'outline'} className="w-full rounded-md" aria-pressed={talking} onClick={()=>{setTalking(!talking);setBlink('auto')}}>Speaking preview</Button>}
        <Button variant="ghost" className="w-full justify-start rounded-md text-[#553421]" onClick={()=>{setExpression('idle');setBlink('auto');setTalking(false)}}><RotateCcw className="size-4"/>Reset expression</Button>
        <p className="text-xs leading-relaxed text-[#805d3c]">Talking follows dialogue as it appears. Pause stops the animation.</p>
      </div>
    </div>
  </DialogContent></Dialog>
}

export function CreatorPortrait({subject,name,collection,large=false,action,pose,onPoseChange}:{subject:PortraitSubject;name:string;collection?:string;large?:boolean;action?:string;pose?:PhotoPortraitPose;onPoseChange?:(pose:PhotoPortraitPose)=>void}){
  const authored = collection || (subject.kind === 'actor' && authoredActorPortrait(subject.appearance))
  const [localPose,setLocalPose]=useState<PhotoPortraitPose>('three-quarter-left')
  const angle=resolvePortraitAngle(typeof authored==='string'?authored:undefined,pose??localPose)
  const performance=portraitForAction(action,!!authored,subject.kind==='cat')
  return <section className={large?"space-y-3 rounded-md border bg-muted/30 p-3":"flex items-center gap-4 rounded-md border bg-muted/30 p-3"}>
    <div className={(large?"mx-auto aspect-[4/5] w-full max-w-72":"h-36 w-28 shrink-0")+" overflow-hidden rounded-md border border-[#bc8751]/40 bg-[#e3e7ce]"}><LivingPortrait subject={subject} collection={collection} pose={angle} onPoseChange={onPoseChange??setLocalPose} expression={performance.expression} blink={performance.blink} name={name||'Your creation'}/></div>
    <PortraitAngleSelect collection={typeof authored==='string'?authored:undefined} value={angle} onChange={onPoseChange??setLocalPose}/>
    <div><h3 className="font-heading text-xl font-semibold">Dialogue portrait</h3>{action&&<p aria-live="polite" className="mt-1 text-xs font-medium">{performance.label} · follows action{performance.fallback?' · closest available artwork':''}</p>}<p className="mt-1 text-xs leading-relaxed text-muted-foreground">{authored ? 'Original portrait artwork made for this look, with blinking, breathing and six expressions.' : 'A lightweight 2D illustration with blinking and expressions. Custom looks use the closest illustrated base; unique silhouettes and accessories need their own portrait artwork.'}</p></div>
  </section>
}
