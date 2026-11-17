import {getSavedCharacter} from '../creator/library'
import {defaultAppearance} from '../actor-rig/appearance'
import {featuredActors} from '../runtime/featured-actors'
const normal=defaultAppearance()
export const gameAppearance=(id:string|undefined)=>id?featuredActors[id]?.appearance??getSavedCharacter(id)?.appearance??normal:normal
export function headingVector(direction:string){
  return {x:direction.includes('left')?-1:direction.includes('right')?1:0,y:direction.includes('up')?-1:direction.includes('down')?1:0}
}
