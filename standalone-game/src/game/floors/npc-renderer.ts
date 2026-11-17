import { PixelActor, CREATOR_FRAME, humanClips } from '../actor-rig/pixel-renderer'
import { floorNpcs, type FloorNpcId } from './npcs'

/** Uses the existing actor context; fixed pose keys keep its frame cache bounded. */
export class FloorNpcRenderer {
  private actors=new Map<string,{actor:PixelActor;sprite:HTMLCanvasElement;last:number}>()
  add(instance:string,npc:FloorNpcId){
    if(npc==='eko')return // EKO keeps the existing animated projection, never a human rig.
    if(this.actors.has(instance)||this.actors.size>=8)throw Error('This rehearsal supports at most eight NPCs.')
    const actor=new PixelActor(floorNpcs[npc].appearance(),CREATOR_FRAME.density),sprite=document.createElement('canvas')
    sprite.width=actor.bounds.width*CREATOR_FRAME.density;sprite.height=actor.bounds.height*CREATOR_FRAME.density
    this.actors.set(instance,{actor,sprite,last:-1})
  }
  has(instance:string){return this.actors.has(instance)}
  draw(c:CanvasRenderingContext2D,id:string,x:number,y:number,timeMs:number,reduced:boolean){
    const item=this.actors.get(id);if(!item)return
    const frames=humanClips.idle.frames??8,frame=reduced?0:Math.floor(timeMs/600)%frames
    if(item.last!==frame){item.sprite.getContext('2d')!.putImageData(item.actor.frame('idle','down',frame),0,0);item.last=frame}
    c.save();c.imageSmoothingEnabled=false;c.fillStyle='#121b2d66';c.beginPath();c.ellipse(x,y-1,7,3,0,0,Math.PI*2);c.fill()
    c.drawImage(item.sprite,Math.round(x-item.actor.bounds.anchor.x),Math.round(y-item.actor.bounds.anchor.y),item.actor.bounds.width,item.actor.bounds.height);c.restore()
  }
  dispose(){for(const item of this.actors.values()){item.actor.dispose();item.sprite.width=item.sprite.height=1}this.actors.clear()}
}
