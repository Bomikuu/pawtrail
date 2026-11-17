import {HUMAN_GAIT} from '../actor-rig/human-gait'
/** Shared human gait timing; studio uses the same configured world travel speeds. */
export const STUDIO_LOCOMOTION = {
  speedMultiplier: 1,
  walkCycleDistance: HUMAN_GAIT.walkCycleDistance,
  runCycleDistance: HUMAN_GAIT.runCycleDistance,
  acceleration: 30,
  braking: 38,
  turnRadiansPerSecond: HUMAN_GAIT.turnSpeed,
  blendMs: HUMAN_GAIT.blendMs,
} as const
export type MotionPoint = {x:number;y:number}
export function approachVelocity(current:MotionPoint,target:MotionPoint,dt:number):MotionPoint {
  const response=target.x||target.y?STUDIO_LOCOMOTION.acceleration:STUDIO_LOCOMOTION.braking
  const blend=1-Math.exp(-response*dt)
  const next={x:current.x+(target.x-current.x)*blend,y:current.y+(target.y-current.y)*blend}
  if(!target.x&&!target.y&&Math.hypot(next.x,next.y)<2)return{x:0,y:0}
  return next
}
export function approachFacing(current:number,target:number,dt:number) {
  const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current))
  const max=STUDIO_LOCOMOTION.turnRadiansPerSecond*dt
  return current+Math.max(-max,Math.min(max,delta))
}
