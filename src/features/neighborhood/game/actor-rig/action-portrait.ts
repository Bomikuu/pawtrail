import { canonicalActorAction } from './action-layers'
import type { PortraitExpression } from './portrait-state'
import type { PortraitBlink } from './photo-portrait-catalog'

type PortraitPerformance={expression:PortraitExpression;blink:PortraitBlink;label:string;fallback:boolean}
const labels:Record<string,string>={idle:'Neutral',smile:'Gentle smile',happy:'Happy',sad:'Sad',angry:'Angry',surprised:'Surprised'}

/** Select existing authored artwork; never draw or splice facial features at runtime. */
export function portraitForAction(rawAction='idle',fullExpressions=false,cat=false):PortraitPerformance{
  const action=canonicalActorAction(rawAction).replace(/^(idle|walk|run)_.+$/,'$1')
  let expression:PortraitExpression='idle',blink:PortraitBlink='auto'
  if(['sad','sick','tired'].includes(action))expression='sad'
  else if(['angry','power_up','power_run','rescue_dash'].includes(action))expression='angry'
  else if(['surprised','jetpack_takeoff'].includes(action))expression='surprised'
  else if(['happy','laugh','dance','cheer','play','ride','jetpack','jump','pounce','roll_yarn','chase_tail','fly'].includes(action))expression='happy'
  else if(['pet','feed','water','eat','drink','clean','groom','wave','clap','give_gift','hold_item','float','gentle_approach','knead','tail_wag'].includes(action))expression='smile'
  const resting=action==='sleep'||action==='lie_down'
  if(resting){expression='idle';if(fullExpressions)blink='closed'}
  // Generic legacy busts and cat packs have fewer expressions than authored humans.
  const fallback=(cat?!['idle','happy'].includes(expression):!fullExpressions&&['sad','angry','surprised'].includes(expression))||resting&&!fullExpressions
  if(fallback)expression=cat&&expression==='smile'?'happy':'idle'
  const label=blink==='closed'?'Resting':labels[expression]??'Neutral'
  return {expression,blink,label,fallback}
}
