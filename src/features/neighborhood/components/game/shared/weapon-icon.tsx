import {Box} from 'lucide-react'
import icons from '@/features/neighborhood/game/items/weapon-icons.json'

const builtins:Readonly<Record<string,string>>=icons
/** An equipment thumbnail, distinct from an action icon and its cooldown state. */
export function WeaponIcon({source,itemId,name,size=32,active=false}:{source?:string;itemId?:string;name:string;size?:24|32|40|48;active?:boolean}){
 const image=source||builtins[itemId??'']
 return <span aria-hidden="true" style={{width:size,height:size}} className={'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-[#211827] '+(active?'border-[#d9b56f] shadow-[0_0_8px_#c998fa55]':'border-[#78543b]')}>
  {image?<img src={image} alt={name} width={64} height={64} draggable={false} className="size-full object-contain [image-rendering:pixelated]"/>:<Box className="size-3 text-[#edc997]"/>}
 </span>
}
