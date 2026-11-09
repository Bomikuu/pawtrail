import Phaser from 'phaser'
import { PixelActor, CREATOR_FRAME, humanClips } from '../actor-rig/pixel-renderer'
import type { SavedCharacter } from '../actor-rig/appearance'
import {canonicalActorAction,usesWalkingLegs} from '../actor-rig/action-layers'
import {ActionPlayback} from '../actor-rig/action-playback'
import type { BakedDirection } from './baked-actors'


/** The personal appearance uses the same native rig, sampling and finish as the creator. */
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
  constructor(private texture:Phaser.Textures.CanvasTexture,row:Pick<SavedCharacter,'appearance'>&{headScale?:number}){
    this.actor=new PixelActor(row.appearance,CREATOR_FRAME.density);this.appearance=row.appearance
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
    this.previous=time;const scaledDelta=dt*Math.max(0,Number.isFinite(timeScale)?timeScale:1)
    this.elapsed+=scaledDelta;
    const speed=dt>0?distance/(dt/1000):0,gait:'walk'|'run'=requestedRun||moving&&speed>130?'run':'walk'
    if(moving)this.strideElapsed+=distance>0?distance/(gait==='run'?104:84)*1000:scaledDelta*humanClips[gait].fps/(humanClips[gait].frames??12)
    if(action==='power_up'&&moving&&gait==='run')action='power_run'
    const playbackTime=presentation.elapsedMs??(['walk','run'].includes(action)?this.strideElapsed*(humanClips[action].frames??12)/humanClips[action].fps:this.elapsed)
    const clip=humanClips[action],count=clip.frames??8,frame=reduced&&action!=='jetpack_takeoff'&&action!=='jetpack_land'?0:clip.repeat===0?Math.min(count-1,Math.floor(playbackTime/1000*clip.fps)):Math.floor(playbackTime/1000*clip.fps)%count
    const walkFrame=moving&&usesWalkingLegs(action)?reduced?0:Math.floor(this.strideElapsed/1000*(humanClips[gait].frames??12))%(humanClips[gait].frames??12):undefined
    const signature=action+':'+direction+':'+frame+':'+(walkFrame??'-')+':'+gait
    if(signature!==this.signature){this.texture.context.putImageData(this.actor.frame(action,direction,frame,walkFrame,gait),0,0);this.texture.refresh();this.signature=signature}
    return action
  }
  dispose(){this.actor.dispose()}
}
