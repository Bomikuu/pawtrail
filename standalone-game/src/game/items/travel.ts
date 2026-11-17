import type {ItemAction} from './document'
/** Ground movement is independent of model dimensions and walking footprints. */
export function itemTravel(action:ItemAction,time:number) {
  const motion=action.rootMotion
  if(!motion||motion.distance===0)return 0
  const t=Math.max(0,Math.min(1,(time-motion.start)/Math.max(1,motion.end-motion.start)))
  return motion.distance*t*t*(3-2*t)
}
