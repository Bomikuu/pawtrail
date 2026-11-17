import type {CSSProperties} from 'react'

export const DIALOGUE_ART='/pawtrail-game/game-assets/hud/dialogue-v2/'
/** Reuse the approved dialogue's native nine-slice textures across game HUDs. */
export function dialogueFrame(name:'panel'|'portrait'|'speech'|'action'|'close',slice:number):CSSProperties{
 return{borderImageSource:`url(${DIALOGUE_ART}${name}.png)`,borderImageSlice:`${slice} fill`,borderImageRepeat:'stretch'}
}
