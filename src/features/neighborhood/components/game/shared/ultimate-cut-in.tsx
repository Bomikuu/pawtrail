import {useSyncExternalStore} from 'react'
import {ultimateCutIn} from '@/features/neighborhood/game/items/ultimate-cut-in'
import {actorIllustrations} from '@/features/neighborhood/game/creator/illustrations'
import {IllustrationPreview} from './illustration-preview'
import {dialogueFrame} from './dialogue-frame'

/** Decorative, brief and click-through; the ability continues in the live scene. */
export function UltimateCutIn(){
 const state=useSyncExternalStore(ultimateCutIn.subscribe,ultimateCutIn.getSnapshot,ultimateCutIn.getServerSnapshot)
 if(!state)return null
 const illustration=actorIllustrations[state.character];if(!illustration)return null
 return <aside key={state.id} className={'pointer-events-none absolute top-12 bottom-20 left-2 z-30 flex w-40 flex-col justify-end min-[1200px]:w-80 motion-reduce:animate-none '+(state.leaving?'animate-out fade-out slide-out-to-left-6 duration-150':'animate-in fade-in slide-in-from-left-8 duration-200')}>
  <div aria-hidden="true" className="relative min-h-0 flex-1 [filter:drop-shadow(0_0_12px_#d6a8e077)]"><IllustrationPreview illustration={illustration} presentation="cutin"/></div>
  <div style={dialogueFrame('panel',24)} className="mt-1 w-fit max-w-full rounded-md border-[6px] border-transparent bg-[#fff0d1] bg-clip-padding px-2 py-1 text-[#57331d] [image-rendering:pixelated]"><p className="font-heading text-lg font-semibold leading-tight">{illustration.name}</p><p className="text-xs leading-snug">{state.ability}</p></div>
  <p role="status" className="sr-only">{illustration.name} uses {state.ability}.</p>
 </aside>
}
