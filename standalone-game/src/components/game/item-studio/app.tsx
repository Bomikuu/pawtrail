import {useEffect,useRef,useState} from 'react'
import * as T from 'three'
import {ArrowLeft,Box,Hand,Clapperboard,Sparkles,Scan,Gamepad2,Save,Upload,Download,Copy,Trash2,Undo2,Redo2,RotateCcw,Volume2,VolumeX,LoaderCircle,ZoomIn,ZoomOut,ScanLine} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {TooltipProvider} from '@/components/ui/tooltip'
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select'
import {PlayShell,PlayHeader} from '../shared/play-chrome'
import {StudioModelTools} from '../studio-model-tools'
import {downloadFile} from '@/game/skin-studio/textures'
import {navigatePlay,navigateStageEditor} from '@/game/play-navigation'
import {trainingSword} from '@/game/items/sword-pilot'
import {chainWeapon} from '@/game/items/chain-pilot'
import {rubyHammer} from '@/game/items/hammer-pilot'
import {spectralSwordsman} from '@/game/items/spectral-pilot'
import {twinScythes} from '@/game/items/scythe-pilot'
import {MovesetControls} from './moveset-controls'
import {ItemAbilityIcon} from './ability-icon'
import {ItemAbilityTooltip} from './ability-tooltip'
import {WeaponConceptDialog} from './weapon-concept'
import {UltimateCutIn} from '../shared/ultimate-cut-in'
import {WeaponIcon} from '../shared/weapon-icon'
import {getAction,itemActionDescription,hasHoverChain,availableActions,ACTION_LABELS,emptyCooldowns,fitActionDuration,readItem,saveItem,loadItems,removeItem,duplicateItem,itemId,type ItemDocument,type ItemAction,type ActionKey,type ItemEvent} from '@/game/items/document'
import {emptyModelDocument,studioJoints,type ModelEditorView,type ModelEditorEvent,type ModelDocument,type StudioPose,type VertexMeshInfo,type VertexSelection,type Triple} from '@/game/skin-studio/model-document'
import type {ItemScene} from '@/game/items/scene'
import type {ItemPreview,TrainingReport} from '@/game/items/preview'
import {NumberField,VectorField,Choice,Toggle} from './fields'
import {ItemTimeline} from './timeline'
const workspaces=[['geometry','Geometry',Box],['equip','Equip',Hand],['actions','Actions',Clapperboard],['effects','Effects',Sparkles],['area','Area',Scan],['try','Try',Gamepad2]]as const
type Workspace=typeof workspaces[number][0]
type WeaponPreset='sword'|'chain'|'hammer'|'guardian'|'scythe'
function weaponPreset(item:ItemDocument):WeaponPreset|'custom'{return item.id==='training-sword-v1'?'sword':item.id==='moonvine-chain-v1'?'chain':item.id==='ruby-hammer-v1'?'hammer':item.id==='spectral-swordsman-v1'?'guardian':item.id==='ivory-twin-scythes-v1'?'scythe':'custom'}
const initialView:ModelEditorView={mode:'geometry',geometry:'blade',joint:'ShoulderRight',transform:'translate',snap:false,time:0,motionPlaying:false,editMode:'object',mesh:null,vertex:null}
export default function ItemStudio(){
 const[item,setItem]=useState<ItemDocument>(twinScythes),[character,setCharacter]=useState<'amber'|'yae'>('amber'),[workspace,setWorkspace]=useState<Workspace>('try'),[key,setKey]=useState<ActionKey>('primary')
 const[view,setView]=useState(initialView),[pose,setPose]=useState<StudioPose>({root:[0,0,0],angles:{}}),[meshes,setMeshes]=useState<VertexMeshInfo[]>([]),[vertex,setVertex]=useState<VertexSelection|null>(null)
 const[rendererEpoch,setRendererEpoch]=useState(0),[ready,setReady]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('Ivory twin scythes · WASD move · Shift run · J / R / L skills · K ultimate'),[library,setLibrary]=useState<ItemDocument[]>([]),[pane,setPane]=useState('preview')
 const[selected,setSelected]=useState<string|null>(null),[time,setTime]=useState(0),[playing,setPlaying]=useState(false),[loop,setLoop]=useState(false),[speed,setSpeed]=useState(1),[muted,setMuted]=useState(false),[debug,setDebug]=useState(true),[eligible,setEligible]=useState(true)
 const[report,setReport]=useState<TrainingReport>({cooldowns:emptyCooldowns(),hits:0,log:[],time:0,phase:'Ready',canChain:false,buffered:false,activeAction:null,zoom:1}),[,setRevision]=useState(0)
 const host=useRef<HTMLDivElement>(null),scene=useRef<ItemScene|null>(null),training=useRef<ItemPreview|null>(null),file=useRef<HTMLInputElement>(null),history=useRef<{undo:ItemDocument[];redo:ItemDocument[]}>({undo:[],redo:[]}),latest=useRef({item,view,pose,time,key,workspace,playing})
 latest.current={item,view,pose,time,key,workspace,playing}
 const action=getAction(item,key),event=action.events.find(e=>e.id===selected),isTraining=workspace==='effects'||workspace==='area'||workspace==='try'
 const weaponDrafts=useRef<Partial<Record<WeaponPreset,ItemDocument>>>({})
 const selectedWeapon=weaponPreset(item)
 const visualSignature=JSON.stringify([item.parts,item.meshEdits,item.equipment,item.idleChain,item.guardian,item.stance])
 function remember(){history.current.undo.push(structuredClone(latest.current.item));if(history.current.undo.length>24)history.current.undo.shift();history.current.redo=[];setRevision(n=>n+1)}
 function commit(next:ItemDocument,record=true){if(record)remember();setItem(next);setNotice('Unsaved local changes');setError('')}
 function updateAction(patch:Partial<ItemAction>,record=true){const current=latest.current.item;commit({...current,actions:{...current.actions,[latest.current.key]:{...getAction(current,latest.current.key),...patch}}},record)}
 function undo(redo=false){const from=redo?history.current.redo:history.current.undo,to=redo?history.current.undo:history.current.redo,next=from.pop();if(next){to.push(structuredClone(item));setItem(next);setRevision(n=>n+1);setNotice(redo?'Change restored':'Change undone');setPlaying(false)}}
 function modelDocument():ModelDocument{const s=latest.current,a=getAction(s.item,s.key);return{...emptyModelDocument(),geometry:s.item.parts.map(p=>({...p,parent:'Head'})),meshEdits:s.item.meshEdits,duration:a.duration/1000,frames:a.frames,pose:s.pose,loop:false}}
 function updateModel(doc:ModelDocument,record=true){setPose(doc.pose);const s=latest.current,a=getAction(s.item,s.key);commit({...s.item,parts:doc.geometry.map(({parent,...part})=>part),meshEdits:doc.meshEdits.filter(edit=>doc.geometry.some(part=>edit.mesh==='attachment:'+part.id)),actions:{...s.item.actions,[s.key]:{...a,...fitActionDuration(a,doc.duration*1000),frames:doc.frames,duration:Math.max(500,doc.duration*1000),events:a.events.map(e=>({...e,time:Math.min(e.time,doc.duration*1000)})),itemFrames:a.itemFrames.filter(f=>f.time<=doc.duration*1000),rootMotion:a.rootMotion?{...a.rootMotion,start:Math.min(a.rootMotion.start,doc.duration*1000-1),end:Math.min(a.rootMotion.end,doc.duration*1000)}:undefined,windup:Math.min(a.windup,doc.duration*1000),activeEnd:Math.min(a.activeEnd,doc.duration*1000)}}},record)}
 function modelEvent(e:ModelEditorEvent){const s=latest.current;if(e.type==='start')remember();else if(e.type==='select-geometry')setView(v=>({...v,geometry:e.id}));else if(e.type==='select-joint')setView(v=>({...v,joint:e.joint,motionPlaying:false}));else if(e.type==='geometry')commit({...s.item,parts:s.item.parts.map(p=>p.id===e.id?{...p,position:e.position,rotation:e.rotation,scale:e.scale}:p)},false);else if(e.type==='joint')setPose(p=>({...p,angles:{...p.angles,[e.joint]:e.rotation}}));else if(e.type==='vertex-catalog')setMeshes(e.meshes);else if(e.type==='select-mesh')setView(v=>({...v,mesh:e.id,vertex:null}));else if(e.type==='select-vertex'){setVertex(e.selection);setView(v=>({...v,mesh:e.selection?.mesh??v.mesh,vertex:e.selection?.point??null}))}else if(e.type==='vertices')commit({...s.item,meshEdits:[...s.item.meshEdits.filter(edit=>edit.mesh!==e.edit.mesh),e.edit].filter(edit=>edit.offsets.length)},false);else if(e.type==='model-error')setError(e.message)}
 const callbacks=useRef({modelEvent,updateAction});callbacks.current={modelEvent,updateAction}
 useEffect(()=>{try{setLibrary(loadItems())}catch(e){setError((e as Error).message)}},[])
 useEffect(()=>{
  let cancelled=false;setReady(false);setPlaying(false);setMeshes([]);setVertex(null)
  const start=async()=>{if(!host.current)return
   if(isTraining){const{ItemPreview}=await import('@/game/items/preview');const next=await ItemPreview.create(host.current,latest.current.item,character,r=>{setReport(r);if(latest.current.playing)setTime(r.time)},setError);if(cancelled){next.dispose();return}training.current=next}
   else{const{ItemScene}=await import('@/game/items/scene');const next=await ItemScene.create(host.current,character,latest.current.item,e=>callbacks.current.modelEvent(e));if(cancelled){next.dispose();return}scene.current=next}
   setReady(true)
  };void start().catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'The item renderer could not load. Change character to retry.')})
  return()=>{cancelled=true;scene.current?.dispose();scene.current=null;training.current?.dispose();training.current=null}
 },[character,isTraining,isTraining?visualSignature:'',item.id,item.guardian?.kind,rendererEpoch])
 useEffect(()=>{if(!ready)return
  if(scene.current){scene.current.set(item,key,workspace,time,{...view,motionPlaying:playing,time:time/1000});if(workspace==='actions')scene.current.setModel(modelDocument(),{...view,mode:'pose',motionPlaying:playing,time:time/1000})}
 },[ready,item,key,workspace,time,view,pose,playing])
 useEffect(()=>{if(ready&&training.current)training.current.setDefinition(item)},[ready,item])
 useEffect(()=>{training.current?.setOptions(key,debug,muted,workspace==='area'?(range,width)=>{const a=getAction(latest.current.item,latest.current.key);callbacks.current.updateAction({area:{...a.area,range,width:width??a.area.width}},false)}:null,remember);training.current?.setTargetEligibility(eligible)},[ready,key,debug,muted,workspace,eligible])
 useEffect(()=>{if(!playing||isTraining)return;let previous=0,frame=0;const tick=(now:number)=>{if(!document.hidden){const dt=previous?Math.min(80,now-previous)*speed:0;setTime(t=>{const end=getAction(latest.current.item,latest.current.key).duration,next=t+dt;if(next>=end){if(loop)return next%end;setPlaying(false);return end}return next})}previous=now;frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[playing,isTraining,loop,speed])
 useEffect(()=>{if(!playing&&scene.current&&workspace==='actions')setView(v=>({...v,motionPlaying:false}))},[playing,workspace])
 function seek(t:number){setPlaying(false);setTime(t);if(training.current)training.current.seek(key,t);else if(scene.current){const sampled=scene.current.poseAt(t/1000);setPose(sampled);setView(v=>({...v,motionPlaying:false,time:t/1000}))}}
 function play(){if(playing){setPlaying(false);training.current?.pause();if(scene.current)setPose(scene.current.poseAt(time/1000));return}const t=time>=action.duration?0:time;setTime(t);setPlaying(true);if(training.current)training.current.playTimeline(key,t,speed,loop);else setView(v=>({...v,motionPlaying:true}))}
 function changeWorkspace(next:Workspace){setPlaying(false);if(next!==workspace)training.current?.reset();setWorkspace(next);setPane('preview');setTime(0);setView(v=>({...v,motionPlaying:false}))}
 function chooseAction(next:ActionKey){training.current?.reset();setKey(next);setSelected(null);setTime(0);setPlaying(false);setPose({root:[0,0,0],angles:{}})}
 function addEvent(kind:ItemEvent['kind']){if(action.events.length>=32)return;const added:ItemEvent={id:itemId(),kind,time:Math.min(action.duration,Math.round(time)),color:'#91ead9',size:kind==='projectile'?96:64,lifetime:260,sound:kind==='projectile'?'wave':'swing'};updateAction({events:[...action.events,added]});setSelected(added.id);changeWorkspace('effects')}
 function updateEvent(patch:Partial<ItemEvent>){if(event)updateAction({events:action.events.map(e=>e.id===event.id?{...e,...patch}:e)})}
 function installDraft(next:ItemDocument){setKey('primary');training.current?.reset();setPose({root:[0,0,0],angles:{}});commit(next);setSelected(null);setTime(0);setPlaying(false);setView(initialView)}
 function selectWeapon(value:string){
  if(value!=='sword'&&value!=='chain'&&value!=='hammer'&&value!=='guardian'&&value!=='scythe')return
  const current=latest.current.item,currentPreset=weaponPreset(current)
  if(currentPreset!=='custom')weaponDrafts.current[currentPreset]=structuredClone(current)
  const saved=weaponDrafts.current[value]
  installDraft(saved?structuredClone(saved):value==='sword'?trainingSword():value==='hammer'?rubyHammer():value==='guardian'?spectralSwordsman():value==='scythe'?twinScythes():chainWeapon())
  setNotice(`${value==='sword'?'Sword':value==='hammer'?'Hammer':value==='guardian'?'Spectral swordsman':value==='scythe'?'Twin scythes':'Chain'} draft selected · edits stay in this session until saved`)
 }
 async function importFile(f?:File){if(!f)return;try{if(f.size>2_000_000)throw Error('Item files must be below 2 MB.');const next=readItem(JSON.parse(await f.text()));installDraft(next);setNotice('Imported local item draft')}catch(e){setError(e instanceof Error?e.message:'The file is not a PawTrail item.')}}
 function save(){try{saveItem(item);setLibrary(loadItems());setNotice('Saved to this device’s item library')}catch(e){setError(e instanceof Error?e.message:'Storage is full. Export your item to keep a copy.')}}
 useEffect(()=>{if(!item.actions[key])setKey('primary')},[item,key])
 const equipment=item.equipment
 const travelStart=Math.min(action.windup,action.duration-1)
 const travel=action.rootMotion??{distance:0,start:travelStart,end:Math.max(travelStart+1,action.activeEnd)}
 function movePivot(pivot:Triple){const delta=new T.Vector3(...pivot).sub(new T.Vector3(...equipment.pivot)).applyEuler(new T.Euler(...equipment.rotation.map(T.MathUtils.degToRad) as Triple));const position=new T.Vector3(...equipment.position).add(delta).toArray() as Triple;if(position.some(v=>Math.abs(v)>40)){setError('This pivot would move the grip beyond its 40-unit limit. Move the item first.');return}commit({...item,equipment:{...equipment,pivot,position}})}
 const properties=<>
 {workspace==='geometry'||workspace==='actions'?<>
 {workspace==='actions'&&<div className="space-y-3 border-b p-3"><h2 className="font-heading text-lg font-semibold">Action timing</h2><label className="block text-xs font-medium">Action name<Input className="mt-1 h-8" maxLength={80} value={action.name} onChange={e=>updateAction({name:e.target.value},false)}/></label><label className="block space-y-1 text-xs font-medium"><span>Skill description · shown on hover</span><Textarea className="min-h-24 resize-y text-xs leading-relaxed" maxLength={600} value={action.description??''} placeholder={itemActionDescription({...action,description:undefined})} onChange={e=>updateAction({description:e.target.value},false)}/></label><Button size="sm" variant="outline" className="w-full" onClick={()=>{const source=structuredClone(item.actions[key==='primary'?'special':'primary']);source.id=itemId();source.events.forEach(e=>e.id=itemId());source.frames.forEach(f=>f.id=itemId());updateAction(source)}}><Copy/>Copy other action into this slot</Button><div className="grid grid-cols-2 gap-2"><NumberField label="Preparation · ms" value={action.windup} max={action.activeEnd} onChange={windup=>updateAction({windup})}/><NumberField label="Active ends · ms" value={action.activeEnd} min={action.windup} max={action.duration} onChange={activeEnd=>updateAction({activeEnd})}/><NumberField label="Cooldown · ms" value={action.cooldown} max={30000} onChange={cooldown=>updateAction({cooldown})}/></div><Toggle label="Lock movement while casting" checked={action.lockMovement} onChange={lockMovement=>updateAction({lockMovement})}/><fieldset className="space-y-2 rounded-md border p-2">
   <legend className="px-1 text-xs font-medium">Step forward · collision-aware</legend>
   <NumberField label="Travel · pixels" value={travel.distance} max={24} onChange={distance=>updateAction({rootMotion:{...travel,distance}})}/>
   <div className="grid grid-cols-2 gap-2">
     <NumberField label="Starts · ms" value={travel.start} max={travel.end-1} onChange={start=>updateAction({rootMotion:{...travel,start}})}/>
     <NumberField label="Ends · ms" value={travel.end} min={travel.start+1} max={action.duration} onChange={end=>updateAction({rootMotion:{...travel,end}})}/>
   </div>
   <p className="text-[11px] leading-relaxed text-muted-foreground">Moves the character on the ground in Try. Walls stop the step; changing this value does not resize the model.</p>
 </fieldset><details className="rounded-md border p-2"><summary className="cursor-pointer text-xs font-medium">Joint mask · {action.mask.length} joints</summary><div className="mt-3 max-h-44 space-y-2 overflow-auto">{studioJoints.map(([joint,label])=><Toggle key={joint} label={label} checked={action.mask.includes(joint)} onChange={checked=>updateAction({mask:checked?[...action.mask,joint]:action.mask.filter(j=>j!==joint)})}/>)}</div></details><VectorField label="Item rotation at playhead" value={action.itemFrames.find(f=>Math.abs(f.time-time)<5)?.rotation??[0,0,0]} min={-180} max={180} onChange={rotation=>updateAction({itemFrames:[...action.itemFrames.filter(f=>Math.abs(f.time-time)>=5),{time:Math.round(time),rotation}].sort((a,b)=>a.time-b.time)})}/><p className="text-[11px] text-muted-foreground">Poses affect masked joints only. Record a pose below after changing a limb.</p></div>}
 {workspace==='actions'&&<div className="border-b p-3"><MovesetControls item={item} action={action} actionKey={key} onChange={updateAction}/></div>}
 <StudioModelTools attachmentContext="item" document={modelDocument()} view={{...view,mode:workspace==='actions'?'pose':'geometry',motionPlaying:playing,time:time/1000}} ready={ready} canUndo={history.current.undo.length>0} canRedo={history.current.redo.length>0} vertexMeshes={meshes} vertexSelection={vertex} onMoveVertex={p=>scene.current?.moveVertex(p)} onSelectVertex={p=>scene.current?.selectVertex(p)} onChange={updateModel} onRemember={remember} onView={v=>{setView(old=>({...old,...v}));if(v.time!==undefined)setTime(v.time*1000);if(v.motionPlaying!==undefined)setPlaying(v.motionPlaying)}} onSeek={t=>seek(t*1000)} onUndo={undo} onError={setError}/>
 </>:<div className="space-y-5 p-4">
 {workspace==='equip'&&<><h2 className="font-heading text-xl font-semibold">Hand attachment</h2>{item.stance&&<div className="space-y-3 rounded-md border bg-muted/20 p-3"><h3 className="font-heading text-lg font-semibold">{item.stance.name}</h3><p className="text-xs leading-relaxed text-muted-foreground">This weapon has its own relaxed grip. Breathing and planted feet stay on the shared character rig.</p>{selectedWeapon==='scythe'&&<WeaponConceptDialog name="Ivory twin scythes" source="/assets/game/items/twin-scythes/front-side-concept.png" description="Ivory crescent profiles, bronze star collars, burgundy grips and turquoise gems. The game uses two copies of the same textured 3D equipment."/>}<NumberField label="Carry strength while walking" value={item.stance.walkWeight} min={0} max={1} step={.05} onChange={walkWeight=>commit({...item,stance:{...item.stance!,walkWeight}})}/><NumberField label="Carry strength while running" value={item.stance.runWeight} min={0} max={1} step={.05} onChange={runWeight=>commit({...item,stance:{...item.stance!,runWeight}})}/></div>}{equipment.paired&&<div className="space-y-3 rounded-md border p-3"><h3 className="font-heading text-lg font-semibold">Second-hand equipment</h3><p className="text-xs text-muted-foreground">The second hand reuses your edited geometry and texture.</p><VectorField label="Second hand position" value={equipment.paired.position} onChange={position=>commit({...item,equipment:{...equipment,paired:{...equipment.paired!,position}}})}/><VectorField label="Second hand angle · degrees" value={equipment.paired.rotation} min={-180} max={180} onChange={rotation=>commit({...item,equipment:{...equipment,paired:{...equipment.paired!,rotation}}})}/><Toggle label="Mirror the second model" checked={equipment.paired.mirror} onChange={mirror=>commit({...item,equipment:{...equipment,paired:{...equipment.paired!,mirror}}})}/></div>}{item.guardian&&<div className="space-y-3 rounded-md border border-violet-500/25 bg-violet-500/5 p-3"><h3 className="font-heading text-lg font-semibold">Spectral guardian</h3><WeaponConceptDialog name="Spectral swordsman" source="/assets/game/items/spectral-guardian/front-side-concept.png" description="A quick silhouette reference for the textured 3D equipment. The character continues using the shared rig."/><p className="text-xs leading-relaxed text-muted-foreground">Hovers behind you, carries twin blades and joins attacks. The spirit never enlarges your walking collision.</p><NumberField label="Guardian scale" value={item.guardian.scale} min={.6} max={1.8} step={.05} onChange={scale=>commit({...item,guardian:{...item.guardian!,scale}})}/><NumberField label="Spirit opacity" value={item.guardian.opacity} min={.35} max={1} step={.05} onChange={opacity=>commit({...item,guardian:{...item.guardian!,opacity}})}/><VectorField label="Position behind the character" value={item.guardian.offset} min={-32} max={32} onChange={offset=>commit({...item,guardian:{...item.guardian!,offset}})}/></div>}<Toggle label="Default hovering body chain" checked={hasHoverChain(item)} onChange={idleChain=>commit({...item,idleChain})}/><p className="text-xs leading-relaxed text-muted-foreground">The equipped chain continuously floats around the character, including while walking. It deploys for attacks and returns afterward. Idle coils are decorative.</p><Toggle label="Carry on back when idle" checked={!!equipment.carry} onChange={enabled=>commit({...item,equipment:{...equipment,carry:enabled?{socket:'SpineBend',position:[2,-6,-7],rotation:[0,0,38]}:undefined}})}/>
 {equipment.carry&&<div className="space-y-3 rounded-md border p-3"><p className="text-xs text-muted-foreground">Back position is used while idle or walking. Actions move the weapon to the hand.</p><VectorField label="Back attachment position" value={equipment.carry.position} onChange={position=>commit({...item,equipment:{...equipment,carry:{...equipment.carry!,position}}})}/><VectorField label="Back angle · degrees" value={equipment.carry.rotation} min={-180} max={180} onChange={rotation=>commit({...item,equipment:{...equipment,carry:{...equipment.carry!,rotation}}})}/></div>}
 <Choice label="Socket" value={equipment.socket} options={[[ 'WristRight','Right hand'],['WristLeft','Left hand']]} onChange={socket=>commit({...item,equipment:{...equipment,socket:socket as 'WristRight'|'WristLeft'}})}/><VectorField label="Hand-local position" value={equipment.position} onChange={position=>commit({...item,equipment:{...equipment,position}})}/><VectorField label="Grip rotation · degrees" value={equipment.rotation} min={-180} max={180} onChange={rotation=>commit({...item,equipment:{...equipment,rotation}})}/><VectorField label="Grip pivot · preserves placement" value={equipment.pivot} onChange={movePivot}/><VectorField label="Blade tip / muzzle marker" value={equipment.tip} onChange={tip=>commit({...item,equipment:{...equipment,tip}})}/><p className="text-xs leading-relaxed text-muted-foreground"><span className="text-amber-700">Gold</span> marks the grip; <span className="text-emerald-700">green</span> marks the tip. These visual sockets do not change the ground hit area.</p></>}
 {workspace==='effects'&&<><h2 className="font-heading text-xl font-semibold">Timed effects</h2><MovesetControls item={item} action={action} actionKey={key} onChange={updateAction} section="chain"/>{event?<><Choice label="Event preset" value={event.kind} options={[[ 'trail','Swing trail'],['burst','Impact burst'],['projectile','Traveling wave'],['sound','Sound cue']]} onChange={kind=>updateEvent({kind:kind as ItemEvent['kind']})}/><NumberField label="Event time · ms" value={event.time} max={action.duration} onChange={time=>updateEvent({time})}/><label className="flex items-center justify-between text-xs font-medium">Effect color<Input type="color" className="h-8 w-16 p-1" value={event.color} onChange={e=>updateEvent({color:e.target.value})}/></label><NumberField label="Visual size · pixels" value={event.size} min={4} max={256} onChange={size=>updateEvent({size})}/><NumberField label="Visible lifetime · ms" value={event.lifetime} min={50} max={3000} onChange={lifetime=>updateEvent({lifetime})}/><Choice label="Sound" value={event.sound} options={[[ 'swing','Sword whoosh'],['wave','Wave release'],['impact','Soft impact']]} onChange={sound=>updateEvent({sound:sound as ItemEvent['sound']})}/><p className="text-xs leading-relaxed text-muted-foreground">Visual width is independent of the mechanical hit width. Scrubbing is silent. Sound plays through your existing effects volume.</p></>:<p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Select an event on the timeline or add a trail, wave, burst or sound below.</p>}</>}
 {workspace==='area'&&<><h2 className="font-heading text-xl font-semibold">Ground interaction</h2><MovesetControls item={item} action={action} actionKey={key} onChange={updateAction} section="windows"/><Toggle label="Enable melee area" checked={action.melee} onChange={melee=>updateAction({melee})}/><Choice label="Area shape" value={action.area.kind} options={[[ 'arc','Forward arc'],['circle','Circle'],['box','Box'],['capsule','Capsule']]} onChange={kind=>updateAction({area:{...action.area,kind:kind as ItemAction['area']['kind']}})}/><div className="grid grid-cols-2 gap-2"><NumberField label="Reach · px" value={action.area.range} min={8} max={256} onChange={range=>updateAction({area:{...action.area,range}})}/><NumberField label="Width · px" value={action.area.width} min={8} max={192} onChange={width=>updateAction({area:{...action.area,width}})}/><NumberField label="Arc · degrees" value={action.area.angle} min={10} max={360} onChange={angle=>updateAction({area:{...action.area,angle}})}/><NumberField label="Forward offset · px" value={action.area.offset} max={128} onChange={offset=>updateAction({area:{...action.area,offset}})}/></div><p className="text-xs text-muted-foreground">{(action.area.range/32).toFixed(1)} tiles reach · drag on the ground to change reach and width. Numeric fields share the same values.</p><h3 className="border-t pt-3 font-heading text-lg font-semibold">Traveling wave</h3><div className="grid grid-cols-2 gap-2">{([['speed','Speed · px/s',16,640],['width','Hit width · px',8,192],['depth','Depth · px',4,64],['range','Max range · px',16,640],['lifetime','Lifetime · ms',100,5000]]as const).map(([field,label,min,max])=><NumberField key={field} label={label} value={action.projectile[field]} min={min} max={max} onChange={v=>updateAction({projectile:{...action.projectile,[field]:v}})}/>)}</div><Toggle label="Pierce multiple targets" checked={action.projectile.pierce} onChange={pierce=>updateAction({projectile:{...action.projectile,pierce}})}/><Toggle label="Stop whole wave at walls" checked={action.projectile.stopAtWalls} onChange={stopAtWalls=>updateAction({projectile:{...action.projectile,stopAtWalls}})}/><Toggle label="Training targets are eligible" checked={eligible} onChange={setEligible}/></>}
 {workspace==='try'&&<><h2 className="font-heading text-xl font-semibold">Training session</h2><p className="text-sm leading-relaxed">Press J again during a combo window to queue the next strike. Use Shift + movement + J or R for a running sweep, L to extend the chain, and K for its circular special. Each strike has its own hit window; walls protect targets behind them.</p><div className="flex items-baseline justify-between border-y py-3"><span className="text-xs text-muted-foreground">Local hits</span><strong className="font-heading text-3xl tabular-nums">{report.hits}</strong></div><Toggle label="Show ground areas and collisions" checked={debug} onChange={setDebug}/><Button variant="outline" className="w-full" onClick={()=>{training.current?.reset();setPlaying(false)}}><RotateCcw/>Reset targets & cooldowns</Button><Button variant="outline" className="w-full" onClick={navigateStageEditor}>Try saved item in Stage editor</Button><p className="text-xs text-muted-foreground">Save the item first, then choose it in the Stage editor’s play toolbar. No inventory, animals or rewards are changed.</p></>}
 </div>}
 </>
 return <TooltipProvider delayDuration={220}><PlayShell><PlayHeader location="Item & Ability Studio" details="Local authoring" balance={null} scope="local"><Button size="sm" variant="outline" onClick={()=>navigatePlay('world')}><ArrowLeft/>Community</Button></PlayHeader>
 <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
 <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2"><h1 className="mr-2 font-heading text-xl font-semibold">Item & Ability Studio</h1><WeaponIcon source={item.weaponIcon} itemId={item.id} name={item.name} active/><Input aria-label="Item name" className="h-8 w-40" value={item.name} maxLength={80} onChange={e=>commit({...item,name:e.target.value},false)}/><Select value={selectedWeapon} onValueChange={selectWeapon}>
    <SelectTrigger className="h-8 w-52" aria-label="Weapon selection"><SelectValue/></SelectTrigger>
    <SelectContent>
      <SelectItem value="sword"><WeaponIcon itemId="training-sword-v1" name="Sword" size={24}/>Sword</SelectItem>
      <SelectItem value="chain"><WeaponIcon itemId="moonvine-chain-v1" name="Chain" size={24}/>Chain</SelectItem>
      <SelectItem value="hammer"><WeaponIcon itemId="ruby-hammer-v1" name="Ruby hammer" size={24}/>Ruby hammer</SelectItem>
      <SelectItem value="guardian"><WeaponIcon itemId="spectral-swordsman-v1" name="Spectral swordsman" size={24}/>Spectral swordsman</SelectItem>
      <SelectItem value="scythe"><WeaponIcon itemId="ivory-twin-scythes-v1" name="Ivory twin scythes" size={24}/>Ivory twin scythes</SelectItem>
      {selectedWeapon==='custom'&&<SelectItem value="custom" disabled>Custom item</SelectItem>}
    </SelectContent>
  </Select>
  <Select value={character} onValueChange={v=>setCharacter(v as 'amber'|'yae')}><SelectTrigger className="h-8 w-32" aria-label="Equipped character"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="amber">Amber</SelectItem><SelectItem value="yae">Yae Miko</SelectItem></SelectContent></Select><div className="ml-auto flex items-center gap-1"><Button size="icon-sm" variant="ghost" aria-label="Undo item edit" disabled={!history.current.undo.length} onClick={()=>undo()}><Undo2/></Button><Button size="icon-sm" variant="ghost" aria-label="Redo item edit" disabled={!history.current.redo.length} onClick={()=>undo(true)}><Redo2/></Button><Button size="sm" variant="outline" onClick={()=>file.current?.click()}><Upload/><span className="hidden sm:inline">Import</span></Button><Button size="sm" variant="outline" onClick={()=>{try{const valid=readItem(item);downloadFile('pawtrail-item.json',new Blob([JSON.stringify(valid,null,2)],{type:'application/json'}))}catch(e){setError((e as Error).message)}}}><Download/><span className="hidden sm:inline">Export</span></Button><Button size="sm" onClick={save}><Save/>Save locally</Button></div></header>
 <nav className="flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-1.5" aria-label="Item workspaces">{workspaces.map(([id,label,Icon])=><Button key={id} size="sm" variant={workspace===id?'secondary':'ghost'} aria-pressed={workspace===id} onClick={()=>changeWorkspace(id)}><Icon className="size-4"/>{label}</Button>)}</nav>
 {error&&<div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs"><span>{error}</span><Button size="sm" variant="outline" onClick={()=>{setError('');setRendererEpoch(n=>n+1)}}>Retry viewport</Button><Button size="sm" variant="ghost" onClick={()=>setError('')}>Dismiss</Button></div>}
 <div className="flex border-b p-1 lg:hidden" role="group" aria-label="Studio panels">{['library','preview','properties','timeline'].map(p=><Button key={p} size="sm" className="flex-1 capitalize" variant={pane===p?'secondary':'ghost'} onClick={()=>setPane(p)}>{p}</Button>)}</div>
 <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)_340px]">
  <aside className={`${pane==='library'?'flex':'hidden lg:flex'} min-h-0 flex-col overflow-y-auto border-r bg-muted/15 p-3`}><h2 className="mb-2 font-heading text-lg font-semibold">Actions</h2>{availableActions(item).map(k=><ItemAbilityTooltip key={k} item={item} actionKey={k} className="w-full"><Button variant={key===k?'secondary':'ghost'} className="mb-1 h-auto w-full justify-start py-2 text-left" onClick={()=>chooseAction(k)}><ItemAbilityIcon item={item} slot={k==='combo2'||k==='combo3'?'primary':k} active={key===k}/><span><span className="block text-xs">{getAction(item,k).name}</span><span className="text-[10px] font-normal text-muted-foreground">{ACTION_LABELS[k]}</span></span></Button></ItemAbilityTooltip>)}
   <h2 className="mb-2 mt-5 font-heading text-lg font-semibold">Parts <span className="text-xs text-muted-foreground">{item.parts.length}/24</span></h2>{item.parts.map(part=><Button key={part.id} size="sm" variant={view.geometry===part.id?'secondary':'ghost'} className="h-7 justify-start truncate text-xs" onClick={()=>{setView(v=>({...v,geometry:part.id}));changeWorkspace('geometry')}}><span className="size-2 shrink-0 rounded-sm border" style={{background:part.color}}/>{part.name}</Button>)}
   <h2 className="mb-2 mt-5 font-heading text-lg font-semibold">Saved on this device</h2>
   {library.length ? library.map(row => (
     <div key={row.id} className="flex min-w-0 gap-1">
       <Button size="sm" variant="ghost" className="min-w-0 flex-1 justify-start truncate text-xs" onClick={() => installDraft(structuredClone(row))}>
         <WeaponIcon source={row.weaponIcon} itemId={row.id} name={row.name} size={24}/>{row.name}
       </Button>
       <Button
         size="icon-sm"
         variant="ghost"
         aria-label={'Delete saved ' + row.name}
         onClick={() => {
           try {
             removeItem(row.id)
             setLibrary(loadItems())
           } catch (error) {
             setError((error as Error).message)
           }
         }}
       >
         <Trash2 className="size-3"/>
       </Button>
     </div>
   )) : (
     <p className="text-xs leading-relaxed text-muted-foreground">Save your first item to make it available in the Stage editor.</p>
   )}
   <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => installDraft(duplicateItem(item))}>
     <Copy/>Duplicate item
   </Button>
   <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={()=>installDraft(chainWeapon())}>Load Moonvine chain</Button>
   <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => installDraft(trainingSword())}>
     Load training sword
   </Button>
   <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => {
     const next = trainingSword()
     next.id = itemId()
     next.name = 'Untitled item'
     next.parts = []
     next.meshEdits = []
     installDraft(next)
   }}>
     New empty item
   </Button>
  </aside>
  <section className={`${pane==='preview'?'flex':'hidden lg:flex'} relative min-h-0 flex-col bg-[#c6cfb1]`} aria-label="Item viewport"><div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2"><span className="min-w-0 truncate rounded-md border bg-background/95 px-2 py-1 text-xs">{isTraining?report.phase:workspace==='geometry'?'Portable item parts':workspace==='equip'?'Grip & tip markers':'Masked action preview'}</span><div className="flex shrink-0 items-center gap-1">
     {isTraining&&<div role="group" aria-label="Training camera zoom" className="flex items-center gap-1 rounded-md border bg-background p-0.5">
       <Button size="icon-sm" variant="ghost" aria-label="Zoom out" title="Zoom out (−)" disabled={!ready||report.zoom<=1} onClick={()=>training.current?.zoomBy(-1)}><ZoomOut className="size-4"/></Button>
       <span className="w-7 text-center text-xs tabular-nums" aria-live="polite">{report.zoom}×</span>
       <Button size="icon-sm" variant="ghost" aria-label="Zoom in" title="Zoom in (+)" disabled={!ready||report.zoom>=6} onClick={()=>training.current?.zoomBy(1)}><ZoomIn className="size-4"/></Button>
       <Button size="icon-sm" variant="ghost" aria-label="Reset training camera zoom" title="Fit camera (0)" disabled={!ready} onClick={()=>training.current?.fitZoom()}><ScanLine className="size-4"/></Button>
     </div>}
     <Button size="icon-sm" variant="outline" aria-label={muted?'Enable item sounds':'Mute item sounds'} onClick={()=>setMuted(!muted)}>{muted?<VolumeX/>:<Volume2/>}</Button>
   </div></div><div ref={host} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"/>{!ready&&<div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 text-sm"><LoaderCircle className="size-4 animate-spin"/>Loading {character==='amber'?'Amber':'Yae Miko'}…</div>}
   {isTraining&&<UltimateCutIn/>}
   {isTraining?<div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t bg-background px-3 py-2">{(['primary','running','extend','special']as const).filter(k=>!!item.actions[k]).map(k=>{
    const move=getAction(item,k),queued=k==='primary'&&report.canChain,remaining=queued?0:report.cooldowns[k]
    return <ItemAbilityTooltip key={k} item={item} actionKey={k} disabled={!ready||remaining>0}><Button variant="outline" className={`h-auto justify-start gap-2 px-2 py-2 text-left ${k==='special'?'border-amber-700/40':''}`} disabled={!ready||remaining>0} onClick={()=>{training.current?.activate(k);setPlaying(false)}}>
     <ItemAbilityIcon item={item} slot={k} remaining={remaining} active={report.activeAction===k||k==='primary'&&['combo2','combo3'].includes(report.activeAction??'')}/>
     <span className="min-w-0"><span className="block font-heading text-sm font-semibold">{queued?(report.buffered?'Next strike queued':'Queue next strike'):move.name}</span><span className="block text-[10px] font-normal text-muted-foreground">{k==='special'?'Ultimate · K':k==='primary'?'Skill 1 · J':k==='running'?'Skill 2 · R':'Skill 3 · L'}{remaining>0?` · ${(remaining/1000).toFixed(1)}s`:''}</span></span>
    </Button></ItemAbilityTooltip>
   })}</div>:<p className="shrink-0 border-t bg-background px-3 py-2 text-center text-xs text-muted-foreground">Drag to rotate · scroll to zoom · right-drag to orbit while editing</p>}
  </section>
  <aside className={`${pane==='properties'?'block':'hidden lg:block'} min-h-0 overflow-y-auto border-l bg-background`}>{properties}{workspace==='try'&&<section className="border-t p-4"><h3 className="mb-2 font-heading text-lg font-semibold">Event log</h3><ol className="max-h-48 space-y-1 overflow-auto font-mono text-[10px] text-muted-foreground">{report.log.length?report.log.map((line,i)=><li key={i}>{line}</li>):<li>Use an action to see releases, hits and wall contacts.</li>}</ol></section>}</aside>
 </div>
 <div className={`${pane==='timeline'?'block':'hidden lg:block'}`}><ItemTimeline action={action} time={time} playing={playing} loop={loop} speed={speed} selected={selected} onRemember={remember} onMoveEvent={(id,time)=>{const a=getAction(latest.current.item,latest.current.key);updateAction({events:a.events.map(e=>e.id===id?{...e,time}:e)},false)}} onSeek={seek} onPlay={play} onLoop={setLoop} onSpeed={setSpeed} onEvent={id=>{setSelected(id);changeWorkspace('effects')}} onAdd={addEvent} onDuplicate={()=>{if(event){const copy={...event,id:itemId(),time:Math.min(action.duration,event.time+50)};updateAction({events:[...action.events,copy]});setSelected(copy.id)}}} onDelete={()=>{updateAction({events:action.events.filter(e=>e.id!==selected)});setSelected(null)}}/></div>
 <footer className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-1.5 text-[11px] text-muted-foreground"><span role="status">{notice}</span><span className="hidden sm:inline">32 px = 1 tile · no live-world effects</span></footer>
 </main><Input ref={file} type="file" accept="application/json,.json" aria-label="Import item JSON" className="hidden" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value=''}}/>
 </PlayShell></TooltipProvider>
}
