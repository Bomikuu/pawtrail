import type {ReactElement} from 'react'
import {Tooltip,TooltipTrigger} from '@/components/ui/tooltip'
import {GameTooltipContent} from '../shared/game-tooltip'
import {ACTION_LABELS,getAction,itemActionDescription,type ActionKey,type ItemDocument} from '@/game/items/document'
import {ItemAbilityIcon} from './ability-icon'

/** The wrapper keeps descriptions available even while an action button is disabled. */
export function ItemAbilityTooltip({item,actionKey,disabled=false,className='',children}:{item:ItemDocument;actionKey:ActionKey;disabled?:boolean;className?:string;children:ReactElement}){
 const action=getAction(item,actionKey),slot=actionKey==='combo2'||actionKey==='combo3'?'primary':actionKey
 return <Tooltip>
  <span className={`inline-flex min-w-0 ${className}`}><TooltipTrigger asChild>{disabled?<span className="inline-flex min-w-0" tabIndex={0} aria-label={action.name}>{children}</span>:children}</TooltipTrigger></span>
  <GameTooltipContent side="top" sideOffset={8} className="space-y-2">
   <div className="flex items-center gap-2"><ItemAbilityIcon item={item} slot={slot}/><div><p className="font-heading text-base font-semibold leading-tight">{action.name}</p><p className="text-[10px] text-[#795033]">{actionKey==='special'?'Ultimate · ':''}{ACTION_LABELS[actionKey]}</p></div></div>
   <p className="text-xs leading-relaxed">{itemActionDescription(action)}</p>
   <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-[#bd8d59]/40 pt-2 text-[11px] text-[#795033]"><span>Cooldown: {(action.cooldown/1000).toLocaleString(undefined,{maximumFractionDigits:2})}s</span><span>{action.lockMovement?'Manual movement locked':'Usable while moving'}</span></div>
  </GameTooltipContent>
 </Tooltip>
}
