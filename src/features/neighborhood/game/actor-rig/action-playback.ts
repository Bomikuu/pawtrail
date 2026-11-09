import clips from './actions.json'

export const JETPACK_TAKEOFF_MS=clips.rescuer.jetpack_takeoff.frames/clips.rescuer.jetpack_takeoff.fps*1000
export const JETPACK_LAND_MS=clips.rescuer.jetpack_land.frames/clips.rescuer.jetpack_land.fps*1000
export const isJetpackAction=(action:string)=>action==='jetpack'||action==='jetpack_takeoff'||action==='jetpack_land'
const smooth=(value:number)=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)}
export function jetpackEnvelope(action:string,elapsed:number){
  if(action==='jetpack_takeoff'){const lift=smooth(elapsed/JETPACK_TAKEOFF_MS);return {lift,thrust:.35+lift*.65}}
  if(action==='jetpack_land'){const lift=1-smooth(elapsed/JETPACK_LAND_MS);return {lift,thrust:lift*.8}}
  return {lift:1,thrust:1}
}
export type ActionPresentation={action:string;elapsedMs?:number}
/** Resolve cosmetic flight independently from movement and selected-action lifetime. */
export class ActionPlayback {
  private stage:'grounded'|'takeoff'|'hover'|'landing'='grounded'
  private since=0
  private last=0
  private requested=''
  reset(){this.stage='grounded';this.since=0;this.last=0;this.requested=''}
  resolve(requested:string,time:number):ActionPresentation{
    if(time<this.last)this.reset()
    this.last=time
    const changed=requested!==this.requested;this.requested=requested
    if(requested==='jetpack_land'&&this.stage==='grounded'&&changed){this.stage='landing';this.since=time}
    const engage=requested==='jetpack'||requested==='jetpack_takeoff'
    if(engage&&this.stage==='grounded'){this.stage='takeoff';this.since=time}
    if(!engage&&(this.stage==='takeoff'||this.stage==='hover')){this.stage='landing';this.since=time}
    if(this.stage==='takeoff'&&time-this.since>=JETPACK_TAKEOFF_MS){this.stage='hover';this.since+=JETPACK_TAKEOFF_MS}
    if(this.stage==='landing'&&time-this.since>=JETPACK_LAND_MS){this.stage='grounded';this.since=time;if(engage){this.stage='takeoff'}}
    if(this.stage==='takeoff')return {action:'jetpack_takeoff',elapsedMs:Math.max(0,time-this.since)}
    if(this.stage==='hover')return {action:'jetpack',elapsedMs:Math.max(0,time-this.since)}
    if(this.stage==='landing')return {action:'jetpack_land',elapsedMs:Math.max(0,time-this.since)}
    return {action:requested==='jetpack_land'?'idle':requested}
  }
}
