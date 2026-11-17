import { catalogue, furnitureAt } from '../housing/geometry'
import type { Furniture } from '../housing/types'
import communityArt from '../housing/community-art.json'
import { floorPlan } from '../housing/presets'
import nativeRegistry from './native-assets.json'
import careGrove from './maps/care-grove-v5.json'
import groveArt from './grove-art.json'
import villageArt from './village-art.json'
import village from './maps/sampaguita-village-v1.json'
import neonArt from './neon-art.json'
import neonHeights from './maps/neon-heights-v1.json'
import f01Art from './f01-art.json'
import f01BatchB from './f01-batch-b-art.json'
import f01BatchC from './f01-batch-c-art.json'
import f01BatchD from './f01-batch-d-art.json'
import f01Switchyard from './maps/f01-switchyard-v1.json'
import f01Undergrid from './maps/f01-undergrid-v1.json'
import f01Skybridge from './maps/f01-skybridge-v1.json'
import f01Lobby from './maps/f01-lobby-v1.json'
import f01Arrival from './maps/f01-arrival-v1.json'
import f01Market from './maps/f01-market-v1.json'
import type { SceneryMotion, ReflectionPatch } from '../floors/scenery-motion'

export const TILE=32
export type StageLayer='ground'|'world'|'foreground'
export type StageObject={id:string;asset:string;x:number;y:number;elevation:number;layer:StageLayer;bias:number;rotation:number;style?:string}
export type StageDocument={format:'pawtrail-stage';version:1;name:string;width:number;height:number;baseTile:string;groundArt?:string;walkable?:number[][];tiles:Record<string,string>;shell:boolean;wallpaper:string;objects:StageObject[]}
export type StageAsset={id:string;label:string;category:string;kind:'tile'|'object';file:string;width:number;height:number;anchor:number[];footprint:number[];frame?:number;sourceRect?:[number,number,number,number];blocking?:boolean;furniture?:Furniture;rotations:number[];motion?:SceneryMotion;liveModel?:{file?:string;existing?:string};npc?:'mara'|'ivo'|'nyx'|'eko'|'sena'}
type GroundPainting={id:string;label:string;file:string;width:number;height:number;reflections?:ReflectionPatch[]}
export const groundPaintings:Record<string,GroundPainting>=Object.fromEntries(([...groveArt.grounds,...villageArt.grounds,...neonArt.grounds,...f01Art.grounds,...f01BatchB.grounds,...f01BatchC.grounds] as GroundPainting[]).map(ground=>[ground.id,ground]))
type StageView=StageAsset&{angle:number;frontFile?:string;stateViews?:Furniture['stateViews'];geometry:Furniture['geometry']}
const floors=['oak-light-a','wood-dark-a','carpet-a','ceramic-a','stone','patterned']
export const stageAssets:StageAsset[]=[
  ...floors.map(id=>({id:'tile:'+id,label:id.replace(/-/g,' '),category:'Floor tiles',kind:'tile' as const,file:`/assets/game/housing/tilesets/${id}-housing-v1.png`,width:32,height:32,anchor:[16,32],footprint:[0,0,32,32],rotations:[0]})),
  ...(nativeRegistry.assets as StageAsset[]),
  ...(groveArt.assets as StageAsset[]),
  ...(villageArt.assets as StageAsset[]),
  ...(neonArt.assets as StageAsset[]),
  ...(f01Art.assets as unknown as StageAsset[]),
  ...(f01BatchB.assets as unknown as StageAsset[]),
  ...(f01BatchC.assets as unknown as StageAsset[]),
  ...(f01BatchD.assets as unknown as StageAsset[]),
  ...catalogue.items.map(def=>({id:'f:'+def.id,label:def.label,category:def.category||'Furniture',kind:'object' as const,file:def.file,width:def.width,height:def.height,anchor:def.anchor,footprint:def.footprint,furniture:def,rotations:def.supportedRotations??(def.orientationVariants?Object.keys(def.orientationVariants).map(Number):def.rotatable?[0,90,180,270]:[0])})),
  ...Object.entries(communityArt.sprites).map(([id,def])=>({id:'environment:'+id,label:id.replace(/-/g,' '),category:'Community & nature',kind:'object' as const,file:def.file,width:def.width,height:def.height,anchor:def.anchor,footprint:def.footprint??[0,0,0,0],rotations:[0]})),
  ...['cream','sage','wood'].flatMap(style=>['north','west','east','south'].map(side=>({id:`wall:${style}:${side}`,label:`${style} wall ${side}`,category:'Walls',kind:'object' as const,file:`/assets/game/housing/tilesets/${style}-${side}-modular-v2.png`,width:32,height:32,anchor:[16,32],footprint:[0,16,32,16],rotations:[0]}))),
]
export const assetsById=Object.fromEntries(stageAssets.map(asset=>[asset.id,asset]))
export const tileAssets=stageAssets.filter(asset=>asset.kind==='tile')
export const assetView=(object:StageObject):StageView=>{
  const asset=assetsById[object.asset]
  if(!asset.furniture)return {...asset,angle:0,frontFile:undefined,geometry:{version:2,ground:[],placement:[],approaches:[],seats:[],surfaces:[],occlusion:'base',actions:[]}}
  const base=asset.furniture,def=asset.liveModel?.file||asset.npc?{...base,...base.renderedViews?.[String(object.rotation)]}:furnitureAt({id:object.id,item:base.id,x:0,y:0,rotation:object.rotation,style:object.style})
  return {...asset,...def,angle:base.renderedViews||base.orientationVariants?.[String(object.rotation)]?0:object.rotation,file:base.orientationVariants?.[String(object.rotation)]??def.file}
}
/** Native contacts resolve against the selected stage view, including local-only
 * floor props which deliberately do not enter the social housing catalogue. */
export function stagePoint(object:StageObject,point:number[]){
  const view=assetView(object),a=view.angle*Math.PI/180,x=point[0]-view.anchor[0],y=point[1]-view.anchor[1]
  return{x:object.x+x*Math.cos(a)-y*Math.sin(a),y:object.y+x*Math.sin(a)+y*Math.cos(a)}
}
export function stageRect(object:StageObject,rect:number[]){
  const[x,y,w,h]=rect,points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(point=>stagePoint(object,point))
  const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y))
  return{x:left,y:top,width:Math.max(...points.map(p=>p.x))-left,height:Math.max(...points.map(p=>p.y))-top}
}
export function depthOf(object:StageObject){return ({ground:-100000,world:0,foreground:100000}[object.layer])+object.y+object.bias}
export function footprint(object:StageObject){
  const view=assetView(object),[x,y,w,h]=view.footprint,angle=view.angle*Math.PI/180
  const points=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([x,y])=>{const dx=x-view.anchor[0],dy=y-view.anchor[1];return{x:object.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:object.y+dx*Math.sin(angle)+dy*Math.cos(angle)}})
  const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y))
  return{x:left,y:top,width:Math.max(...points.map(p=>p.x))-left,height:Math.max(...points.map(p=>p.y))-top}
}
export const cloneStage=(stage:StageDocument):StageDocument=>structuredClone(stage)
export const newId=()=>crypto.randomUUID()
export function starterStage(kind='studio'):StageDocument{
  if(kind==='care-grove')return readStage(careGrove)
  if(kind==='village')return readStage(village)
  if(kind==='cyberpunk')return readStage(neonHeights)
  if(kind==='f01-lobby')return readStage(f01Lobby)
  if(kind==='f01-arrival')return readStage(f01Arrival)
  if(kind==='f01-market')return readStage(f01Market)
  if(kind==='f01-undergrid')return readStage(f01Undergrid)
  if(kind==='f01-skybridge')return readStage(f01Skybridge)
  if(kind==='f01-switchyard')return readStage(f01Switchyard)
  const plan=floorPlan('studio','interior')!
  return {format:'pawtrail-stage',version:1,name:kind==='yard'?'Garden stage':kind==='empty'?'Untitled room':'Cozy studio',width:kind==='studio'?plan.width:20,height:kind==='studio'?plan.height:14,baseTile:kind==='yard'?'terrain:0':'tile:wood-dark-a',tiles:{},shell:kind!=='yard',wallpaper:'cream',objects:kind==='studio'?plan.items.filter(p=>assetsById['f:'+p.item]).map<StageObject>(p=>({id:newId(),asset:'f:'+p.item,x:p.x*32+16,y:p.y*32+32,elevation:0,layer:assetsById['f:'+p.item].furniture?.geometry?.occlusion==='floor'?'ground':'world',bias:0,rotation:assetsById['f:'+p.item].rotations.includes(p.rotation)?p.rotation:assetsById['f:'+p.item].rotations[0],style:assetsById['f:'+p.item].furniture?.styles?.some(style=>style.id===p.style)?p.style:undefined})):[]}
}
export function readStage(value:unknown):StageDocument{
  if(!value||typeof value!=='object')throw Error('Choose a PawTrail stage JSON file.')
  const data=value as StageDocument
  if((data.groundArt!==undefined&&!Object.hasOwn(groundPaintings,data.groundArt))||data.format!=='pawtrail-stage'||data.version!==1||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<8||data.height<8||data.width>64||data.height>64||typeof data.name!=='string'||data.name.length>80||!tileAssets.some(a=>a.id===data.baseTile)||typeof data.shell!=='boolean'||!['cream','sage','wood'].includes(data.wallpaper)||!Array.isArray(data.objects)||data.objects.length>1000||!data.tiles||typeof data.tiles!=='object'||Object.keys(data.tiles).length>4096)throw Error('The stage dimensions, tiles or object data are invalid.')
  if(data.walkable!==undefined&&(!Array.isArray(data.walkable)||data.walkable.length<3||data.walkable.length>64||!data.walkable.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[1]>=0&&p[0]<=data.width*32&&p[1]<=data.height*32)))throw Error('The walkable boundary is invalid.')
  const tiles:Record<string,string>={}
  for(const [key,id]of Object.entries(data.tiles)){
    if(!/^\d+,\d+$/.test(key)||!tileAssets.some(a=>a.id===id))throw Error('The stage contains an unknown tile.')
    const[x,y]=key.split(',').map(Number);if(x>=data.width||y>=data.height)throw Error('A tile is outside the stage.');tiles[key]=id
  }
  const seen=new Set<string>()
  const objects=data.objects.map(object=>{
    if(!object||typeof object!=='object')throw Error('The stage contains an invalid object.')
    const asset=assetsById[object.asset]
    if(!asset||asset.kind!=='object'||typeof object.id!=='string'||object.id.length>100||seen.has(object.id)||![object.x,object.y,object.elevation,object.bias,object.rotation].every(Number.isFinite)||object.x<0||object.y<0||object.x>data.width*32||object.y>data.height*32||object.elevation<0||object.elevation>192||Math.abs(object.bias)>999||!['ground','world','foreground'].includes(object.layer)||!asset.rotations.includes(object.rotation)||(object.style!==undefined&&!asset.furniture?.styles?.some(s=>s.id===object.style)))throw Error('A placed object has invalid coordinates, style or rotation.')
    seen.add(object.id);return{id:object.id,asset:object.asset,x:Math.round(object.x),y:Math.round(object.y),elevation:Math.round(object.elevation),bias:Math.round(object.bias),rotation:object.rotation,layer:object.layer,style:object.style}
  })
  return {format:'pawtrail-stage',version:1,name:data.name,width:data.width,height:data.height,baseTile:data.baseTile,groundArt:data.groundArt,walkable:data.walkable?.map(p=>[...p]),tiles,shell:data.shell,wallpaper:data.wallpaper,objects}
}
const images=new Map<string,Promise<HTMLImageElement>>()
export function stageImage(file:string){
  if(!images.has(file))images.set(file,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not load '+file));image.src=file}))
  return images.get(file)!
}
export function paintAsset(context:CanvasRenderingContext2D,image:HTMLImageElement,asset:StageAsset,x:number,y:number,w=asset.width,h=asset.height){
  if(asset.sourceRect)context.drawImage(image,...asset.sourceRect,x,y,w,h)
  else if(asset.frame!==undefined){const columns=image.naturalWidth/32;context.drawImage(image,asset.frame%columns*32,Math.floor(asset.frame/columns)*32,32,32,x,y,w,h)}else context.drawImage(image,x,y,w,h)
}
