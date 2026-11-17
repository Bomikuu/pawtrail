import type {ActorIllustration} from './illustrations'
import type {IllustrationMotionRig} from './illustration-motion'

export type IllustrationTrack={nativeSize:[number,number];atlas:string;frames:{id:number;rect:[number,number,number,number]}[];sequence:number[];durationMs:number[]}
export type IllustrationLayer=IllustrationTrack&{id:'background'|'actor'|'aura';offset:[number,number];opacity?:number}
export type IllustrationManifest=IllustrationTrack&{compositionSize?:[number,number];layers?:IllustrationLayer[];backdrop?:string;motionRig?:IllustrationMotionRig}
export type LoadedIllustration={data:IllustrationManifest;image:HTMLImageElement;layers:{data:IllustrationLayer;image:HTMLImageElement}[];rigImage?:HTMLImageElement}
const cache=new Map<string,Promise<LoadedIllustration>>()
const validSize=(size:unknown):size is [number,number]=>Array.isArray(size)&&size.length===2&&size.every(n=>Number.isInteger(n)&&n>0&&n<=1024)
function validateTrack(data:IllustrationTrack,image:HTMLImageElement){
 if(!validSize(data.nativeSize)||!Array.isArray(data.sequence)||!data.sequence.length||data.sequence.length>128||data.sequence.length!==data.durationMs?.length||data.durationMs.some(time=>!Number.isFinite(time)||time<=0))throw Error('Illustration timing unavailable')
 if(!Array.isArray(data.frames)||!data.frames.length||data.frames.length>64)throw Error('Illustration frames unavailable')
 const ids=new Set(data.frames.map(frame=>frame.id))
 if(data.sequence.some(id=>!ids.has(id))||data.frames.some(frame=>!Array.isArray(frame.rect)||frame.rect.length!==4||frame.rect.some(n=>!Number.isInteger(n)||n<0)||frame.rect[2]!==data.nativeSize[0]||frame.rect[3]!==data.nativeSize[1]||frame.rect[0]+frame.rect[2]>image.naturalWidth||frame.rect[1]+frame.rect[3]>image.naturalHeight))throw Error('Illustration atlas does not match its frames')
}
/** Legacy single atlases and independently authored layers use one compositor. */
export function loadActorIllustration(illustration:ActorIllustration){
 const key=illustration.folder,existing=cache.get(key);if(existing)return existing
 const loading=(async()=>{
  const response=await fetch(key+'/illustration.json')
  if(!response.ok)throw Error('Illustration data unavailable')
  const data:IllustrationManifest=await response.json()
  const images=new Map<string,Promise<HTMLImageElement>>()
  const load=(file:string)=>{
   if(!/^[a-z0-9-]+\.(webp|png)$/.test(file))throw Error('Unsupported illustration asset')
   if(!images.has(file))images.set(file,(async()=>{const image=new Image();image.src=key+'/'+file;await image.decode();return image})())
   return images.get(file)!
  }
  const image=await load(data.atlas);validateTrack(data,image)
  if(data.compositionSize&&!validSize(data.compositionSize))throw Error('Illustration composition unavailable')
  if(data.backdrop&&!/^#[0-9a-f]{6}$/i.test(data.backdrop))throw Error('Unsupported illustration backdrop')
  if(data.layers&&(!Array.isArray(data.layers)||data.layers.length>4))throw Error('Illustration layers unavailable')
  const layerIds=new Set<string>()
  const layers=await Promise.all((data.layers??[]).map(async layer=>{
   if(layer.opacity!==undefined&&(!Number.isFinite(layer.opacity)||layer.opacity<0||layer.opacity>1))throw Error('Unsupported illustration opacity')
   if(!['background','actor','aura'].includes(layer.id)||layerIds.has(layer.id)||!Array.isArray(layer.offset)||layer.offset.length!==2||layer.offset.some(n=>!Number.isInteger(n)||Math.abs(n)>1024))throw Error('Unsupported illustration layer')
   layerIds.add(layer.id);const image=await load(layer.atlas);validateTrack(layer,image);return{data:layer,image}
  }))
  let rigImage:HTMLImageElement|undefined
  if(data.motionRig){
   const rig=data.motionRig
   if(!Number.isFinite(rig.cycleMs)||rig.cycleMs<1000||rig.cycleMs>60000||!Array.isArray(rig.parts)||!rig.parts.length||rig.parts.length>16)throw Error('Illustration motion unavailable')
   rigImage=await load(rig.atlas)
   const pair=(value:unknown):value is [number,number]=>Array.isArray(value)&&value.length===2&&value.every(n=>Number.isFinite(n)&&Math.abs(n)<=2048)
   const ids=new Set<string>()
   for(const part of rig.parts){
    if(typeof part.id!=='string'||ids.has(part.id)||!Array.isArray(part.rect)||part.rect.length!==4||part.rect.some(n=>!Number.isInteger(n)||n<0)||!part.rect[2]||!part.rect[3]||part.rect[0]+part.rect[2]>rigImage.naturalWidth||part.rect[1]+part.rect[3]>rigImage.naturalHeight||!pair(part.offset)||!pair(part.root)||!pair(part.direction)||Math.hypot(...part.direction)<.001||!Number.isFinite(part.length)||part.length<=0||part.length>2048||!Number.isFinite(part.amplitude)||part.amplitude<0||part.amplitude>24||!Number.isFinite(part.phase))throw Error('Illustration part does not match its artwork')
    ids.add(part.id)
    if(part.cycles!==undefined&&(!Number.isInteger(part.cycles)||part.cycles<1||part.cycles>4))throw Error('Unsupported illustration motion frequency')
    if(part.pulse&&(!Number.isFinite(part.pulse.min)||!Number.isFinite(part.pulse.max)||part.pulse.min<0||part.pulse.max>1||part.pulse.min>part.pulse.max||!Number.isInteger(part.pulse.cycles)||part.pulse.cycles<1||part.pulse.cycles>3))throw Error('Unsupported illustration glow')
   }
  }
  return{data,image,layers,rigImage}
 })().catch(error=>{cache.delete(key);throw error})
 cache.set(key,loading)
 while(cache.size>4)cache.delete(cache.keys().next().value!)
 // Warm the still fallback as well, without delaying play mode.
 const poster=new Image();poster.src=key+'/poster.webp'
 return loading
}
