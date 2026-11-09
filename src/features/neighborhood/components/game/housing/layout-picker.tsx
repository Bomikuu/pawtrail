import {useEffect,useMemo,useState} from 'react'
import {Check,Layers,History,House,ArrowRight,LoaderCircle} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Switch} from '@/components/ui/switch'
import {HOUSE_PRESETS,housePreset,type FloorId,type FloorPlan} from '@/features/neighborhood/game/housing/presets'
import {furniture} from '@/features/neighborhood/game/housing/geometry'
import {act} from '@/features/neighborhood/game/housing/client'
import type {HomesState} from '@/features/neighborhood/game/housing/types'
import {RoomPreview} from './room-preview'

export function LayoutPicker({state}:{state:HomesState}){
  const h=state.data!.house
  const [selected,setSelected]=useState(h.interiorPreset.replace(/-(legacy|v2)$/,''))
  const [previewFloor,setPreviewFloor]=useState<FloorId>('interior')
  const [furnish,setFurnish]=useState(true),[feedback,setFeedback]=useState('')
  useEffect(()=>{setSelected(h.interiorPreset.replace(/-(legacy|v2)$/,''));setPreviewFloor('interior')},[h.interiorPreset])
  const preset=housePreset(selected),unlocked=h.unlockedPresets.includes(preset.furniturePack||selected)
  const {floors,missing}=useMemo(()=>{
    const available={...h.inventory},result:Partial<Record<FloorId,FloorPlan>>={},missing:string[]=[]
    for(const piece of h.yardLayout)available[piece.item]=(available[piece.item]||0)-1
    for(const [id,floor] of Object.entries(preset.floors)){
      if(!floor)continue
      const items=!furnish?[]:floor.items.filter(piece=>{
        if(!unlocked)return true
        if((available[piece.item]||0)>0){available[piece.item]--;return true}
        missing.push(furniture[piece.item]?.label||piece.item);return false
      })
      result[id as FloorId]={...floor,items}
    }
    return {floors:result,missing}
  },[preset,h.inventory,h.yardLayout,unlocked,furnish])
  const activeFloor=floors[previewFloor]||floors.interior!
  async function apply(body:Record<string,unknown>){
    if(state.busy||state.decoration)return
    setFeedback('')
    try{await act({...body,revision:h.revision,upstairsRevision:h.upstairsRevision})}catch(error){setFeedback((error as Error).message)}
  }
  return <section className="space-y-5 border-b pb-6" aria-label="House layout presets">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-heading text-xl font-extrabold">A home for your little world</h3><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Small, connected rooms with space for you and your animals. Preview the actual arrangement before making it home.</p></div>
      <Badge variant="secondary" className="gap-1.5"><House className="size-3.5"/>{housePreset(h.interiorPreset).name}</Badge>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible" role="group" aria-label="Choose a house layout">
      {HOUSE_PRESETS.map(p=>{
        const active=p.id===selected,current=p.id===h.interiorPreset
        return <Button key={p.id} variant="outline" aria-pressed={active} disabled={state.busy} className={'relative h-auto w-64 min-w-0 shrink-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl p-0 text-left sm:w-auto '+(active?'border-primary ring-2 ring-primary/20':'hover:border-primary/50')} onClick={()=>{setSelected(p.id);setPreviewFloor('interior');setFeedback('')}}>
          <div className="relative w-full"><RoomPreview plan={p.floors.interior!} floor={p.floor} wallpaper={p.wallpaper}/>{active&&<span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5"/></span>}</div>
          <span className="flex w-full items-center justify-between gap-2 px-3 pt-3 text-sm font-extrabold">{p.name}{current&&<span className="text-[10px] font-semibold text-primary">Current</span>}</span>
          <span className="px-3 pb-3 pt-1 text-xs font-normal text-muted-foreground">{Object.keys(p.floors).length===1?'One cozy floor':p.id==='cottage'?'Three wings + attic':'Two connected floors'}</span>
        </Button>
      })}
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
      <div className="min-w-0 self-start overflow-hidden rounded-xl border bg-[#332219]">
        {Object.keys(floors).length>1&&<div className="flex flex-wrap gap-2 border-b border-white/10 p-2" role="group" aria-label="Preview a floor">{Object.entries(floors).map(([id,floor])=>floor&&<Button key={id} size="sm" variant={id===previewFloor?'secondary':'ghost'} className={id===previewFloor?'':'text-[#edd6b4] hover:bg-white/10 hover:text-white'} aria-pressed={id===previewFloor} onClick={()=>setPreviewFloor(id as FloorId)}>{floor.label}</Button>)}</div>}
        <RoomPreview plan={activeFloor} floor={preset.floor} wallpaper={preset.wallpaper} furnished={furnish} large/>
        <p className="border-t border-white/10 px-3 py-2 text-xs text-[#edd6b4]">{activeFloor.label} · actual walls, stairs and {furnish?'available furniture':'empty rooms'}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div><h4 className="font-heading text-lg font-extrabold">{preset.name}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{preset.description}</p></div>
        <div className="space-y-3">{Object.entries(floors).map(([id,floor])=>floor&&<div key={id} className="text-sm"><p className="flex items-center gap-2 font-bold"><Layers className="size-3.5 text-primary"/>{floor.label}<span className="text-xs font-normal text-muted-foreground">{floor.width} × {floor.height} tiles</span></p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{floor.rooms.join(' · ')}</p></div>)}</div>
        <div className="flex items-start justify-between gap-3 rounded-lg bg-secondary/60 p-3">
          <label htmlFor="preset-furnish" className="space-y-1 text-sm font-bold"><span>Include the furniture arrangement</span><span className="block text-xs font-normal leading-relaxed text-muted-foreground">{unlocked?'Uses your owned pieces. The preview shows what will be placed.':'A starter furniture pack is included once for this layout.'}</span></label>
          <Switch id="preset-furnish" checked={furnish} disabled={state.busy} onCheckedChange={setFurnish}/>
        </div>
        {missing.length>0&&<p className="text-xs leading-relaxed text-muted-foreground" role="status">{missing.length} {missing.length===1?'piece is':'pieces are'} missing from storage and left out of this preview: {[...new Set(missing)].join(', ')}. Collect them to complete the furnished plan.</p>}
        {h.interiorPreset!==selected&&/-(legacy|v2)$/.test(h.interiorPreset)&&<p className="text-xs leading-relaxed text-muted-foreground">Your custom arrangement keeps its original room size. Apply this compact plan to resize; your current home will stay in Layout history.</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">Your current arrangement is saved in Layout history before switching. Interior pieces return to storage. Your yard keeps its arrangement.</p>
        {state.decoration&&<p className="text-xs text-destructive">Save or discard your decoration draft first.</p>}
        {feedback&&<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{feedback}</p>}
        <Button className="mt-auto w-full" disabled={state.busy||state.decoration||state.status!=='online'} onClick={()=>void apply({type:'house-preset',preset:selected,furnish})}>{state.busy?<LoaderCircle className="size-4 animate-spin"/>:<ArrowRight className="size-4"/>}{state.busy?'Saving your home…':selected===h.interiorPreset?'Reset to this arrangement':'Use this house layout'}</Button>
      </div>
    </div>
    <details className="rounded-xl border px-4 py-3">
      <summary className="cursor-pointer text-sm font-bold">Original art reference</summary>
      <img src={preset.preview} alt={preset.name+' original room composition'} width="1100" height="733" loading="lazy" className="mt-3 max-h-[30rem] w-full object-contain [image-rendering:pixelated]"/>
    </details>
    <details className="rounded-xl border px-4 py-3"><summary className="cursor-pointer text-sm font-bold"><History className="mr-2 inline size-4 align-text-bottom text-primary"/>Layout history <span className="font-normal text-muted-foreground">· {h.layoutBackups.length} saved</span></summary>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The five most recent arrangements are kept. Restoring also saves your current arrangement. Saved furniture must still be owned.</p>
      <div className="mt-3 space-y-2">{h.layoutBackups.map(backup=><div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-2"><div><p className="text-sm font-bold">{backup.name}</p><p className="text-xs text-muted-foreground">{new Date(backup.at*1000).toLocaleString()}</p></div><Button size="sm" variant="outline" disabled={state.busy||state.decoration} onClick={()=>void apply({type:'restore-layout',backup:backup.id})}>Restore arrangement</Button></div>)}{!h.layoutBackups.length&&<p className="py-3 text-sm text-muted-foreground">Your first saved arrangement will appear here when you choose a preset.</p>}</div>
    </details>
  </section>
}
