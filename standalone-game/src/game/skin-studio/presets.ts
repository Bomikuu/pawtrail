import {creatorTemplates} from '../creator/state'
import {getSilhouettePanels,type PanelLayout} from './silhouette-layers'
import {readTexture} from './textures'

export const FLOATING_SKIN_ID='dororong-floating'
export const normalizeStudioPresetId=(id:string|null)=>id==='mochi-floating'||id==='dororong'?FLOATING_SKIN_ID:id
const appearance=structuredClone(creatorTemplates.find(row=>row.id==='custom-base')!.appearance)
appearance.colors={...appearance.colors,hair:'#c993b6',hairLight:'#f5d9e5',hairShade:'#a17b95',shirt:'#fcf9f6',shirtLight:'#fffefd',shirtDark:'#d1bed6',jacket:'#fcf9f6',jacketLight:'#eee4ee',shorts:'#fcf9f6',shoe:'#59414f'}
/** Studio-only artwork demonstration; not an equipped game/account appearance. */
export const studioTemplates=[...creatorTemplates,{id:FLOATING_SKIN_ID,name:'Dororong · Shared base',appearance,previewModel:'shared' as const}]
export function initialStudioTemplate(){
 const id=typeof window==='undefined'?null:new URLSearchParams(window.location.search).get('skin')
 return studioTemplates.find(row=>row.id===normalizeStudioPresetId(id))??studioTemplates.find(row=>row.id==='custom-base')!
}
export async function loadStudioPreset(id:string,layout:PanelLayout='joint-panels-v2'):Promise<Record<string,HTMLImageElement>>{
 if(normalizeStudioPresetId(id)!==FLOATING_SKIN_ID)return {}
 const directory=layout==='legacy-24'?'dororong-floating-v2':'dororong-floating-v3'
 // Normal 3D hands/feet start with clean paint surfaces. The earlier paw icons
 // remain source assets, rather than being painted as circles on a real palm.
 const panels=getSilhouettePanels(layout).filter(panel=>!/^(Wrist|Ankle)/.test(panel.bone))
 return Object.fromEntries(await Promise.all(panels.map(async panel=>{
  try{return [panel.id,await readTexture('/assets/game/skins/'+directory+'/'+panel.id+'.png')]as const}
  catch{throw new Error('Dororong’s '+panel.label+' texture could not load ('+panel.id+'.png). Reload the preview to retry.')}
 })))
}
