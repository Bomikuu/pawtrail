import { catalogue, furnitureAt } from '../housing/geometry'
import type { Furniture } from '../housing/types'
import communityArt from '../housing/community-art.json'
import { floorPlan } from '../housing/presets'

export const TILE=32
export type StageLayer='ground'|'world'|'foreground'
export type StageObject={id:string;asset:string;x:number;y:number;elevation:number;layer:StageLayer;bias:number;rotation:number;style?:string}
export type StageDocument={format:'pawtrail-stage';version:1;name:string;width:number;height:number;baseTile:string;tiles:Record<string,string>;shell:boolean;wallpaper:string;objects:StageObject[]}
export type StageAsset={id:string;label:string;category:string;kind:'tile'|'object';file:string;width:number;height:number;anchor:number[];footprint:number[];frame?:number;furniture?:Furniture;rotations:number[]}
type StageView=StageAsset&{angle:number;frontFile?:string;stateViews?:Furniture['stateViews'];geometry:Furniture['geometry']}
const floors=['oak-light-a','wood-dark-a','carpet-a','ceramic-a','stone','patterned']
export const stageAssets:StageAsset[]=[
  ...floors.map(id=>({id:'tile:'+id,label:id.replace(/-/g,' '),category:'Floor tiles',kind:'tile' as const,file:`/assets/game/housing/tilesets/${id}-housing-v1.png`,width:32,height:32,anchor:[16,32],footprint:[0,0,32,32],rotations:[0]})),
  ...[['Grass',0],['Dirt trail',9],['Stone path',11],['Asphalt',12],['Water',17]].map(([name,frame])=>({id:'terrain:'+frame,label:String(name),category:'Terrain',kind:'tile' as const,file:'/pawtrail-game/game-assets/terrain.png',width:32,height:32,anchor:[16,32],footprint:[0,0,32,32],rotations:[0],frame:Number(frame)})),
  ...catalogue.items.map(def=>({id:'f:'+def.id,label:def.label,category:def.category||'Furniture',kind:'object' as const,file:def.file,width:def.width,height:def.height,anchor:def.anchor,footprint:def.footprint,furniture:def,rotations:def.supportedRotations??(def.orientationVariants?Object.keys(def.orientationVariants).map(Number):def.rotatable?[0,90,180,270]:[0])})),
  ...Object.entries(communityArt.sprites).map(([id,def])=>({id:'environment:'+id,label:id.replace(/-/g,' '),category:'Community & nature',kind:'object' as const,file:def.file,width:def.width,height:def.height,anchor:def.anchor,footprint:def.footprint??[0,0,0,0],rotations:[0]})),
  ...['cream','sage','wood'].flatMap(style=>['north','west','east','south'].map(side=>({id:`wall:${style}:${side}`,label:`${style} wall ${side}`,category:'Walls',kind:'object' as const,file:`/assets/game/housing/tilesets/${style}-${side}-modular-v2.png`,width:32,height:32,anchor:[16,32],footprint:[0,16,32,16],rotations:[0]}))),
]
export const assetsById=Object.fromEntries(stageAssets.map(asset=>[asset.id,asset]))
export const tileAssets=stageAssets.filter(asset=>asset.kind==='tile')
export const assetView=(object:StageObject):StageView=>{
  const asset=assetsById[object.asset]
  if(!asset.furniture)return {...asset,angle:0,frontFile:undefined,geometry:{version:2,ground:[],placement:[],approaches:[],seats:[],surfaces:[],occlusion:'base',actions:[]}}
  const base=asset.furniture,def=furnitureAt({id:object.id,item:base.id,x:0,y:0,rotation:object.rotation,style:object.style})
  return {...asset,...def,angle:base.renderedViews||base.orientationVariants?.[String(object.rotation)]?0:object.rotation,file:base.orientationVariants?.[String(object.rotation)]??def.file}
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
  const plan=floorPlan('studio','interior')!
  return {format:'pawtrail-stage',version:1,name:kind==='yard'?'Garden stage':kind==='empty'?'Untitled room':'Cozy studio',width:kind==='studio'?plan.width:20,height:kind==='studio'?plan.height:14,baseTile:kind==='yard'?'terrain:0':'tile:wood-dark-a',tiles:{},shell:kind!=='yard',wallpaper:'cream',objects:kind==='studio'?plan.items.filter(p=>assetsById['f:'+p.item]).map<StageObject>(p=>({id:newId(),asset:'f:'+p.item,x:p.x*32+16,y:p.y*32+32,elevation:0,layer:assetsById['f:'+p.item].furniture?.geometry?.occlusion==='floor'?'ground':'world',bias:0,rotation:assetsById['f:'+p.item].rotations.includes(p.rotation)?p.rotation:assetsById['f:'+p.item].rotations[0],style:assetsById['f:'+p.item].furniture?.styles?.some(style=>style.id===p.style)?p.style:undefined})):[]}
}
export function readStage(value:unknown):StageDocument{
  if(!value||typeof value!=='object')throw Error('Choose a PawTrail stage JSON file.')
  const data=value as StageDocument
  if(data.format!=='pawtrail-stage'||data.version!==1||!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<8||data.height<8||data.width>64||data.height>64||typeof data.name!=='string'||data.name.length>80||!tileAssets.some(a=>a.id===data.baseTile)||typeof data.shell!=='boolean'||!['cream','sage','wood'].includes(data.wallpaper)||!Array.isArray(data.objects)||data.objects.length>1000||!data.tiles||typeof data.tiles!=='object'||Object.keys(data.tiles).length>4096)throw Error('The stage dimensions, tiles or object data are invalid.')
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
  return {format:'pawtrail-stage',version:1,name:data.name,width:data.width,height:data.height,baseTile:data.baseTile,tiles,shell:data.shell,wallpaper:data.wallpaper,objects}
}
const images=new Map<string,Promise<HTMLImageElement>>()
export function stageImage(file:string){
  if(!images.has(file))images.set(file,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not load '+file));image.src=file}))
  return images.get(file)!
}
export function paintAsset(context:CanvasRenderingContext2D,image:HTMLImageElement,asset:StageAsset,x:number,y:number,w=asset.width,h=asset.height){
  if(asset.frame!==undefined){const columns=image.naturalWidth/32;context.drawImage(image,asset.frame%columns*32,Math.floor(asset.frame/columns)*32,32,32,x,y,w,h)}else context.drawImage(image,x,y,w,h)
}
