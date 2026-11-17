import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Armchair, RotateCcw, RotateCw, Users, DoorOpen, DoorClosed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SOFA_DEFAULT_COLOR } from '@/features/neighborhood/game/furniture/palette-color'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlayShell } from './shared/play-chrome'
import { SpriteCouchTrial, SPRITE_TRIAL_LABELS, type SpriteCouchState, type SpriteTrialAsset } from '@/features/neighborhood/game/furniture/sprite-couch-trial'
import { navigateFurnitureEditor } from '@/features/neighborhood/game/play-navigation'

const directions=[{name:'Move left',Icon:ArrowLeft,x:-1,y:0},{name:'Move up',Icon:ArrowUp,x:0,y:-1},{name:'Move down',Icon:ArrowDown,x:0,y:1},{name:'Move right',Icon:ArrowRight,x:1,y:0}]
const facingNames:Record<number,string>={0:'Front',90:'Left',180:'Back',270:'Right'}
const names=SPRITE_TRIAL_LABELS

export function SpriteFurnitureTrial({onBack}:{onBack:()=>void}){
  const [assetId,setAssetId]=useState<SpriteTrialAsset>(()=>{const id=new URLSearchParams(window.location.search).get('asset');return id&&Object.hasOwn(names,id)?id as SpriteTrialAsset:'sofa'})
  const canvas=useRef<HTMLCanvasElement>(null),area=useRef<HTMLDivElement>(null),scene=useRef<SpriteCouchTrial|null>(null)
  const [hex,setHex]=useState(SOFA_DEFAULT_COLOR)
  const [state,setState]=useState<SpriteCouchState|null>(null),[error,setError]=useState(''),[zoom,setZoom]=useState(2),[geometry,setGeometry]=useState(false)
  useEffect(()=>{
    let stopped=false,active:SpriteCouchTrial|undefined
    setState(null);setError('');setGeometry(false);setHex(SOFA_DEFAULT_COLOR)
    SpriteCouchTrial.create(canvas.current!,value=>{if(!stopped)setState(value)},reason=>{if(!stopped)setError(reason instanceof Error?reason.message:'The trial renderer stopped.')},assetId).then(value=>{if(stopped)value.dispose();else{active=value;scene.current=value}}).catch(reason=>{if(!stopped)setError(reason instanceof Error?reason.message:'The furniture trial could not open.')})
    return()=>{stopped=true;active?.dispose();scene.current=null}
  },[assetId])
  useEffect(()=>{
    const host=area.current!
    const resize=()=>setZoom(Math.max(1,Math.min(3,Math.floor((host.clientWidth-24)/256))))
    const observer=new ResizeObserver(resize);observer.observe(host);resize();return()=>observer.disconnect()
  },[])
  const choose=(value:SpriteTrialAsset)=>{const url=new URL(window.location.href);url.searchParams.set('asset',value);window.history.replaceState(null,'',url);setAssetId(value)}
  const color=(value:string)=>{scene.current?.setUpholsteryColor(value);setHex(value.toLowerCase())}
  const validHex=/^#[0-9a-f]{6}$/i.test(hex)
  const ready=!!state&&!error,stop=()=>scene.current?.input(0,0),isDoor=assetId==='wooden-door'
  const status=state?.primary.message||(state?.primary.contact?'Contact: '+state.primary.contact:state?.primary.seated?'Seated · '+(state.primary.seatId?.replace('-',' ')??'seat'):state?.primary.phase!=='idle'&&state?.primary.phase?(isDoor?'Using the door…':'Walking to the seat…'):isDoor?'Walk to the door and press E, or use the action below.':'Walk up to the couch, or choose a seat.')
  return <PlayShell>
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3"><Button size="icon" variant="ghost" aria-label="Return to furniture comparison" onClick={onBack}><ArrowLeft className="size-4"/></Button><div><h1 className="font-heading text-2xl font-bold">{names[assetId]} · 2D sprite trial</h1><p className="text-xs text-muted-foreground">Native artwork. Shared character interactions.</p></div></div>
      <Button variant="outline" onClick={()=>navigateFurnitureEditor(assetId)}>Furniture editor</Button>
    </header>
    <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
      <div className="mx-auto grid max-w-6xl items-start gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 overflow-hidden rounded-lg border bg-background" aria-label="Playable 2D furniture">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3"><h2 className="font-heading text-xl font-bold">{isDoor?'Open, close and walk through':'Sit, stand and walk around'}</h2><span className="text-xs text-muted-foreground" aria-live="polite">{facingNames[state?.rotation??0]} view · 2D</span></div>
          <div ref={area} className="grid min-h-80 place-items-center overflow-auto bg-secondary/40 p-3">
            <div className="relative shrink-0" style={{width:256*zoom,height:256*zoom}}>
              <canvas ref={canvas} width={256} height={256} tabIndex={0} role="application" aria-label={isDoor?'2D door trial. Arrow keys or WASD move. E opens or closes. Shift runs.':'2D couch trial. Arrow keys or WASD move. E sits or stands. R rotates. Shift runs.'} aria-describedby="sprite-trial-help" className="outline-none focus-visible:ring-2 focus-visible:ring-ring [image-rendering:pixelated]" style={{width:256*zoom,height:256*zoom}}/>
              {!isDoor&&<Button size="icon" variant="outline" disabled={!ready} aria-label="Rotate couch" title="Rotate couch · R" className="absolute left-1/2 -translate-x-1/2 rounded-full shadow-sm" style={{top:50*zoom}} onClick={()=>scene.current?.rotate()}><RotateCw className="size-4"/></Button>}
            </div>
          </div>
          <div className="space-y-3 border-t p-3">
            <p id="sprite-trial-help" className="text-xs leading-relaxed text-muted-foreground">{isDoor?'WASD or arrows move; Shift runs. E opens or closes the door. The closed panel blocks the passage; the open frame remains solid.':'WASD or arrows move. E sits or stands; R rotates; Shift runs. Use the circular button above the couch to see each view, including while seated.'}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Move trial character">{directions.map(({name,Icon,x,y})=><Button key={name} size="icon" variant="outline" disabled={!ready} aria-label={name} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);scene.current?.input(x,y)}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={event=>{if((event.key===' '||event.key==='Enter')&&!event.repeat){event.preventDefault();scene.current?.input(x,y)}}} onKeyUp={stop} onBlur={stop}><Icon className="size-4"/></Button>)}</div>
          </div>
        </section>
        <aside className="space-y-5 rounded-lg border bg-background p-4" aria-label="Furniture interaction controls">
          <section className="space-y-2"><Label htmlFor="sprite-trial-item">Furniture</Label><Select value={assetId} onValueChange={value=>choose(value as SpriteTrialAsset)}><SelectTrigger id="sprite-trial-item" className="w-full"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(names).map(([id,name])=><SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select></section>
          {state?.upholsteryColor&&<section className="space-y-3 border-t pt-4" aria-label="Upholstery coloring">
            <div><h2 className="font-heading text-xl font-bold">Upholstery color</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Change the fabric; wood, pillows and outlines stay unchanged.</p></div>
            <div className="flex items-end gap-2"><div className="space-y-1"><Label htmlFor="sofa-color" className="text-xs">Color</Label><Input id="sofa-color" aria-label="Upholstery color" type="color" value={state.upholsteryColor} disabled={!ready} className="h-9 w-12 p-1" onChange={event=>color(event.target.value)}/></div><div className="min-w-0 flex-1 space-y-1"><Label htmlFor="sofa-hex" className="text-xs">Hex</Label><Input id="sofa-hex" value={hex} maxLength={7} spellCheck={false} aria-invalid={!validHex} aria-describedby="sofa-color-help" className="h-9 font-mono" onChange={event=>setHex(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&validHex)color(hex)}}/></div><Button size="sm" variant="outline" disabled={!ready||!validHex} onClick={()=>color(hex)}>Apply color</Button></div>
            <div className="grid grid-cols-2 gap-2">{[['Ocean blue','#376db7'],['Warm cream','#e5d5b2'],['Rose','#b86a82'],['Charcoal','#343946']].map(([label,value])=><Button key={value} size="sm" variant={state.upholsteryColor===value?'secondary':'outline'} aria-pressed={state.upholsteryColor===value} onClick={()=>color(value)}><span aria-hidden="true" className="size-3 shrink-0 rounded-sm border border-foreground/20" style={{backgroundColor:value}}/>{label}</Button>)}</div>
            <Button size="sm" variant="outline" className="w-full" onClick={()=>color(SOFA_DEFAULT_COLOR)}>Restore original color</Button>
            <p id="sofa-color-help" className="text-xs leading-relaxed text-muted-foreground">{validHex?'Local preview · six-digit hex colors.':'Enter a color such as #376db7.'}</p>
          </section>}
          {isDoor?<>
            <section className="space-y-3 border-t pt-4"><h2 className="font-heading text-xl font-bold">Try the doorway</h2><div className="grid grid-cols-2 gap-2"><Button disabled={!ready||state?.door?.busy} onClick={()=>scene.current?.toggleDoor()}>{state?.door?.open?<DoorClosed className="size-4"/>:<DoorOpen className="size-4"/>}{state?.door?.open?'Close door':'Open door'}</Button><Button variant="outline" disabled={!ready||!state?.door?.busy} onClick={()=>scene.current?.stand()}>Cancel action</Button></div><Button variant="outline" className="h-auto min-h-9 w-full whitespace-normal py-2" disabled={!ready||!state?.door?.open||state.door.busy} onClick={()=>scene.current?.doorwayCompanion()}><Users className="size-4 shrink-0"/>{state?.door?.occupied?'Move companion clear':'Place companion in doorway'}</Button></section>
            <section className="space-y-2 border-t pt-4" aria-label="Door state"><h2 className="font-heading text-lg font-bold">Door state</h2><p className="text-sm font-medium">{state?.door?.open?'Open · frame stays solid':'Closed · passage blocked'}</p><p className="text-xs leading-relaxed text-muted-foreground">Closing waits for a clear doorway. This architectural door has one authored facing, with matching closed and open sprites.</p></section>
          </>:<>
            <section className="space-y-3 border-t pt-4"><h2 className="font-heading text-xl font-bold">Try the seats</h2><div className="grid grid-cols-2 gap-2">{(state?.seats??[]).map(({id},i)=><Button key={id} disabled={!ready} variant={state?.primary.seated&&state.primary.seatId===id?'secondary':'outline'} onClick={()=>scene.current?.sit(id)}><Armchair className="size-4"/>Sit · seat {i+1}</Button>)}<Button disabled={!ready} variant="outline" onClick={()=>scene.current?.both()}><Users className="size-4"/>{state?.seats.length===3?'All 3 seats':'Both seats'}</Button><Button disabled={!ready||state?.primary.phase==='idle'} variant="outline" onClick={()=>scene.current?.stand()}>Stand up</Button></div></section>
            <section className="space-y-2 border-t pt-4" aria-label="Seat occupancy"><h2 className="font-heading text-lg font-bold">Seat occupancy</h2>{state?.seats.map((seat,i)=>{const actor=seat.occupant==='you'?state.primary:seat.occupant==='companion'?state.companion:seat.occupant==='companion-2'?state.third:null;return <p key={seat.id} className="flex items-center justify-between gap-3 text-sm"><span>Seat {i+1}</span><span className="font-medium">{actor?actor.name+(actor.seated?' · seated':' · approaching'):'Available'}</span></p>})}</section>
          </>}
          <div className="space-y-2 border-t pt-4"><p role="status" aria-live="polite" className="min-h-12 text-sm leading-relaxed">{error||(!ready?'Opening furniture and your character…':status)}</p>{state&&<p className="text-xs text-muted-foreground" role="region" aria-label="Character position">Position: {state.primary.x}, {state.primary.y}</p>}</div>
          {error&&<Button variant="outline" onClick={()=>window.location.reload()}>Retry trial</Button>}
          <section className="space-y-3 border-t pt-4"><div className="flex items-center justify-between gap-3"><Label htmlFor="sprite-trial-geometry">Show collision & contacts</Label><Switch id="sprite-trial-geometry" checked={geometry} onCheckedChange={value=>{setGeometry(value);scene.current?.setGeometry(value)}}/></div><Button variant="outline" className="w-full" disabled={!ready} onClick={()=>scene.current?.reset()}><RotateCcw className="size-4"/>Reset trial</Button></section>
          <section className="space-y-3 border-t pt-4"><h2 className="font-heading text-lg font-bold">Source artwork</h2><img src={isDoor?'/assets/game/housing/tilesets/door-closed-housing-v1.png':state?.sourceFile??'/assets/game/housing/furniture/sofa-housing-v1.png'} alt={names[assetId]+' source artwork'} width={(state?.frame[0]??64)*2} height={(state?.frame[1]??64)*2} className="mx-auto max-w-full [image-rendering:pixelated]"/><p className="text-xs leading-relaxed text-muted-foreground">{isDoor?'Existing art exported at exact 2× pixel scale so the actor fits. Door state and companion controls are local to this trial. Live room state remains server-owned.':'Four authored 2D views, matching seats and foreground layers. The original front is unchanged. The companion and seat reservations are local.'}</p></section>
        </aside>
      </div>
    </main>
  </PlayShell>
}
