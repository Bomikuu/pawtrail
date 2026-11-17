import Phaser from 'phaser'
import { PixelActor, CREATOR_FRAME, humanClips } from '../actor-rig/pixel-renderer'
import type { SavedCharacter } from '../actor-rig/appearance'
import {canonicalActorAction,usesWalkingLegs} from '../actor-rig/action-layers'
import {ActionPlayback} from '../actor-rig/action-playback'
import {HUMAN_GAIT} from '../actor-rig/human-gait'
import type { Rig } from '../actor-rig/rigs'
import {approachFacing} from '../systems/studio-locomotion'
import type { BakedDirection } from './baked-actors'
const directions=['down','down_left','left','up_left','up','up_right','right','down_right']
/** Same human gait, transition blending and native finish as studio actors. */
export class LiveCharacter {
  private actor:PixelActor
  private appearance:SavedCharacter['appearance']
  private signature=''
  private action=''
  private elapsed=0
  private strideElapsed=0
  private previous=0
  private headScale=1
  private playback=new ActionPlayback()
  private renderAction=''
  private renderPhase=0
  private fromAction=''
  private fromPhase=0
  private transitionAt=0
  private yaw:number|undefined
  constructor(private texture:Phaser.Textures.CanvasTexture,row:Pick<SavedCharacter,'appearance'>&{headScale?:number},factory?: (appearance:SavedCharacter['appearance'])=>Rig){
    this.actor=new PixelActor(row.appearance,CREATOR_FRAME.density,factory);this.appearance=row.appearance
    texture.setSize(CREATOR_FRAME.width,CREATOR_FRAME.height);texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
  }
  update(row:Pick<SavedCharacter,'appearance'>&{headScale?:number},requested:string,moving:boolean,direction:BakedDirection,time:number,timeScale:number,reduced:boolean,distance=0){
    if(row.appearance!==this.appearance){this.actor.setAppearance(row.appearance);this.appearance=row.appearance;this.signature=''}
    const head=row.headScale??1
    if(head!==this.headScale){this.actor.setHeadScale(head);this.headScale=head;this.signature=''}
    let action=canonicalActorAction(requested)
    const requestedRun=action==='run'
    if(/^(idle|walk|run|standing|watch)(_|$)/.test(action))action=moving?(requestedRun?'run':'walk'):'idle'
    if(!humanClips[action])action=moving?'walk':'idle'
    const presentation=this.playback.resolve(action,time);action=presentation.action
    if(action!==this.action){this.action=action;this.elapsed=0}
    const dt=this.previous?Math.max(0,Math.min(time-this.previous,80)):0
    this.previous=time
    const scaledDelta=dt*Math.max(0,Number.isFinite(timeScale)?timeScale:1)
    this.elapsed+=scaledDelta
    const speed=dt>0?distance/(dt/1000):0,gait:'walk'|'run'=requestedRun||moving&&speed>165?'run':'walk'
    if(moving)this.strideElapsed+=distance>0?distance/(gait==='run'?HUMAN_GAIT.runCycleDistance:HUMAN_GAIT.walkCycleDistance)*1000:scaledDelta*humanClips[gait].fps/(humanClips[gait].frames??12)
    if(action==='power_up'&&moving&&gait==='run')action='power_run'
    const clip=humanClips[action],count=clip.frames??8
    const playbackTime=presentation.elapsedMs??(['walk','run'].includes(action)?this.strideElapsed*count/clip.fps:this.elapsed)
    const freeze=reduced&&!['jetpack_takeoff','jetpack_land'].includes(action)
    const phase=freeze?0:clip.repeat===0?Math.min(playbackTime/1000*clip.fps/Math.max(1,count-1),1):(playbackTime/1000*clip.fps/count)%1
    const frame=clip.repeat===0?Math.min(count-1,Math.floor(phase*(count-1))):Math.floor(phase*count)%count
    const walkFrame=moving&&usesWalkingLegs(action)?reduced?0:(this.strideElapsed/1000%1)*(humanClips[gait].frames??12):undefined
    const yaw=-Math.max(0,directions.indexOf(direction))*Math.PI/4
    this.yaw=this.yaw===undefined||reduced?yaw:approachFacing(this.yaw,yaw,dt/1000)
    if(action!==this.renderAction){this.fromAction=this.renderAction;this.fromPhase=this.renderPhase;this.renderAction=action;this.transitionAt=time}
    const transition=reduced?1:Math.min(1,(time-this.transitionAt)/HUMAN_GAIT.blendMs)
    if(transition>=1)this.fromAction=''
    const options={yaw:Math.round(this.yaw/(Math.PI/36))*Math.PI/36,fromAction:this.fromAction||undefined,fromPhase:Math.round(this.fromPhase*64)/64,transition:Math.round(transition*16)/16}
    const sampledPhase=Math.floor(phase*64)/64,locomotion=walkFrame===undefined?undefined:Math.floor(walkFrame*64)/64
    const secondary={phase:reduced?0:Math.floor((time%2400)/2400*64)/64,locomotion:moving?(gait==='run'?1.25:1):0}
    const signature=[action,direction,frame,locomotion,gait,sampledPhase,secondary.phase,JSON.stringify(options)].join(':')
    if(signature!==this.signature){this.texture.context.putImageData(this.actor.frame(action,direction,frame,locomotion,gait,sampledPhase,secondary,options),0,0);this.texture.refresh();this.signature=signature}
    this.renderPhase=phase
    return action
  }
  dispose(){this.actor.dispose()}
}
