import {useState} from 'react'
import {ArrowLeft,ArrowRight,ArrowUp,RotateCcw,Search} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Slider} from '@/components/ui/slider'
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select'
import type {ModelDocument,ModelEditorView,Triple,VertexMeshInfo,VertexSelection} from '@/features/neighborhood/game/skin-studio/model-document'

type Props={document:ModelDocument;view:ModelEditorView;meshes:VertexMeshInfo[];selection:VertexSelection|null;ready:boolean;onView:(view:Partial<ModelEditorView>)=>void;onChange:(document:ModelDocument)=>void;onMove:(position:Triple)=>void;onSelect:(point:number)=>void}
function Coordinate({axis,value,onChange}:{axis:string;value:number;onChange:(value:number)=>void}){
  const [draft,setDraft]=useState(String(Number(value.toFixed(3))))
  return <label className="min-w-0 text-xs text-muted-foreground">{axis}<Input type="number" value={draft} step={.1} min={-80} max={80} className="mt-1 h-8" onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur()}} onBlur={()=>{const next=Number(draft);setDraft(String(Number(value.toFixed(3))));if(draft!==''&&Number.isFinite(next))onChange(Math.max(-80,Math.min(80,next)))}}/></label>
}
export function StudioVertexTools({document,view,meshes,selection,ready,onView,onChange,onMove,onSelect}:Props){
  const [query,setQuery]=useState(''),mesh=meshes.find(mesh=>mesh.id===view.mesh),edit=document.meshEdits.find(edit=>edit.mesh===view.mesh)
  const filtered=meshes.filter(mesh=>mesh.id===view.mesh||mesh.label.toLowerCase().includes(query.toLowerCase().trim()))
  const resetPoint=()=>{
    if(!selection)return
    const indices=new Set(selection.indices)
    onChange({...document,meshEdits:document.meshEdits.map(edit=>edit.mesh===selection.mesh?{...edit,offsets:edit.offsets.filter(([index])=>!indices.has(index))}:edit).filter(edit=>edit.offsets.length)})
  }
  return <div className="space-y-4">
    <div><h3 className="text-sm font-semibold">Edit mesh vertices</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Select a mesh, then drag its green points. Use the colored axes for constrained movement. The rig and UV coordinates stay attached.</p></div>
    <div className="relative"><Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground"/><Input className="h-8 pl-8" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find head, hair, clothing…" aria-label="Find an editable mesh"/></div>
    <Select value={view.mesh??''} disabled={!ready||!meshes.length} onValueChange={mesh=>onView({mesh,vertex:null})}><SelectTrigger aria-label="Editable mesh" className="h-9 w-full"><SelectValue placeholder="Choose a mesh"/></SelectTrigger><SelectContent>{filtered.map(mesh=><SelectItem key={mesh.id} value={mesh.id}>{mesh.added?'Added · ':''}{mesh.label}</SelectItem>)}</SelectContent></Select>
    {mesh&&<>
      <p className="text-xs leading-relaxed text-muted-foreground">{mesh.points} points · {mesh.vertices} vertices{mesh.linked>1?` · ${mesh.linked} linked face states`:''}<br/>Coincident vertices move together to keep seams closed. Rotate to reach points on the back.</p>
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium">{selection?`Point ${selection.point+1} / ${mesh.points}`:'Select a point'}</span><div className="flex gap-1"><Button size="icon-sm" variant="outline" aria-label="Previous vertex point" disabled={!ready||view.vertex===null||view.vertex===0} onClick={()=>onSelect(Math.max(0,(view.vertex??0)-1))}><ArrowLeft/></Button><Button size="icon-sm" variant="outline" aria-label="Next vertex point" disabled={!ready||(view.vertex??-1)>=mesh.points-1} onClick={()=>onSelect(Math.min(mesh.points-1,(view.vertex??-1)+1))}><ArrowRight/></Button></div></div>
      <Slider aria-label="Selected vertex point" value={[view.vertex??0]} min={0} max={Math.max(1,mesh.points-1)} step={1} disabled={!ready} onValueChange={values=>onSelect(values[0])}/>
      {!selection&&<Button size="sm" variant="outline" className="w-full" onClick={()=>onSelect(0)}>Select first point</Button>}
      {selection&&<>
        <fieldset><legend className="mb-2 text-xs font-medium">Point position · mesh-local units</legend><div className="grid grid-cols-3 gap-2">{['X','Y','Z'].map((axis,index)=><Coordinate key={axis+':'+selection.point+':'+selection.position[index]} axis={axis} value={selection.position[index]} onChange={next=>onMove(selection.position.map((value,i)=>i===index?next:value) as Triple)}/>)}</div></fieldset>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>onMove([selection.position[0],selection.position[1]+1,selection.position[2]])}><ArrowUp/>Pull up 1</Button><Button variant="ghost" size="sm" disabled={!edit?.offsets.some(([index])=>selection.indices.includes(index))} onClick={resetPoint}><RotateCcw/>Reset point</Button></div>
      </>}
      <Button size="sm" variant="outline" className="w-full" disabled={!edit?.offsets.length} onClick={()=>onChange({...document,meshEdits:document.meshEdits.filter(edit=>edit.mesh!==view.mesh)})}><RotateCcw/>Reset this mesh</Button>
    </>}
    {!meshes.length&&<p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">Editable meshes appear after the character loads. Added geometry is included automatically.</p>}
    <div className="space-y-2 border-t pt-3 text-xs leading-relaxed text-muted-foreground"><p>Pull a hair point upward to make a spike, move cheek points inward to narrow the face, or lower hem points to extend clothing.</p><p>These edits move existing vertices. They do not add polygons or change the mesh topology. Large pulls stretch the existing texture; repaint afterward if needed.</p></div>
    <Button size="sm" variant="ghost" disabled={!document.meshEdits.length} onClick={()=>onChange({...document,meshEdits:[]})}>Reset all vertex edits</Button>
  </div>
}
