import {emptyModelDocument,readModelDocument,type StudioGeometry,type MeshVertexEdit,type StudioPose,type StudioKeyframe,type Triple,type StudioJoint} from '../skin-studio/model-document'
export type Vec={x:number;y:number}
export type Rect=Vec&{width:number;height:number}
export const ACTION_KEYS=['primary','combo2','combo3','running','extend','special'] as const
export type ActionKey=typeof ACTION_KEYS[number]
export const ABILITY_SLOTS=['primary','running','extend','special'] as const
export type AbilitySlot=typeof ABILITY_SLOTS[number]
export const ACTION_LABELS:Record<ActionKey,string>={primary:'J · Strike 1',combo2:'J → J · Strike 2',combo3:'J → J → J · Finisher',running:'R / running J · Sweep',extend:'L · Extend',special:'K · Circle'}
export type ItemPart=Omit<StudioGeometry,'parent'>
export type HitArea={kind:'arc'|'circle'|'box'|'capsule';range:number;width:number;angle:number;offset:number}
export type ItemSound='swing'|'wave'|'impact'
export type ItemEvent={id:string;time:number;kind:'trail'|'burst'|'projectile'|'sound';color:string;size:number;lifetime:number;sound:ItemSound}
export type HitWindow={id:string;start:number;end:number;area:HitArea;knockback:number}
export type ChainMotion={mode:'sweep'|'thrust'|'orbit';reach:number;angle:number;start:number;end:number;color:string;segments:number;width:number;reverse?:boolean}
export type SpectralGuardian={kind:'spectral-swordsman';scale:number;opacity:number;offset:Triple}
export type WeaponStance={name:string;angles:StudioPose['angles'];walkWeight:number;runWeight:number}
export type ItemAction={id:string;name:string;description?:string;duration:number;cooldown:number;windup:number;activeEnd:number;lockMovement:boolean;combo?:{next:ActionKey;open:number;close:number;buffer:number};hitWindows?:HitWindow[];chain?:ChainMotion;hitStop?:number;rootMotion?:{distance:number;start:number;end:number};mask:StudioJoint[];frames:StudioKeyframe[];itemFrames:{time:number;rotation:Triple}[];area:HitArea;melee:boolean;projectile:{speed:number;width:number;depth:number;range:number;lifetime:number;pierce:boolean;stopAtWalls:boolean};events:ItemEvent[]}
export type ItemDocument={format:'pawtrail-item';version:1;id:string;name:string;weaponIcon?:string;idleChain?:boolean;guardian?:SpectralGuardian;stance?:WeaponStance;icons?:Partial<Record<AbilitySlot,string>>;parts:ItemPart[];meshEdits:MeshVertexEdit[];equipment:{socket:'WristRight'|'WristLeft';paired?:{position:Triple;rotation:Triple;mirror:boolean};carry?:{socket:'SpineBend';position:Triple;rotation:Triple};position:Triple;rotation:Triple;pivot:Triple;tip:Triple};actions:Record<'primary'|'special',ItemAction>&Partial<Record<Exclude<ActionKey,'primary'|'special'>,ItemAction>>}
export function hasHoverChain(item:ItemDocument){return item.idleChain??Object.values(item.actions).some(action=>!!action?.chain)}
export function getAction(item:ItemDocument,key:ActionKey){return item.actions[key]??item.actions.primary}
/** Older portable items remain readable; new weapons author their own descriptions. */
export function itemActionDescription(action:ItemAction){
 if(action.description?.trim())return action.description.trim()
 const projectile=action.events.some(event=>event.kind==='projectile')
 const effect=action.chain?({sweep:'Unfurl the weighted chain in a wide sweep.',thrust:'Send the weighted chain straight ahead.',orbit:'Swing the chain around you.'})[action.chain.mode]
  :projectile&&!action.melee?'Release an energy wave forward.'
  :action.area.kind==='circle'?'Strike nearby targets around you.':'Swing the equipped weapon through a frontal arc.'
 return effect+(action.rootMotion?.distance?' Advance a short distance during the strike.':'')+(action.combo?' Press J again during the combo window to follow up.':'')
}
export function availableActions(item:ItemDocument){return ACTION_KEYS.filter(key=>!!item.actions[key])}
export function emptyCooldowns():Record<ActionKey,number>{return{primary:0,combo2:0,combo3:0,running:0,extend:0,special:0}}
export function fitActionDuration(action:ItemAction,duration:number):Partial<ItemAction>{
 const range=(start:number,end:number)=>({start:Math.min(start,duration-1),end:Math.min(end,duration)})
 return{combo:action.combo?{...action.combo,open:Math.min(action.combo.open,duration-1),close:Math.min(action.combo.close,duration)}:undefined,chain:action.chain?{...action.chain,...range(action.chain.start,action.chain.end)}:undefined,hitWindows:action.hitWindows?.map(w=>({...w,start:Math.min(w.start,duration),end:Math.min(w.end,duration)}))}
}
export const itemId=()=>crypto.randomUUID()
export const emptyPose=():StudioPose=>({root:[0,0,0],angles:{}})
const finite=(value:unknown,min:number,max:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max
const triple=(v:unknown,min:number,max:number):v is Triple=>Array.isArray(v)&&v.length===3&&v.every(n=>finite(n,min,max))
const color=(v:unknown)=>typeof v==='string'&&/^#[\da-f]{6}$/i.test(v)
const text=(v:unknown,max=80):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max
const fail=()=>{throw Error('Invalid item file. Use a version 1 PawTrail item; parts, timings and textures must stay within studio limits.')}
/** Compact native PNGs only, shared by equipment and ability thumbnails. */
function readItemIcon(source:unknown):string{
 if(typeof source!=='string'||source.length>40000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(source))return fail()
 const header=Uint8Array.from(atob(source.split(',')[1].slice(0,44)),c=>c.charCodeAt(0))
 if(header.length<24||header[0]!==137||String.fromCharCode(...header.slice(1,4))!=='PNG')return fail()
 const size=new DataView(header.buffer),width=size.getUint32(16),height=size.getUint32(20)
 if(width<16||width>128||width!==height)throw Error('Item icons must be square PNGs between 16 and 128 native pixels.')
 return source
}
/** Normalize to known data fields through the existing geometry/pose validator. No executable imports. */
export function readItem(value:unknown):ItemDocument{
  if(!value||typeof value!=='object')return fail()
  const d=value as ItemDocument
  if(d.format!=='pawtrail-item'||d.version!==1||!text(d.id,100)||!text(d.name)||!Array.isArray(d.parts)||d.parts.length>24||!Array.isArray(d.meshEdits)||!d.equipment||!d.actions)return fail()
  const model=readModelDocument({...emptyModelDocument(),geometry:d.parts.map(p=>({...p,parent:'Head'})),meshEdits:d.meshEdits})
  if(model.meshEdits.some(edit=>!model.geometry.some(part=>edit.mesh==='attachment:'+part.id)))throw Error('Item vertex edits must belong to an item part, not a character mesh.')
  for(const part of model.geometry)if(part.texture){const header=atob(part.texture.split(',')[1].slice(0,44)),bytes=Uint8Array.from(header,c=>c.charCodeAt(0));if(bytes.length<24||bytes[0]!==137||String.fromCharCode(...bytes.slice(1,4))!=='PNG')return fail();const dimensions=new DataView(bytes.buffer),w=dimensions.getUint32(16),h=dimensions.getUint32(20);if(w<1||h<1||w>128||h>128)throw Error('Item textures must be at most 128 × 128 native pixels.')}
  if(d.idleChain!==undefined&&typeof d.idleChain!=='boolean')return fail()
  if(d.guardian&&(d.guardian.kind!=='spectral-swordsman'||!finite(d.guardian.scale,.6,1.8)||!finite(d.guardian.opacity,.35,1)||!triple(d.guardian.offset,-32,32)))return fail()
  if(d.stance&&(!text(d.stance.name,80)||!d.stance.angles||typeof d.stance.angles!=='object'||Array.isArray(d.stance.angles)||!finite(d.stance.walkWeight,0,1)||!finite(d.stance.runWeight,0,1)))return fail()
  const e=d.equipment
  if(!['WristRight','WristLeft'].includes(e.socket)||!triple(e.position,-40,40)||!triple(e.rotation,-180,180)||!triple(e.pivot,-40,40)||!triple(e.tip,-40,40))return fail()
  if(e.carry&&(e.carry.socket!=='SpineBend'||!triple(e.carry.position,-40,40)||!triple(e.carry.rotation,-180,180)))return fail()
  if(e.paired&&(!triple(e.paired.position,-40,40)||!triple(e.paired.rotation,-180,180)||typeof e.paired.mirror!=='boolean'))return fail()
  const actions={} as ItemDocument['actions']
  for(const key of ACTION_KEYS){
    const a=d.actions[key]
    if(!a&&key!=='primary'&&key!=='special')continue
    if(!a||!text(a.id,100)||!text(a.name)||!finite(a.duration,100,10000)||!finite(a.cooldown,0,30000)||!finite(a.windup,0,a.duration)||!finite(a.activeEnd,a.windup,a.duration)||typeof a.lockMovement!=='boolean'||typeof a.melee!=='boolean'||!Array.isArray(a.mask)||!Array.isArray(a.frames)||!Array.isArray(a.itemFrames)||a.itemFrames.length>24||!Array.isArray(a.events)||a.events.length>32)return fail()
    if(a.description!==undefined&&(typeof a.description!=='string'||a.description.length>600))return fail()
    const clip=readModelDocument({...emptyModelDocument(),duration:Math.max(.5,a.duration/1000),frames:a.frames,loop:false})
    if(a.frames.some(f=>!finite(f.time,0,a.duration/1000)))return fail()
    if(a.mask.some(j=>typeof j!=='string'||!jointNames.has(j)))return fail()
    const rootMotion=a.rootMotion??{distance:0,start:0,end:a.duration}
    if(!rootMotion||!finite(rootMotion.distance,0,24)||!finite(rootMotion.start,0,a.duration)||!finite(rootMotion.end,rootMotion.start+1,a.duration))return fail()
    const h=a.area,p=a.projectile
    if(!h||!['arc','circle','box','capsule'].includes(h.kind)||!finite(h.range,8,256)||!finite(h.width,8,192)||!finite(h.angle,10,360)||!finite(h.offset,0,128)||!p||!finite(p.speed,16,640)||!finite(p.width,8,192)||!finite(p.depth,4,64)||!finite(p.range,16,640)||!finite(p.lifetime,100,5000)||typeof p.pierce!=='boolean'||typeof p.stopAtWalls!=='boolean')return fail()
    const ids=new Set<string>()
    const events=a.events.map(ev=>{if(!ev||!text(ev.id,100)||ids.has(ev.id)||!finite(ev.time,0,a.duration)||!['trail','burst','projectile','sound'].includes(ev.kind)||!color(ev.color)||!finite(ev.size,4,256)||!finite(ev.lifetime,50,3000)||!['swing','wave','impact'].includes(ev.sound))return fail();ids.add(ev.id);return{id:ev.id,time:ev.time,kind:ev.kind,color:ev.color,size:ev.size,lifetime:ev.lifetime,sound:ev.sound}})
    if(events.filter(ev=>ev.kind==='projectile').length>8)return fail()
    const itemFrames=a.itemFrames.map(f=>{if(!f||!finite(f.time,0,a.duration)||!triple(f.rotation,-180,180))return fail();return{time:f.time,rotation:[...f.rotation] as Triple}}).sort((a,b)=>a.time-b.time)
    const extras:Pick<ItemAction,'combo'|'hitWindows'|'chain'|'hitStop'>={}
    if(a.combo){const c=a.combo;if(!ACTION_KEYS.includes(c.next)||!finite(c.open,0,a.duration)||!finite(c.close,c.open+1,a.duration)||!finite(c.buffer,0,300))return fail();extras.combo={next:c.next,open:c.open,close:c.close,buffer:c.buffer}}
    if(a.hitWindows){if(!Array.isArray(a.hitWindows)||a.hitWindows.length>8)return fail();const ids=new Set<string>();extras.hitWindows=a.hitWindows.map(w=>{const h=w.area;if(!text(w.id,100)||ids.has(w.id)||!finite(w.start,0,a.duration)||!finite(w.end,w.start,a.duration)||!finite(w.knockback,0,32)||!h||!['arc','circle','box','capsule'].includes(h.kind)||!finite(h.range,8,256)||!finite(h.width,8,192)||!finite(h.angle,10,360)||!finite(h.offset,0,128))return fail();ids.add(w.id);return{id:w.id,start:w.start,end:w.end,knockback:w.knockback,area:{kind:h.kind,range:h.range,width:h.width,angle:h.angle,offset:h.offset}}})}
    if(a.chain){const c=a.chain;if(!['sweep','thrust','orbit'].includes(c.mode)||!finite(c.reach,8,192)||!finite(c.angle,10,1080)||!finite(c.start,0,a.duration)||!finite(c.end,c.start+1,a.duration)||!color(c.color)||!finite(c.segments,8,32)||!Number.isInteger(c.segments)||!finite(c.width,2,16))return fail();if(c.reverse!==undefined&&typeof c.reverse!=='boolean')return fail();extras.chain={reverse:!!c.reverse,mode:c.mode,reach:c.reach,angle:c.angle,start:c.start,end:c.end,color:c.color,segments:c.segments,width:c.width}}
    if(a.hitStop!==undefined){if(!finite(a.hitStop,0,80))return fail();extras.hitStop=a.hitStop}
    actions[key]={...extras,id:a.id,name:a.name,...(a.description?.trim()?{description:a.description.trim()}:{}),duration:a.duration,cooldown:a.cooldown,windup:a.windup,activeEnd:a.activeEnd,lockMovement:a.lockMovement,rootMotion:{distance:rootMotion.distance,start:rootMotion.start,end:rootMotion.end},mask:[...new Set(a.mask)],frames:clip.frames,itemFrames,area:{kind:h.kind,range:h.range,width:h.width,angle:h.angle,offset:h.offset},melee:a.melee,projectile:{speed:p.speed,width:p.width,depth:p.depth,range:p.range,lifetime:p.lifetime,pierce:p.pierce,stopAtWalls:p.stopAtWalls},events}
  }
  const actionIds=new Set<string>()
  for(const action of Object.values(actions)){if(!action||actionIds.has(action.id))return fail();actionIds.add(action.id);if(action.combo&&!actions[action.combo.next])throw Error('A combo points to an action missing from this item.')} 
  const result:ItemDocument={format:'pawtrail-item',version:1,id:d.id,name:d.name.trim(),...(d.idleChain!==undefined?{idleChain:d.idleChain}:{}),parts:model.geometry.map(({parent,...part})=>part),meshEdits:model.meshEdits,equipment:{socket:e.socket,...(e.carry?{carry:{socket:'SpineBend' as const,position:[...e.carry.position] as Triple,rotation:[...e.carry.rotation] as Triple}}:{}),position:[...e.position],rotation:[...e.rotation],pivot:[...e.pivot],tip:[...e.tip]},actions}
  if(d.guardian)result.guardian={kind:'spectral-swordsman',scale:d.guardian.scale,opacity:d.guardian.opacity,offset:[...d.guardian.offset] as Triple}
  if(d.stance){
    const angles:StudioPose['angles']={}
    for(const[joint,angle]of Object.entries(d.stance.angles)){
      if(!/^(SpineBend|Head|ShoulderLeft|ShoulderRight|ElbowLeft|ElbowRight|WristLeft|WristRight)$/.test(joint)||!triple(angle,-180,180))return fail()
      angles[joint as StudioJoint]=[...angle] as Triple
    }
    result.stance={name:d.stance.name.trim(),angles,walkWeight:d.stance.walkWeight,runWeight:d.stance.runWeight}
  }
  if(e.paired)result.equipment.paired={position:[...e.paired.position] as Triple,rotation:[...e.paired.rotation] as Triple,mirror:e.paired.mirror}
  if(d.weaponIcon!==undefined)result.weaponIcon=readItemIcon(d.weaponIcon)
  if(d.icons){
    if(typeof d.icons!=='object'||Array.isArray(d.icons))return fail()
    const icons:Partial<Record<AbilitySlot,string>>={}
    for(const slot of ABILITY_SLOTS){const source=d.icons[slot];if(source!==undefined)icons[slot]=readItemIcon(source)}
    result.icons=icons
  }
  if(JSON.stringify(result).length>2_000_000)throw Error('Item exceeds the 2 MB local document limit. Reduce embedded textures.')
  return result
}
const jointNames=new Set(['Head','SpineBend','ShoulderLeft','ShoulderRight','ElbowLeft','ElbowRight','WristLeft','WristRight','HipLeft','HipRight','KneeLeft','KneeRight','AnkleLeft','AnkleRight'])
const CATALOG='pawtrail:item-catalog:v1'
export function loadItems():ItemDocument[]{const raw=localStorage.getItem(CATALOG);if(!raw)return[];const rows:unknown=JSON.parse(raw);if(!Array.isArray(rows)||rows.length>20)throw Error('Local item library is invalid. Import an exported item to recover.');return rows.map(readItem)}
export function saveItem(item:ItemDocument){const valid=readItem(item),rows=loadItems().filter(row=>row.id!==valid.id);if(rows.length>=20)throw Error('Your local library holds 20 items. Remove one before saving another.');localStorage.setItem(CATALOG,JSON.stringify([...rows,valid]));window.dispatchEvent(new Event('pawtrail-items-changed'))}
export function removeItem(id:string){localStorage.setItem(CATALOG,JSON.stringify(loadItems().filter(row=>row.id!==id)));window.dispatchEvent(new Event('pawtrail-items-changed'))}
export function duplicateItem(item:ItemDocument){const next=structuredClone(item);next.id=itemId();next.name=(next.name+' copy').slice(0,80);for(const action of Object.values(next.actions)){if(!action)continue;action.id=itemId();action.frames.forEach(f=>f.id=itemId());action.events.forEach(e=>e.id=itemId())}return next}
