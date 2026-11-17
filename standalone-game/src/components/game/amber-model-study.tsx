import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Expand, LoaderCircle, Minus, Pause, Play, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { comparisonDirections } from '@/game/runtime/actor-comparison-state'
import type { AmberStudyOptions } from '@/game/runtime/amber-study-scene'
import { amberStudy } from '@/game/runtime/model-studies'
import type { ModelStudyDefinition } from '@/game/runtime/model-study-definition'
import { ModelRotationControls, directionRotation, useModelRotation } from './shared/model-rotation-controls'

const defaults:AmberStudyOptions={action:'idle',direction:'down_left',rotation:null,paused:false,zoom:5,speed:1}
function AmberField({options,onReady,onError,capture,study,onViewChange}:{study:ModelStudyDefinition;options:AmberStudyOptions;onReady:()=>void;onError:(message:string)=>void;capture?:React.MutableRefObject<(()=>string)|undefined>;onViewChange:(view:Partial<AmberStudyOptions>)=>void}){
  const host=useRef<HTMLDivElement>(null),state=useRef(options);state.current=options
  useModelRotation(host,{enabled:true,degrees:options.rotation??directionRotation(options.direction),zoom:options.zoom,maxZoom:6,minZoom:2,onRotate:rotation=>onViewChange({rotation}),onZoom:zoom=>onViewChange({zoom})})
  const callbacks=useRef({onReady,onError});callbacks.current={onReady,onError}
  useEffect(()=>{
    let canceled=false,controller:ReturnType<typeof import('@/game/runtime/amber-study-scene')['mountAmberStudy']>|undefined
    Promise.all([import('@/game/runtime/amber-study-scene'),study.load()]).then(([{mountAmberStudy},models])=>{
      if(canceled||!host.current)return
      controller=mountAmberStudy(host.current,()=>state.current,()=>callbacks.current.onReady(),m=>callbacks.current.onError(m),models);if(capture)capture.current=()=>controller!.capture()
    }).catch(()=>{if(!canceled)callbacks.current.onError('The model comparison could not load. Reopen this page to retry.')})
    return()=>{canceled=true;if(capture)capture.current=undefined;controller?.dispose()}
  },[study])
  return <div ref={host} role="img" className="absolute inset-0 touch-pan-y overflow-hidden [&_canvas]:[image-rendering:pixelated]" aria-label={study.name+' model comparison: '+study.sides.map(s=>s.title).join(' and ')+'. Drag to rotate both models.'}/>
}
function TextureSheet({study}:{study:ModelStudyDefinition}){
  const ref=useRef<HTMLCanvasElement>(null),[error,setError]=useState('')
  useEffect(()=>{
    let canceled=false;setError('')
    const canvas=ref.current
    if(canvas)Promise.resolve().then(()=>study.paintTextures(canvas)).catch(()=>{if(!canceled)setError('The texture sheet could not load. Close the inspector and try again.')})
    return()=>{canceled=true}
  },[study])
  return <div className="space-y-3"><canvas ref={ref} width={256} height={192} role="img" aria-label={study.name+' painted UV surfaces'} className="mx-auto w-full max-w-xl rounded-md border [image-rendering:pixelated]"/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<p className="text-sm text-muted-foreground">{study.textureDescription}</p></div>
}
export default function AmberModelStudy({study=amberStudy}:{study?:ModelStudyDefinition}){
  const [options,setOptions]=useState(()=>({...defaults,paused:window.matchMedia('(prefers-reduced-motion: reduce)').matches})),[status,setStatus]=useState('loading'),[error,setError]=useState(''),[inspect,setInspect]=useState(false),[attempt,setAttempt]=useState(0)
  const capture=useRef<(()=>string)|undefined>(undefined)
  const patch=(v:Partial<AmberStudyOptions>)=>setOptions(o=>({...o,...v}))
  const controls=<div className="flex flex-wrap items-center gap-3">
    <div className="flex gap-1 rounded-md border bg-muted/40 p-1" role="group" aria-label="Animation">{(['idle','walk','run'] as const).map(action=><Button key={action} variant={options.action===action?'default':'ghost'} size="sm" aria-pressed={options.action===action} onClick={()=>patch({action})}>{action==='idle'?'Idle':action==='run'?'Running':'Walking'}</Button>)}</div>
    <div className="flex flex-wrap gap-1" role="group" aria-label="Model comparison angle">{[['Front','down'],['Three-quarter','down_left'],['Side','left']].map(([label,direction])=><Button key={direction} size="sm" variant={options.rotation===null&&options.direction===direction?'secondary':'outline'} aria-pressed={options.rotation===null&&options.direction===direction} onClick={()=>patch({direction,rotation:null})}>{label}</Button>)}</div>
    <Select value={options.direction} onValueChange={direction=>patch({direction,rotation:null})}><SelectTrigger aria-label="Facing" className="w-40"><SelectValue/></SelectTrigger><SelectContent>{comparisonDirections.map(d=><SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select>
    <Button variant="outline" onClick={()=>patch({paused:!options.paused})}>{options.paused?<Play className="size-4"/>:<Pause className="size-4"/>}{options.paused?'Play':'Pause'}</Button>
    <div className="flex items-center gap-2" role="group" aria-label="Comparison zoom"><Button variant="outline" size="icon" aria-label="Zoom out" disabled={options.zoom<=2} onClick={()=>patch({zoom:options.zoom-1})}><Minus className="size-4"/></Button><span className="min-w-8 text-center text-sm tabular-nums">{options.zoom}×</span><Button variant="outline" size="icon" aria-label="Zoom in" disabled={options.zoom>=6} onClick={()=>patch({zoom:options.zoom+1})}><Plus className="size-4"/></Button></div>
  </div>
  const headers=<div className="grid grid-cols-2 divide-x border-b bg-card text-center">{study.sides.map(side=><div key={side.title} className="p-3"><h2 className="font-heading text-2xl font-bold">{side.title}</h2><p className="text-xs text-muted-foreground">{side.description}</p></div>)}</div>
  return <PlayShell><PlayHeader location={study.name+' model study'} balance={0} scope="local">
    {study.id.startsWith('amber')&&<Button variant="outline" onClick={()=>{window.history.pushState(null,'',window.location.pathname+'?preview=actors&skin=amber-outrider&model=blender');window.dispatchEvent(new PopStateEvent('popstate'))}}>Blender revision · all actions</Button>}
    {study.id==='amber'&&<Button variant="outline" onClick={()=>{window.history.pushState(null,'',window.location.pathname+'?compare=amber-volume');window.dispatchEvent(new PopStateEvent('popstate'))}}>Fuller volume trial</Button>}
    <Button variant="outline" onClick={()=>{window.history.pushState(null,'',window.location.pathname+'?compare='+(study.id==='amber'?'yae':'amber'));window.dispatchEvent(new PopStateEvent('popstate'))}}>{study.id==='amber'?'Yae Miko study':'Amber study'}</Button>
    <Button variant="outline" onClick={()=>{const url=window.location.pathname+study.creatorQuery;window.history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'))}}><ArrowLeft className="size-4"/>Character creator</Button></PlayHeader>
    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"><div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-heading text-4xl font-bold">{study.heading}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{study.description}</p></div><Button variant="outline" disabled={status!=='ready'} onClick={()=>{patch({zoom:6});setInspect(true)}}><Expand className="size-4"/>Inspect model & textures</Button></div>
      {controls}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2"><ModelRotationControls degrees={options.rotation??directionRotation(options.direction)} onChange={rotation=>patch({rotation})} onReset={()=>patch({direction:'down_left',rotation:null,zoom:5})}/><p className="text-xs text-muted-foreground">Drag to rotate · Ctrl + wheel to zoom</p></div>
      <section className="overflow-hidden rounded-md border" aria-label={study.name+' model comparison'}>{headers}<div className="relative h-[430px] sm:h-[480px]"><AmberField study={study} key={study.id+attempt} options={{...options,paused:options.paused||inspect}} onViewChange={patch} onReady={()=>setStatus('ready')} onError={m=>{setStatus('error');setError(m)}} capture={capture}/>{status==='loading'&&<div role="status" className="absolute inset-0 grid place-items-center bg-background"><p className="flex items-center gap-2 text-sm"><LoaderCircle className="size-5 motion-safe:animate-spin"/>Preparing both models…</p></div>}{error&&<div role="alert" className="absolute inset-0 grid place-items-center bg-background p-6 text-center text-sm"><div><p>{error}</p><Button variant="outline" className="mt-3" onClick={()=>{setError('');setStatus('loading');setAttempt(n=>n+1)}}>Retry comparison</Button></div></div>}</div></section>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm text-muted-foreground">{study.summary}</p><Button variant="outline" disabled={status!=='ready'} onClick={()=>{const png=capture.current?.();if(!png)return;const a=document.createElement('a');a.href=png;a.download=study.id+'-'+options.action+'-'+options.direction+'.png';a.click()}}><Download className="size-4"/>Save native comparison</Button></div>
      <details className="rounded-md border bg-card p-4"><summary className="cursor-pointer font-heading text-xl font-semibold">Appearance and style references</summary><div className="mt-4 grid items-start gap-5 sm:grid-cols-[1fr_220px]"><div className="space-y-4">{study.references.slice(0,-1).map(ref=><img key={ref.src} src={ref.src} alt={ref.alt} className="w-full rounded-md [image-rendering:pixelated]"/>)}<p className="text-xs text-muted-foreground">{study.referenceNote}</p></div>{study.references.slice(-1).map(ref=><img key={ref.src} src={ref.src} alt={ref.alt} className="mx-auto max-h-80 object-contain"/>)}</div></details>
    </div></main>
    <Dialog open={inspect} onOpenChange={setInspect}><DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-6xl"><DialogHeader><DialogTitle className="font-heading text-3xl">{study.name+' · model & textures'}</DialogTitle><DialogDescription>Inspect the same animated 3D models, or examine the painted texture surfaces.</DialogDescription></DialogHeader><Tabs defaultValue="model"><TabsList className="rounded-md"><TabsTrigger value="model">Animated models</TabsTrigger><TabsTrigger value="textures">Painted textures</TabsTrigger></TabsList><TabsContent value="model" className="space-y-4">{controls}<section className="overflow-hidden rounded-md border">{headers}<div className="relative h-[440px] sm:h-[580px]"><AmberField study={study} options={options} onViewChange={patch} onReady={()=>{}} onError={setError}/></div></section></TabsContent><TabsContent value="textures"><TextureSheet study={study}/></TabsContent></Tabs></DialogContent></Dialog>
  </PlayShell>
}
