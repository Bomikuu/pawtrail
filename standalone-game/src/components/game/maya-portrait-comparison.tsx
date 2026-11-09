import {useEffect,useRef,useState,type ReactNode} from 'react'
import {ArrowLeft,Download,Pause,Play,RotateCcw,PawPrint} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Slider} from '@/components/ui/slider'
import {reference,initialCalibration,type Calibration,type LandmarkPositions} from '@/game/actor-rig/maya/reference'
import {comparePortrait} from '@/game/actor-rig/maya/metrics'
import {HumanPortraitRenderer} from '@/game/actor-rig/human-portrait'
import {AuthoredMayaRenderer,loadMayaManifest,type MayaManifest} from '@/game/actor-rig/maya/authored'
import {gameAppearance} from '@/game/actor-rig/game-appearances'
import type {PortraitExpression} from '@/game/actor-rig/portrait-state'
import '@/game/theme.css'

type Renderer=HumanPortraitRenderer|AuthoredMayaRenderer
type Comparison={source:ImageData;render:ImageData;points:LandmarkPositions;metrics:ReturnType<typeof comparePortrait>}
const download=(name:string,value:string,type='application/json')=>{const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function imageCanvas(data:ImageData){const canvas=document.createElement('canvas');canvas.width=data.width;canvas.height=data.height;canvas.getContext('2d')!.putImageData(data,0,0);return canvas}
function PixelPanel({label,data,children}:{label:string;data?:ImageData;children?:ReactNode}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{if(data&&ref.current){ref.current.width=data.width;ref.current.height=data.height;ref.current.getContext('2d')!.putImageData(data,0,0)}},[data])
  return <figure className="min-w-0"><figcaption className="mb-2 flex items-center justify-between gap-2 font-heading text-xl font-semibold">{label}{children}</figcaption><div className="overflow-auto rounded-md border border-[#bca486] bg-[#eee9da] p-3"><canvas ref={ref} width={192} height={192} className="mx-auto size-48 [image-rendering:pixelated] lg:size-96" aria-label={label}/></div></figure>
}

export default function MayaPortraitComparison(){
  const [mode,setMode]=useState<'prototype'|'authored'>('prototype'),[manifest,setManifest]=useState<MayaManifest|null>(null)
  const [calibration,setCalibration]=useState<Calibration>(()=>structuredClone(initialCalibration))
  const [savedCalibration,setSavedCalibration]=useState<Calibration>(()=>structuredClone(initialCalibration))
  const [comparison,setComparison]=useState<Comparison|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true)
  const [opacity,setOpacity]=useState(50),[marks,setMarks]=useState(true),[showSilhouette,setShowSilhouette]=useState(false)
  const [animate,setAnimate]=useState(true)
  const [spinning,setSpinning]=useState(false),[yaw,setYaw]=useState(initialCalibration.yaw),[expression,setExpression]=useState<PortraitExpression>('idle'),[variation,setVariation]=useState(false)
  const [renderers,setRenderers]=useState<{main:Renderer;preview:Renderer}|null>(null),preview=useRef<HTMLCanvasElement>(null)
  const options=useRef({spinning,yaw,expression,animate});options.current={spinning,yaw,expression,animate}
  const draft=JSON.stringify(calibration)!==JSON.stringify(savedCalibration)
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const change=()=>{if(media.matches){setAnimate(false);setSpinning(false)}};change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[])
  useEffect(()=>{void loadMayaManifest().then(value=>{setManifest(value);if(value.calibration){setSavedCalibration(structuredClone(value.calibration));setCalibration(structuredClone(value.calibration));setYaw(value.calibration.yaw)}}).catch(e=>setError(e.message))},[])
  useEffect(()=>{
    let cancelled=false,main:Renderer|undefined,secondary:Renderer|undefined
    setLoading(true);setError('');setComparison(null);setRenderers(null)
    const run=async()=>{try{
      const base=gameAppearance('maya')!.appearance,variant=structuredClone(base)
      if(variation){Object.assign(variant.colors,{hair:'#914a34',hairLight:'#c9794e',hairShade:'#542a24',hairSheen:'#e7ad6f',jacket:'#477e79',jacketDark:'#285650',jacketLight:'#78a59b'})}
      if(mode==='authored'){
        if(!manifest?.modelUrl)throw new Error('The authored Maya GLB has not been supplied. Use the procedural baseline for diagnosis.')
        main=await AuthoredMayaRenderer.create(base,manifest,calibration)
      }else main=await HumanPortraitRenderer.create(base,1,calibration)
      if(cancelled){main.dispose();return}
      secondary=mode==='authored'?await AuthoredMayaRenderer.create(variant,manifest!,calibration):await HumanPortraitRenderer.create(variant,1,calibration)
      if(cancelled){main.dispose();secondary.dispose();return}
      const image=new Image();image.src=reference.referenceUrl;await image.decode()
      if(cancelled){main.dispose();secondary.dispose();return}
      const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const p=canvas.getContext('2d')!;p.imageSmoothingEnabled=false;p.drawImage(image,0,0,192,192)
      const source=p.getImageData(0,0,192,192),render=main.frame(0,{yaw:calibration.yaw,expression:'idle',steady:true,headTilt:calibration.headTilt}),points=main.getLandmarks()
      setComparison({source,render,points,metrics:comparePortrait(source,render,points)});setRenderers({main,preview:secondary});setLoading(false)
    }catch(e){main?.dispose();secondary?.dispose();if(!cancelled){setError(e instanceof Error?e.message:'Comparison could not open.');setLoading(false)}}}
    void run();return()=>{cancelled=true;main?.dispose();secondary?.dispose()}
  // Only an explicit calibration edit, candidate change or appearance variation rebuilds the rig.
  },[mode,manifest,JSON.stringify(calibration),variation])
  useEffect(()=>{
    if(!renderers)return
    let raf=0,last=-Infinity,start=0
    const step=(time:number)=>{
      if(!start)start=time
      if(!document.hidden&&time-last>=1000/12){
        const elapsed=time-start,o=options.current,frame=o.animate?Math.floor(elapsed*12/1000)%96:0
        const angle=o.spinning?calibration.yaw+elapsed/8000*Math.PI*2:o.yaw
        try{const data=renderers.preview.frame(frame,{yaw:angle,expression:o.expression,steady:true,headTilt:calibration.headTilt});preview.current?.getContext('2d')?.putImageData(data,0,0)}catch(e){setError(e instanceof Error?e.message:'Portrait interrupted.');return}
        last=time
      }
      if(options.current.animate||options.current.spinning)raf=requestAnimationFrame(step)
    }
    const wake=()=>{cancelAnimationFrame(raf);if(!document.hidden){start=0;raf=requestAnimationFrame(step)}}
    document.addEventListener('visibilitychange',wake);wake()
    return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',wake)}
  },[renderers,calibration,animate,spinning,yaw,expression])
  const overlay=(()=>{
    if(!comparison)return undefined
    const canvas=imageCanvas(comparison.source),p=canvas.getContext('2d')!
    p.globalAlpha=opacity/100;p.drawImage(imageCanvas(comparison.render),0,0);p.globalAlpha=1
    if(marks)for(const item of comparison.metrics.landmarks){
      p.strokeStyle='#168760';p.lineWidth=1;p.strokeRect(item.target[0]-2,item.target[1]-2,4,4)
      if(item.actual){p.strokeStyle='#d74570';p.beginPath();p.moveTo(...item.target);p.lineTo(...item.actual);p.stroke();p.strokeRect(item.actual[0]-2,item.actual[1]-2,4,4)}
    }
    return p.getImageData(0,0,192,192)
  })()
  const report=()=>{if(!comparison)return;const {difference,silhouette,...metrics}=comparison.metrics;download('maya-reference-comparison.json',JSON.stringify({candidate:mode,assetStatus:manifest?.status??'unknown',calibration,source:'Original Maya illustration',note:'Landmarks are annotated reference targets and projected mesh/rig anchors, not image-feature detections. Alignment is not artistic acceptance.',metrics},null,2))}
  return <main className="game-surface min-h-dvh bg-[#fff8ec] px-4 py-5 font-body text-[#45291e] sm:px-6">
    <div className="mx-auto max-w-[1600px]"><header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 rounded-md text-[#553421]"><a href="/play?explore=1"><ArrowLeft className="size-4"/>Back to game</a></Button><h1 className="font-heading text-4xl font-bold">Match Maya to the drawing</h1><p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#805d3c]">The original is the specification. Reference comparisons stay neutral, steady and on the same saved camera. Native 192×192; desktop panels enlarge exactly 2×.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-md" onClick={report} disabled={!comparison}><Download className="size-4"/>Export measurements</Button><Button asChild variant="outline" className="rounded-md"><a href="/pawtrail-game/game-assets/maya-reference-v5/artist-handoff.zip" download><Download className="size-4"/>Artist handoff</a></Button></div></header>
    <p role="status" className="mb-5 rounded-md border border-[#c39b58] bg-[#fff0ce] px-4 py-3 text-sm leading-relaxed">{manifest?.modelUrl?'An authored candidate is installed. Inspect its reference view and all angles before accepting it.':'Authored Maya GLB not installed. The procedural baseline is diagnostic and has not passed likeness review.'}</p>
    <div className="mb-5 flex flex-wrap gap-2"><Button variant={mode==='prototype'?'secondary':'outline'} aria-pressed={mode==='prototype'} onClick={()=>setMode('prototype')}>Procedural baseline</Button><Button variant={mode==='authored'?'secondary':'outline'} aria-pressed={mode==='authored'} disabled={!manifest?.modelUrl} onClick={()=>setMode('authored')}>Authored GLB candidate</Button><span className="self-center text-xs text-[#805d3c]">{draft?'Draft calibration — explicit edits, not auto-fit':'Saved calibration v1 — no auto-fit'}</span></div>
    {error&&<p role="alert" className="mb-5 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]"><section className="min-w-0"><div className="grid gap-6 sm:grid-cols-2">
      <PixelPanel label="Original illustration" data={comparison?.source}/><PixelPanel label="Pinned camera · neutral render" data={comparison?.render}/>
      <PixelPanel label="Overlay + landmarks" data={overlay}/><PixelPanel label={showSilhouette?'Silhouette outlines':'Absolute difference ×3'} data={showSilhouette?comparison?.metrics.silhouette:comparison?.metrics.difference}><Button size="sm" variant="outline" className="h-7 rounded-md px-2 text-xs" onClick={()=>setShowSilhouette(v=>!v)}>{showSilhouette?'Difference':'Silhouette'}</Button></PixelPanel>
    </div>{loading&&<p role="status" className="mt-4 flex items-center gap-2 text-sm"><PawPrint className="size-4 motion-safe:animate-pulse"/>Preparing reference comparison…</p>}
    <div className="mt-5 flex flex-wrap items-center gap-4"><label htmlFor="overlay-opacity" className="text-sm font-semibold">Render opacity · {opacity}%</label><Slider id="overlay-opacity" aria-label="Render overlay opacity" min={0} max={100} step={1} value={[opacity]} onValueChange={v=>setOpacity(v[0])} className="max-w-64"/><Button variant="outline" size="sm" aria-pressed={marks} onClick={()=>setMarks(v=>!v)}>Landmarks {marks?'on':'off'}</Button></div><p className="mt-2 text-xs text-[#805d3c]">Reference: green. Rendered anchors: pink. Matching silhouette: pale yellow. Missing landmarks are unavailable, not zero error.</p>
    </section><aside className="space-y-5">
      <section className="border-b border-[#d9c8af] pb-5"><h2 className="font-heading text-2xl font-semibold">Rotate and inspect</h2><p className="mb-3 mt-1 text-xs leading-relaxed text-[#805d3c]">This preview changes angle/expression. The reference comparison stays locked.</p><canvas ref={preview} width={192} height={192} className="mx-auto size-48 rounded-md bg-[#e2e7cf] [image-rendering:pixelated]" aria-label="Maya 3D turntable preview"/>
      <div className="mt-3 grid grid-cols-3 gap-2">{[['Reference',calibration.yaw],['Front',0],['Back',Math.PI],['¾ left',-Math.PI/4],['Left',-Math.PI/2],['¾ right',Math.PI/4],['Right',Math.PI/2]].map(([name,angle])=><Button key={name} variant="outline" size="sm" className="rounded-md text-xs" onClick={()=>{setSpinning(false);setYaw(Number(angle))}}>{name}</Button>)}<Button variant="outline" size="sm" className="rounded-md text-xs" onClick={()=>setSpinning(v=>!v)}>{spinning?<Pause className="size-3"/>:<Play className="size-3"/>}360°</Button></div>
      <div className="mt-3 grid grid-cols-2 gap-2">{(['idle','smile','happy','talking'] as const).map(value=><Button key={value} variant={expression===value?'secondary':'outline'} aria-pressed={expression===value} size="sm" className="rounded-md text-xs capitalize" onClick={()=>setExpression(value)}>{value==='idle'?'Neutral':value}</Button>)}</div>
      <Button variant="outline" size="sm" className="mt-3 w-full rounded-md text-xs" aria-pressed={!animate} onClick={()=>setAnimate(v=>!v)}>{animate?<Pause className="size-3"/>:<Play className="size-3"/>}{animate?'Pause facial animation':'Play facial animation'}</Button>
      <Button variant="outline" size="sm" className="mt-3 w-full rounded-md text-xs" aria-pressed={variation} disabled={mode==='authored'&&!manifest?.semanticMasks.length} onClick={()=>setVariation(v=>!v)}>{variation?'Original colors':'Copper hair + teal vest variation'}</Button>
      </section>
      <section><h2 className="font-heading text-2xl font-semibold">Measured discrepancy</h2><dl className="mt-2 space-y-2 text-sm"><div className="flex justify-between gap-2"><dt>Alpha silhouette IoU</dt><dd className="tabular-nums">{comparison?(comparison.metrics.iou*100).toFixed(1)+'%':'—'}</dd></div><div className="flex justify-between gap-2"><dt>Mean RGB error</dt><dd className="tabular-nums">{comparison?comparison.metrics.meanColorError.toFixed(1)+' / 255':'—'}</dd></div><div className="flex justify-between gap-2"><dt>Clear landmark mean</dt><dd className="tabular-nums">{comparison?.metrics.meanLandmarkError?.toFixed(1)??'—'} px</dd></div></dl><p className="mt-3 text-xs leading-relaxed text-[#805d3c]">The 1–2 px landmark target is a calibration goal. These are manually annotated source features and projected mesh anchors; they do not prove artistic likeness.</p></section>
      <details className="rounded-md border border-[#d9c8af] p-3"><summary className="cursor-pointer font-semibold">Explicit calibration draft</summary><p className="mt-2 text-xs text-[#805d3c]">Camera values use portrait world units; yaw and tilt use radians. This starting scaffold is not an accepted likeness calibration.</p><div key={JSON.stringify(calibration)} className="mt-3 grid grid-cols-2 gap-3">{[['Height',calibration.height],['Reference yaw',calibration.yaw],['Head tilt',calibration.headTilt],['Target Y',calibration.target[1]]].map(([label,value])=><label key={label} className="text-xs">{label}<Input aria-label={String(label)} type="number" step="0.01" defaultValue={Number(value).toFixed(3)} className="mt-1 rounded-md" onBlur={e=>{const v=Number(e.target.value);if(!Number.isFinite(v))return;setCalibration(c=>label==='Height'?{...c,height:Math.max(15,Math.min(45,v))}:label==='Reference yaw'?{...c,yaw:Math.max(-Math.PI,Math.min(Math.PI,v))}:label==='Head tilt'?{...c,headTilt:Math.max(-.5,Math.min(.5,v))}:{...c,target:[c.target[0],v,c.target[2]]})}}/></label>)}</div><Button variant="ghost" size="sm" className="mt-3 rounded-md" onClick={()=>setCalibration(structuredClone(savedCalibration))}><RotateCcw className="size-3"/>Reset saved camera</Button><Button variant="outline" size="sm" className="mt-2 w-full rounded-md" onClick={()=>download('maya-calibration-draft.json',JSON.stringify(calibration,null,2))}>Export calibration draft</Button></details>
    </aside></div>
    <section className="mt-7 overflow-auto border-t border-[#d9c8af] pt-5"><h2 className="font-heading text-2xl font-semibold">Facial and silhouette landmarks</h2><table className="mt-3 w-full min-w-[600px] text-left text-sm"><thead><tr className="border-b border-[#d9c8af]"><th className="p-2">Feature</th><th className="p-2">Reference at 192 px</th><th className="p-2">Projected anchor</th><th className="p-2">Error</th><th className="p-2">Source confidence</th></tr></thead><tbody>{comparison?.metrics.landmarks.map(item=><tr key={item.id} className="border-b border-[#e7dccb]"><td className="p-2">{item.label}</td><td className="p-2 tabular-nums">{item.target.map(v=>v.toFixed(1)).join(', ')}</td><td className="p-2 tabular-nums">{item.actual?.map(v=>v.toFixed(1)).join(', ')??'Unavailable'}</td><td className={`p-2 tabular-nums ${item.error!==null&&item.error>2?'text-red-800':''}`}>{item.error===null?'Unavailable':item.error.toFixed(1)+' px'}</td><td className="p-2">{item.confidence}</td></tr>)}</tbody></table></section>
    <p className="mt-5 max-w-4xl text-xs leading-relaxed text-[#805d3c]">Unseen profiles and back require authored interpretation. Required artist assets: Maya-specific head/hair/bust GLB, coherent side/back paint, registered facial expression atlas, semantic color masks and named landmark nodes. The handoff includes the reference, camera, diagnostics and a clearly labeled procedural starter.</p>
    </div>
  </main>
}
