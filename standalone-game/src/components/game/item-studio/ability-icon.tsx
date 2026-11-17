import type {AbilitySlot,ItemDocument} from '@/game/items/document'
/** Generated artwork follows the item's portable document, including local exports. */
export function ItemAbilityIcon({item,slot,remaining=0,active=false}:{item:ItemDocument;slot:AbilitySlot;remaining?:number;active?:boolean}){
 const source=item.icons?.[slot]
 if(!source)return null
 const cooldown=item.actions[slot]?.cooldown??0,amount=cooldown>0?Math.min(100,remaining/cooldown*100):0
 return <span aria-hidden="true" className={`relative block size-10 shrink-0 overflow-hidden rounded-md border-2 bg-[#211827] ${active?'border-violet-300 shadow-[0_0_12px_#c998fa88]':slot==='special'?'border-amber-500':'border-[#78543b]'}`}>
  <img src={source} alt="" width={64} height={64} className="size-full object-contain [image-rendering:pixelated]" draggable={false}/>
  {remaining>0&&<span className="absolute inset-x-0 bottom-0 bg-black/65" style={{height:amount+'%'}}/>}
  {remaining>0&&<span className="absolute inset-0 grid place-items-center font-heading text-sm font-bold tabular-nums text-white">{(remaining/1000).toFixed(1)}</span>}
 </span>
}
