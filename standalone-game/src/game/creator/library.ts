import { characterRequest, housingFailure } from '../housing/client'
import { creatorContract, customCharacterId, readAppearance, type SavedCharacter, type ActorAppearance } from '../actor-rig/appearance'
import { FACE_STYLE_REVISION } from '../actor-rig/face-details'

type LibraryState={device:SavedCharacter[];account:SavedCharacter[];status:'idle'|'loading'|'ready'|'guest'|'error';error:string}
const DEVICE='pawtrail:characters:device:v1', CACHE='pawtrail:characters:equipped:v1'
const listeners=new Set<()=>void>(),cache=new Map<string,SavedCharacter>(),pending=new Map<string,Promise<SavedCharacter|null>>()
function parseCharacter(value:unknown,scope:SavedCharacter['scope']):SavedCharacter|null{
  if(!value||typeof value!=='object')return null
  const row=value as SavedCharacter,appearance=readAppearance(row.appearance)
  if(!customCharacterId(row.id)||!appearance||typeof row.name!=='string'||!row.name.trim()||row.name.length>64||!Number.isInteger(row.revision)||row.revision<1)return null
  return {id:row.id,name:row.name,appearance,scope,revision:row.revision,updated:typeof row.updated==='string'?row.updated:'',
    ...(row.thumbnailStyle===FACE_STYLE_REVISION&&typeof row.thumbnail==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(row.thumbnail)&&row.thumbnail.length<100000?{thumbnail:row.thumbnail,thumbnailStyle:FACE_STYLE_REVISION}:{})}
}
function readDevice(){
  try{const list:unknown=JSON.parse(localStorage.getItem(DEVICE)??'[]');return Array.isArray(list)?list.slice(0,creatorContract.limit).flatMap(row=>{const item=parseCharacter(row,'device');return item?[item]:[]}):[]}
  catch{return []}
}
let state:LibraryState={device:typeof window==='undefined'?[]:readDevice(),account:[],status:'idle',error:''}
for(const row of state.device)cache.set(row.id,row)
if(typeof window!=='undefined')try{const rows=JSON.parse(localStorage.getItem(CACHE)??'[]');if(Array.isArray(rows))for(const row of rows.slice(0,creatorContract.limit)){const clean=parseCharacter(row,'account');if(clean)cache.set(clean.id,clean)}}catch{/* Optional equipped appearance cache. */}
function patch(next:Partial<LibraryState>){state={...state,...next};for(const listener of listeners)listener()}
export const characterLibrary={subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},getSnapshot:()=>state}
let loading:Promise<void>|undefined
export function loadCharacterLibrary(){
  if(loading)return loading
  patch({status:'loading',error:''})
  loading=characterRequest<{items:unknown[]}>().then(result=>{
    if(!Array.isArray(result.items))throw new Error('The character library returned an incomplete response.')
    const rows=result.items.flatMap(row=>{const clean=parseCharacter(row,'account');return clean?[clean]:[]})
    for(const row of rows)cache.set(row.id,row)
    patch({account:rows,status:'ready',error:''})
  }).catch(error=>{
    if(housingFailure(error)==='auth')patch({account:[],status:'guest',error:''})
    else patch({status:'error',error:error instanceof Error?error.message:'Your account library is unavailable. Device saves remain available.'})
  }).finally(()=>{loading=undefined})
  return loading
}
export function getSavedCharacter(id:string){return cache.get(id)}
export async function resolveSavedCharacter(id:string){
  if(!customCharacterId(id))return null
  if(pending.has(id))return pending.get(id)!
  const cached=cache.get(id)
  // Device-only characters intentionally never leave this browser.
  if(cached?.scope==='device')return cached
  const task=characterRequest<{character:unknown}>(undefined,id).then(result=>{
    const row=parseCharacter(result.character,'account');if(row)cache.set(id,row);return row
  }).catch(()=>cached??null).finally(()=>pending.delete(id))
  pending.set(id,task);return task
}
export function cacheEquippedCharacter(row:SavedCharacter){
  cache.set(row.id,row)
  if(row.scope==='account')try{localStorage.setItem(CACHE,JSON.stringify([...cache.values()].filter(c=>c.scope==='account').slice(-creatorContract.limit)))}catch{/* Account save is already persisted; this cache is optional. */}
  window.dispatchEvent(new CustomEvent('pawtrail:characters',{detail:{id:row.id}}))
}
export async function saveCharacter(input:{id?:string;name:string;appearance:ActorAppearance;scope:SavedCharacter['scope'];revision?:number;thumbnail?:string}){
  const id=input.id??'custom_'+crypto.randomUUID().replaceAll('-',''),name=input.name.trim()
  if(!name||name.length>64||/[\x00-\x1f]/.test(name))throw new Error('Use a name of 1–64 characters.')
  const appearance=readAppearance(input.appearance)
  if(!appearance)throw new Error('This character configuration is not supported.')
  let row:SavedCharacter
  if(input.scope==='account'){
    const result=await characterRequest<{character:unknown}>({operation:'save',id,name,appearance,revision:input.revision})
    const parsed=parseCharacter(result.character,'account');if(!parsed)throw new Error('The character save response was incomplete.')
    row={...parsed,thumbnail:input.thumbnail,thumbnailStyle:FACE_STYLE_REVISION};patch({account:[row,...state.account.filter(c=>c.id!==id)]})
  }else{
    const existing=state.device.find(c=>c.id===id)
    if(!existing&&state.device.length>=creatorContract.limit)throw new Error('Your device library is full. Remove a character before creating another.')
    if(existing&&existing.revision!==input.revision)throw new Error('This character changed in another tab. Reload the library before saving.')
    row={id,name,appearance,scope:'device',revision:(existing?.revision??0)+1,updated:new Date().toISOString(),thumbnail:input.thumbnail,thumbnailStyle:FACE_STYLE_REVISION}
    const next=[row,...state.device.filter(c=>c.id!==id)]
    try{localStorage.setItem(DEVICE,JSON.stringify(next))}catch{throw new Error('Your browser could not save this character. Free some storage or choose Account.')}
    patch({device:next})
  }
  cacheEquippedCharacter(row);return row
}
export async function deleteCharacter(row:SavedCharacter){
  if(row.scope==='account'){
    await characterRequest({operation:'delete',id:row.id});patch({account:state.account.filter(c=>c.id!==row.id)})
  }else{
    const next=state.device.filter(c=>c.id!==row.id)
    try{localStorage.setItem(DEVICE,JSON.stringify(next))}catch{throw new Error('Your browser could not update the library.')}
    patch({device:next})
  }
  cache.delete(row.id)
}
export async function equipCharacter(row:SavedCharacter){
  if(row.scope==='account')await characterRequest({operation:'select',id:row.id})
  cacheEquippedCharacter(row)
  const {chooseCharacter}=await import('../store');chooseCharacter(row.id as import('../characters').CharacterId)
  if(row.scope==='device')try{if(localStorage.getItem('pawtrail:appearance:pending')===row.id)localStorage.removeItem('pawtrail:appearance:pending')}catch{/* Device selection still applies locally. */}
}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{
  if(event.key===DEVICE){const device=readDevice();for(const row of state.device)if(!device.some(c=>c.id===row.id))cache.delete(row.id);for(const row of device)cache.set(row.id,row);patch({device})}
})
