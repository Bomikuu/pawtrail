import { senaAppearance } from './npcs/sena'
import { maraAppearance } from './npcs/mara'
import { ivoAppearance } from './npcs/ivo'
import { nyxAppearance } from './npcs/nyx'
import type { ActorIllustration } from '../creator/illustrations'

export type FloorNpcId='mara'|'ivo'|'nyx'|'eko'|'sena'
const presentation=(id:FloorNpcId,name:string):ActorIllustration=>({name,folder:`/pawtrail-game/floors/f01/npcs/${id}/illustration`,nativeSize:[192,320],rendering:'pixelated',style:'Refined cel + painterly',motion:'Full-body authored idle · natural blinking'})
/** Art rehearsal lines; no quest/currency/memory mutation until Phase 3. */
export const floorNpcs={
  sena:{name:'Sena Valez',role:'Freight Dispatch · Grid Wardens',appearance:senaAppearance,portrait:'sena-valez-refined-cel',illustration:presentation('sena','Sena Valez'),line:'Two records. One working gate. Bring the Seal and the Writ, and we can open the dead line.'},
  mara:{name:'Mara Solis',role:'Lantern Landing medic',appearance:maraAppearance,portrait:'mara-solis-refined-cel',illustration:presentation('mara','Mara Solis'),line:'You made it. Take a breath before you head into the market. The clinic is here when you need a place to rest.'},
  ivo:{name:'Ivo Mercado',role:'Lumen Market merchant',appearance:ivoAppearance,portrait:'ivo-mercado-refined-cel',illustration:presentation('ivo','Ivo Mercado'),line:'Welcome to Lumen Market. Look around before you decide what to carry. A careful plan leaves room for what you find.'},
  nyx:{name:'Nyx Tal',role:'Rainline courier',appearance:nyxAppearance,portrait:'nyx-tal-refined-cel',illustration:presentation('nyx','Nyx Tal'),line:'I’m Nyx. Courier, when the city lets me.'},
  eko:{name:'EKO-9',role:'Hologram Plaza archivist',appearance:null,portrait:'eko-9-refined-cel',illustration:{...presentation('eko','EKO-9'),motion:'Authored hologram motion and blinking · full grounded emitter'},line:'A smaller archive can still be an honest one.'},
} as const
