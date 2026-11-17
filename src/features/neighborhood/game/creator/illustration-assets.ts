import type {ActorIllustration} from './illustrations'

export type IllustrationManifest={nativeSize:[number,number];atlas:string;frames:{id:number;rect:[number,number,number,number]}[];sequence:number[];durationMs:number[]}
const cache=new Map<string,Promise<{data:IllustrationManifest;image:HTMLImageElement}>>()
/** The preview and brief ability cut-ins share the same small authored atlas. */
export function loadActorIllustration(illustration:ActorIllustration){
 const key=illustration.folder,existing=cache.get(key);if(existing)return existing
 const loading=(async()=>{
  const response=await fetch(key+'/illustration.json')
  if(!response.ok)throw Error('Illustration data unavailable')
  const data:IllustrationManifest=await response.json()
  if(!data.sequence?.length||data.sequence.length!==data.durationMs?.length||data.durationMs.some(time=>!Number.isFinite(time)||time<=0))throw Error('Illustration timing unavailable')
  const image=new Image();image.src=key+'/'+data.atlas;await image.decode()
  return{data,image}
 })().catch(error=>{cache.delete(key);throw error})
 cache.set(key,loading)
 while(cache.size>4)cache.delete(cache.keys().next().value!)
 // Warm the still fallback as well, without delaying play mode.
 const poster=new Image();poster.src=key+'/poster.webp'
 return loading
}
