import {useEffect,useRef,useState,type RefObject} from 'react'
import {ArrowLeft,ArrowRight,Bone,Box,Palette,Activity,Footprints,ArrowUp,Music2,Pause,Play,RotateCcw,Repeat,Layers,Minus,Plus,LoaderCircle,Scan,ExternalLink} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Slider} from '@/components/ui/slider'
import {Switch} from '@/components/ui/switch'
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select'
import {PlayHeader,PlayShell} from './shared/play-chrome'
import {actorLesson,lessonPhase,PHASE_SIZE,WALKTHROUGH_END,type ExplainerFocus,type ExplainerView} from '@/game/actor-explainer/lesson'
import type {ActorExplainerScene} from '@/game/actor-explainer/scene'
import {navigateActorPreview,navigateSkinStudio} from '@/game/play-navigation'
import {loadGameFonts} from '@/game/font-loader'

const phaseIcons=[Bone,Layers,Box,Palette,Activity,Footprints,ArrowUp,Music2]
const surfaces=[{id:'anime-face',label:'Face'},{id:'hair-crown',label:'Hair'},{id:'bodice',label:'Bodice'},{id:'bow',label:'Ribbon'},{id:'cape',label:'Cape'}]
const views:[ExplainerView,string][]=[['front','Front'],['quarter','Three-quarter'],['side','Side']]
const focusParts:[ExplainerFocus,string][]=[['none','All parts'],['ribbon','Ribbon'],['hair','Hair'],['cape','Cape']]
function TextureDetail({engine,ready}:{engine:RefObject<ActorExplainerScene|null>;ready:boolean}){
  const [surface,setSurface]=useState('bow'),canvas=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const source=engine.current?.texture(surface),target=canvas.current
    if(!source||!target)return
    target.width=source.width;target.height=source.height
    const context=target.getContext('2d')!;context.imageSmoothingEnabled=false;context.clearRect(0,0,target.width,target.height);context.drawImage(source,0,0)
  },[surface,ready,engine])
  return <section className="mt-5 border-t pt-4" aria-label="Amber texture inspector">
    <div className="flex items-center justify-between gap-3"><h3 className="font-heading text-xl font-semibold">Amber’s actual texture</h3><Select value={surface} onValueChange={setSurface}><SelectTrigger aria-label="Inspect a texture" className="h-8 w-28"><SelectValue/></SelectTrigger><SelectContent>{surfaces.map(row=><SelectItem key={row.id} value={row.id}>{row.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="mt-3 flex items-center gap-4"><div className="grid h-36 w-28 shrink-0 place-items-center rounded-md border bg-[#e9e5dc]"><canvas ref={canvas} className="h-32 w-auto [image-rendering:pixelated]" role="img" aria-label={`Original ${surfaces.find(row=>row.id===surface)?.label} texture mapped onto Amber`}/></div><p className="text-xs leading-relaxed text-muted-foreground">This is the flat image used by her material. UV coordinates tell each polygon which pixels to display. Her ribbon’s outline comes from its mesh.</p></div>
    <Button size="sm" variant="outline" className="mt-3 w-full" onClick={navigateSkinStudio}><Palette/>Open the texture studio<ExternalLink/></Button>
  </section>
}
function Adjustment({label,value,min,max,step,suffix='',onChange}:{label:string;value:number;min:number;max:number;step:number;suffix?:string;onChange:(value:number)=>void}){
  return <div className="space-y-2"><div className="flex justify-between gap-3 text-sm"><span>{label}</span><span className="tabular-nums text-muted-foreground">{Number(value.toFixed(1))}{suffix}</span></div><Slider aria-label={label} value={[value]} min={min} max={max} step={step} onValueChange={values=>onChange(values[0])}/></div>
}
export default function ActorExplainer(){
  const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[loop,setLoop]=useState(false),[speed,setSpeed]=useState('1')
  const [zoom,setZoom]=useState(1),[joints,setJoints]=useState(false),[focus,setFocus]=useState<ExplainerFocus>('none')
  const [move,setMove]=useState(true),[jumpHeight,setJumpHeight]=useState(12),[danceEnergy,setDanceEnergy]=useState(1)
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
  const [reducedMotion,setReducedMotion]=useState(false)
  const amberHost=useRef<HTMLDivElement>(null),engine=useRef<ActorExplainerScene|null>(null)
  const phase=lessonPhase(progress),lesson=actorLesson[phase],Icon=phaseIcons[phase],fraction=(progress-phase*PHASE_SIZE)/PHASE_SIZE
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{setReducedMotion(media.matches);if(media.matches)setPlaying(false)}
    update();media.addEventListener('change',update)
    const visibility=()=>{if(document.hidden)setPlaying(false)};document.addEventListener('visibilitychange',visibility)
    return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility)}
  },[])
  useEffect(()=>{
    let cancelled=false;setReady(false);setError('');setPlaying(false)
    Promise.all([import('@/game/actor-explainer/scene'),loadGameFonts()]).then(async([{ActorExplainerScene}])=>{
      if(cancelled||!amberHost.current)return
      const scene=await ActorExplainerScene.create(amberHost.current,message=>{if(!cancelled){setError(message);setPlaying(false);setReady(false)}},setZoom)
      if(cancelled){scene.dispose();return}
      engine.current=scene;setReady(true)
    }).catch(reason=>{if(!cancelled)setError(reason instanceof Error?reason.message:'The model lesson could not open. Retry to load it again.')})
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null}
  },[attempt])
  useEffect(()=>{engine.current?.setState({progress,zoom,joints,focus,move,jumpHeight,danceEnergy})},[progress,zoom,joints,focus,move,jumpHeight,danceEnergy,ready])
  useEffect(()=>{if(phase<1||phase>3)setFocus('none')},[phase])
  useEffect(()=>{
    if(!playing||!ready)return
    let raf=0,lastPaint=performance.now()
    const tick=(now:number)=>{
      if(now-lastPaint>=32){
        const delta=Math.min(100,now-lastPaint)*Number(speed)/35;lastPaint=now
        setProgress(value=>{
          const next=value+delta
          if(loop){const start=lessonPhase(value)*PHASE_SIZE;return start+(next-start)%PHASE_SIZE}
          return Math.min(WALKTHROUGH_END,next)
        })
      }
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)
  },[playing,ready,loop,speed])
  useEffect(()=>{if(progress>=WALKTHROUGH_END&&!loop)setPlaying(false)},[progress,loop])
  const choosePhase=(index:number)=>{setPlaying(false);setProgress(Math.max(0,Math.min(7,index))*PHASE_SIZE+(index>=4?35:0))}
  const scrub=(value:number)=>{setPlaying(false);setProgress(value)}
  return <PlayShell>
    <PlayHeader location="How characters work" details="Amber’s interactive walkthrough" balance={null} scope="local"><Button size="sm" variant="outline" onClick={navigateActorPreview}><ArrowLeft/><span className="hidden sm:inline">Character creator</span></Button></PlayHeader>
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b px-4 py-3 md:px-6">
        <h1 className="font-heading text-3xl font-semibold leading-tight">From joints to Amber.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Rotate the preview and explore the stages below it. Each layer is explained on the right.</p>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[300px_minmax(0,1fr)] md:overflow-hidden md:p-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-6 xl:p-6">
        <div className="flex min-h-0 flex-col gap-4 md:overflow-y-auto" aria-label="Amber demonstration and controls">
          <section aria-label="Amber’s live demonstration" className="relative shrink-0 overflow-hidden rounded-md border border-[#c8d2be] bg-[#e4eadb]">
            <figure className="flex flex-col">
              <figcaption className="shrink-0 px-3 pt-3 text-center"><strong className="font-heading text-2xl font-semibold">Amber</strong><span className="mt-0.5 block text-xs text-[#526048]">{focus!=='none'?`Highlighted ${focus} geometry`:phase===0?'Her real joint structure':phase===1?'Her wireframe geometry':phase===2?'Her unpainted model':phase===3?'Her actual painted textures':phase===5?'Walk cycle + world movement':phase===6?'Shared jump recipe':phase===7?'Shared dance action':'Idle + hair and cape motion'}</span></figcaption>
              <div ref={amberHost} tabIndex={0} role="region" aria-label="Rotate Amber by dragging, or focus here and use the arrow keys. Scroll to zoom." onPointerDown={event=>event.currentTarget.focus({preventScroll:true})} className="grid h-52 w-full shrink-0 cursor-grab touch-none place-items-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:cursor-grabbing"/>
              <p className="shrink-0 px-3 pb-3 text-center text-xs text-[#526048]">Drag to rotate · Scroll to zoom</p>
            </figure>
            {(!ready||error)&&<div className="absolute inset-0 z-20 grid place-items-center bg-[#e4eadb]/95 p-5"><div className="max-w-sm text-center">{error?<><p role="alert" className="text-sm leading-relaxed">{error}</p><Button className="mt-3" size="sm" onClick={()=>{engine.current?.dispose();engine.current=null;setAttempt(value=>value+1)}}><RotateCcw/>Retry preview</Button></>:<><LoaderCircle className="mx-auto mb-3 size-5 motion-safe:animate-spin"/><p role="status" className="text-sm">Preparing Amber’s rig and textures…</p></>}</div></div>}
          </section>
          <section className="shrink-0 rounded-md border bg-background p-3" aria-label="Controls and stages">
            <div className="mb-2 flex items-center justify-between gap-3"><h2 className="font-heading text-xl font-semibold">Controls & stages</h2><span className="text-xs tabular-nums text-muted-foreground">{phase+1} / {actorLesson.length}</span></div>
            <Select value={String(phase)} onValueChange={value=>choosePhase(Number(value))}><SelectTrigger aria-label="Character creation stage" className="h-9 w-full"><SelectValue/></SelectTrigger><SelectContent>{actorLesson.map((row,index)=>{const PhaseIcon=phaseIcons[index];return <SelectItem key={row.short} value={String(index)}><PhaseIcon className="size-3.5"/>{index+1}. {row.title}</SelectItem>})}</SelectContent></Select>
            <div className="mt-3 flex items-center gap-2"><Slider aria-label="Character creation walkthrough" aria-valuetext={`${lesson.title}, ${Math.round(fraction*100)} percent through this phase`} value={[progress]} min={0} max={WALKTHROUGH_END} step={.1} disabled={!ready} onValueChange={values=>scrub(values[0])}/><span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{Math.round(progress/8)}%</span></div>
            <div className="mt-3 flex flex-wrap items-center gap-1"><Button size="icon-sm" variant="outline" aria-label="Previous stage" title="Previous stage" disabled={phase===0} onClick={()=>choosePhase(phase-1)}><ArrowLeft/></Button><Button size="icon-sm" disabled={!ready} aria-label={playing?'Pause walkthrough':loop?'Play current stage':'Play walkthrough'} title={playing?'Pause':loop?'Play current stage':'Play walkthrough'} onClick={()=>{if(!playing&&progress>=WALKTHROUGH_END)setProgress(0);setPlaying(value=>!value)}}>{playing?<Pause/>:<Play/>}</Button><Button size="icon-sm" variant="outline" aria-label="Next stage" title="Next stage" disabled={phase===7} onClick={()=>choosePhase(phase+1)}><ArrowRight/></Button><Button size="icon-sm" variant="ghost" aria-label="Restart walkthrough" title="Restart walkthrough" onClick={()=>{setPlaying(false);setProgress(0)}}><RotateCcw/></Button><Button size="icon-sm" variant={loop?'secondary':'ghost'} aria-label="Loop current stage" title="Loop current stage" aria-pressed={loop} onClick={()=>setLoop(value=>!value)}><Repeat/></Button><Select value={speed} onValueChange={setSpeed}><SelectTrigger aria-label="Playback speed" className="ml-auto h-8 w-[68px]"><SelectValue/></SelectTrigger><SelectContent>{['0.5','1','1.5','2'].map(value=><SelectItem key={value} value={value}>{value}×</SelectItem>)}</SelectContent></Select></div>
            <div className="mt-3 flex flex-wrap gap-1 border-t pt-3" role="group" aria-label="Preset view angles">{views.map(([value,label])=><Button key={value} size="sm" className="px-2 text-xs" variant="outline" disabled={!ready} onClick={()=>engine.current?.view(value)}>{label}</Button>)}</div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1"><Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={!ready||zoom<=.7} onClick={()=>setZoom(value=>Math.max(.7,value-.15))}><Minus/></Button><Button size="sm" variant="ghost" disabled={!ready} onClick={()=>{setZoom(1);engine.current?.view('quarter')}}><Scan/>Fit</Button><Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={!ready||zoom>=1.45} onClick={()=>setZoom(value=>Math.min(1.45,value+.15))}><Plus/></Button></div><label className="flex items-center gap-2 text-xs"><Switch checked={joints} onCheckedChange={setJoints} disabled={phase===0} aria-label="Show joints over the model"/>Joints</label></div>
            {phase>=1&&phase<=3&&<div className="mt-3 border-t pt-3"><p className="mb-2 text-xs font-medium">Highlight geometry</p><div className="flex flex-wrap gap-1">{focusParts.map(([value,label])=><Button key={value} size="sm" className="px-2 text-xs" variant={focus===value?'secondary':'outline'} aria-pressed={focus===value} onClick={()=>setFocus(value)}>{label}</Button>)}</div></div>}
            {phase===5&&<label className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-xs"><span>World movement<span className="mt-1 block text-muted-foreground">Off = walk in place</span></span><Switch checked={move} onCheckedChange={setMove} aria-label="Move through the world"/></label>}
            {phase===6&&<div className="mt-3 space-y-3 border-t pt-3"><Adjustment label="Jump height" value={jumpHeight} min={5} max={18} step={1} suffix=" units" onChange={setJumpHeight}/><div className="grid grid-cols-4 gap-1 text-center text-[11px]" aria-label="Jump timing">{['Crouch','Rise','Descend','Land'].map((label,index)=><span key={label} className={`rounded-sm px-1 py-2 ${index===(fraction<.18?0:fraction<.5?1:fraction<.82?2:3)?'bg-secondary font-semibold':'bg-muted/40 text-muted-foreground'}`}>{label}</span>)}</div></div>}
            {phase===7&&<div className="mt-3 border-t pt-3"><Adjustment label="Dance energy" value={danceEnergy} min={.4} max={1.8} step={.1} suffix="×" onChange={setDanceEnergy}/></div>}
            {reducedMotion&&<p className="mt-2 text-xs text-muted-foreground">Motion starts only when you press Play.</p>}
          </section>
        </div>
        <aside className="min-h-0 rounded-md border bg-background px-5 py-5 md:overflow-y-auto md:px-6 lg:px-8 lg:py-7" aria-label="Current stage explanation">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4"/><span>Layer {phase+1} of {actorLesson.length}</span></div>
          <h2 className="mt-2 font-heading text-3xl font-semibold leading-tight lg:text-4xl" aria-live="polite">{lesson.title}</h2>
          <p className="mt-4 max-w-3xl text-lg font-medium leading-relaxed">{lesson.summary}</p><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground lg:text-base">{lesson.body}</p>
          <dl className="mt-6 grid gap-5 border-y py-5 text-sm lg:grid-cols-2"><div><dt className="font-semibold">On Amber</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{lesson.amber}</dd></div><div><dt className="font-semibold">What stays shared</dt><dd className="mt-1 leading-relaxed text-muted-foreground">{lesson.shared}</dd></div></dl>
          {phase===3&&<TextureDetail engine={engine} ready={ready}/>}
          {phase===6&&<p className="mt-5 text-sm leading-relaxed text-muted-foreground">The height control adjusts a local recipe layered onto the shared joints. It does not install a new gameplay ability.</p>}
          <div className="mt-6"><h3 className="font-heading text-2xl font-semibold">Try it</h3><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{lesson.try}</p></div>
          <div className="mt-6 rounded-md bg-muted/60 p-4"><p className="text-sm font-semibold">{lesson.term}</p><p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{lesson.definition}</p></div>
          <p className="mt-5 text-sm font-medium leading-relaxed">{lesson.recipe}</p>
        </aside>
      </div>
    </main>
  </PlayShell>
}
