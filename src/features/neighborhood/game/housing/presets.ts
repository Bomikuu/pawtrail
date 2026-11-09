import raw from './house-presets.json'
import legacy from './house-presets-legacy.json'
import type {Placement} from './types'
export type FloorId='interior'|'upstairs'
export type FloorPlan={label:string;width:number;height:number;spawn:[number,number];door:[number,number]|null;walls:{rect:number[];gaps:number[][]}[];protected:number[][];stairs:{rect:number[];landing:[number,number];to:FloorId}[];rooms:string[];items:Placement[];fixtures?:{item:string;x:number;y:number}[]}
export type HousePreset={id:string;name:string;description:string;thumbnail:string;preview:string;floor:string;wallpaper:string;furniturePack?:string;floors:Partial<Record<FloorId,FloorPlan>>}
export const HOUSE_PRESETS=raw as unknown as HousePreset[]
const LEGACY_PRESETS=legacy as unknown as HousePreset[]
export const housePreset=(id='studio')=>[...HOUSE_PRESETS,...LEGACY_PRESETS].find(p=>p.id===id)||HOUSE_PRESETS[0]
export const floorPlan=(id='studio',zone='interior')=>housePreset(id).floors[zone as FloorId]
export function rectangleCells(rect:number[]){const [x,y,w,h]=rect,result=new Set<string>();for(let a=x;a<x+w;a++)for(let b=y;b<y+h;b++)result.add(a+','+b);return result}
export function structuralCells(id='studio',zone='interior'){
  const floor=floorPlan(id,zone),result=new Set<string>();if(!floor)return result
  for(const wall of floor.walls){const cells=rectangleCells(wall.rect);wall.gaps.forEach(g=>rectangleCells(g).forEach(k=>cells.delete(k)));cells.forEach(k=>result.add(k))}
  floor.stairs.forEach(stair=>rectangleCells(stair.rect).forEach(k=>result.add(k)));return result
}
export function protectedCells(id='studio',zone='interior'){
  const result=new Set<string>();floorPlan(id,zone)?.protected.forEach(r=>rectangleCells(r).forEach(k=>result.add(k)));return result
}
