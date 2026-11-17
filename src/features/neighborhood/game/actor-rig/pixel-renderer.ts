import * as T from 'three'
import { createRescuer, disposeRig, appearancePalette, actions, type Rig, type SecondaryMotion } from './rigs'
import { fittedAppearance, appearanceSignature, type ActorAppearance } from './appearance'

export { CREATOR_FRAME } from './pixel-stage'
import { createActorCamera, configureActorRenderer } from './pixel-stage'
const directions = ['down','down_left','left','up_left','up','up_right','right','down_right']
export type ActorFramePlayback={yaw?:number;fromAction?:string;fromPhase?:number;transition?:number}
type Clip = {fps:number; repeat:number; frames?:number}
export const humanClips = actions.rescuer as Record<string,Clip>
let stage: {renderer:T.WebGLRenderer; camera:T.OrthographicCamera; context:CanvasRenderingContext2D; references:number} | undefined
let releaseTimer:ReturnType<typeof setTimeout>|undefined
function acquireStage() {
  clearTimeout(releaseTimer)
  if(stage?.renderer.getContext().isContextLost())stage=undefined
  if (!stage) {
    const renderer = new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true,premultipliedAlpha:false,powerPreference:'low-power'})
    configureActorRenderer(renderer); renderer.setSize(64,80,false)
    const camera=createActorCamera()
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=80
    const context=canvas.getContext('2d',{willReadFrequently:true})
    if(!context){renderer.dispose();throw new Error('Pixel rendering is unavailable in this browser.')}
    stage={renderer,camera,context,references:0}
  }
  stage.references++
  return stage
}
function srgb(v:number){return Math.max(0,Math.min(255,Math.round((v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055)*255)))}
function linear(v:number){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
/** Matches scripts/pixel_actor_art.py: same palette, one-pixel contour and light edge. */
export class PixelFinish {
  private colors:number[][]=[]
  private cache=new Map<number,number[]>()
  constructor(palette:string[]){
    const unique=new Map<string,number[]>()
    for(const hex of palette)for(const shade of [.68,.84,1,1.08]){
      const c=[1,3,5].map(i=>srgb(linear(parseInt(hex.slice(i,i+2),16))*shade));unique.set(c.join(','),c)
    }
    for(const c of [[42,28,23],[58,38,29]])unique.set(c.join(','),c)
    this.colors=[...unique.values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2])
  }
  finish(source:ImageData,contour=1,preserveAlpha=false){
    const {width:w,height:h,data:s}=source,out=new ImageData(w,h),d=out.data
    const radius=Math.max(1,Math.min(2,Math.round(contour)))
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4
      if(s[i+3]>=(preserveAlpha?32:128)){
        const key=s[i]*65536+s[i+1]*256+s[i+2]
        let c=this.cache.get(key)
        if(!c){let best=Infinity;c=this.colors[0];for(const candidate of this.colors){const distance=(candidate[0]-s[i])**2+(candidate[1]-s[i+1])**2+(candidate[2]-s[i+2])**2;if(distance<best){best=distance;c=candidate}}
          this.cache.set(key,c)}
        d.set([...c,preserveAlpha?s[i+3]:255],i)
      }else{
        let adjacent=false
        for(let ny=Math.max(0,y-radius);ny<=Math.min(h-1,y+radius)&&!adjacent;ny++)for(let nx=Math.max(0,x-radius);nx<=Math.min(w-1,x+radius);nx++)if(s[(ny*w+nx)*4+3]>=128){adjacent=true;break}
        if(adjacent){const lit=(x+1<w&&s[i+7]>=128)||(y+1<h&&s[i+w*4+3]>=128);d.set(lit?[58,38,29,255]:[42,28,23,255],i)}
      }
    }
    return out
  }
}
/** One shared GPU context. Rebuilds geometry only for actual appearance edits. */
export class PixelActor {
  private shared=acquireStage()
  private scene=new T.Scene()
  private rig!:Rig
  private finish!:PixelFinish
  private signature=''
  private frames=new Map<string,ImageData>()
  private socketFrames=new Map<string,Record<string,{x:number;y:number}>>()
  private lastSockets:Record<string,{x:number;y:number}>={}
  private disposed=false
  private headScale=1
  private padding=0
  constructor(appearance:ActorAppearance,private density:1|2=1,private factory:(appearance:ActorAppearance)=>Rig=createRescuer,private options:{padding?:number;palette?:string[];measureActions?:string[];preserveAlpha?:boolean}={}){try{this.setAppearance(appearance)}catch(error){this.dispose();throw error}}
  setAppearance(appearance:ActorAppearance){
    const signature=appearanceSignature(appearance)
    if(signature===this.signature)return
    const next=this.factory(fittedAppearance(appearance))
    if(this.rig)disposeRig(this.rig)
    this.rig=next;this.scene.add(next.root);this.signature=signature
    this.finish=new PixelFinish([...appearancePalette(appearance),...(this.options.palette??[])]);this.frames.clear();this.socketFrames.clear();this.lastSockets={}
    this.padding=this.options.padding??0
    if(this.options.measureActions?.length){
      const camera=createActorCamera(),box=new T.Box3(),local=new T.Box3(),point=new T.Vector3();camera.updateMatrixWorld(true)
      for(const action of this.options.measureActions)for(const phase of [0,.2,.4,.6,.8,1])for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
        next.pose(action,phase);next.root.rotation.y=angle;next.root.updateMatrixWorld(true);box.makeEmpty()
        next.root.traverse(node=>{if(!(node instanceof T.Mesh))return;for(let parent:T.Object3D|null=node;parent;parent=parent.parent)if(!parent.visible||/Archive/.test(parent.name))return;node.geometry.computeBoundingBox();if(node.geometry.boundingBox)box.union(local.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld))})
        if(box.isEmpty())continue
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){point.set(x,y,z).project(camera);this.padding=Math.max(this.padding,Math.ceil(Math.abs(point.x)*32-32+2),Math.ceil(Math.abs(point.y)*40-40+2))}
      }
      next.pose('idle',0);next.root.rotation.y=0
    }
  }
  setHeadScale(value=1){
    const next=Number.isFinite(value)?Math.max(.8,Math.min(1.25,value)):1
    if(next!==this.headScale){this.headScale=next;this.frames.clear();this.socketFrames.clear();this.lastSockets={}}
  }
  frame(action:string,direction:string,index:number,locomotionFrame?:number,gait:'walk'|'run'='walk',previewPhase?:number,secondaryMotion?:SecondaryMotion,playback?:ActorFramePlayback){
    const clip=humanClips[action]??humanClips.idle,count=clip.frames??8
    index=Math.max(0,Math.min(count-1,Math.floor(index)))
    const key=action+':'+direction+':'+index+':'+(locomotionFrame??'-')+':'+gait+':'+(previewPhase??'-')+':'+(secondaryMotion?secondaryMotion.phase+':'+secondaryMotion.locomotion:'-')+':'+(playback?JSON.stringify(playback):'-'),cached=this.frames.get(key)
    if(cached){this.lastSockets=this.socketFrames.get(key)??{};return cached}
    const layers={locomotionPhase:locomotionFrame===undefined?undefined:locomotionFrame/(humanClips[gait].frames??8),gait,secondaryMotion}
    const blend=playback?.transition??1
    let previous:{position:T.Vector3;rotation:T.Quaternion;scale:T.Vector3}[]|undefined
    if(playback?.fromAction&&blend<1){
      this.rig.pose(playback.fromAction,playback.fromPhase??0,{...layers,gait:playback.fromAction==='run'?'run':'walk'})
      previous=this.rig.nodes.map(node=>({position:node.position.clone(),rotation:node.quaternion.clone(),scale:node.scale.clone()}))
    }
    this.rig.pose(action,previewPhase??index/(clip.repeat===0?count-1:count),layers)
    if(previous){
      const weight=blend*blend*(3-2*blend)
      this.rig.nodes.forEach((node,i)=>{const from=previous![i];node.position.lerpVectors(from.position,node.position,weight);node.quaternion.slerpQuaternions(from.rotation,node.quaternion.clone(),weight);node.scale.lerpVectors(from.scale,node.scale,weight)})
    }
    if(this.headScale!==1)this.rig.root.getObjectByName('Head')?.scale.multiplyScalar(this.headScale)
    this.rig.root.rotation.y=playback?.yaw??-Math.max(0,directions.indexOf(direction))*Math.PI/4
    const {renderer,camera,context}=this.shared
    if(renderer.getContext().isContextLost())throw new Error('The character renderer was interrupted. Retry the preview.')
    const pad=this.padding,width=(64+2*pad)*this.density,height=(80+2*pad)*this.density
    camera.left=-32-pad;camera.right=32+pad;camera.top=40+pad;camera.bottom=-40-pad;camera.updateProjectionMatrix()
    if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false)
    if(context.canvas.width!==width||context.canvas.height!==height){context.canvas.width=width;context.canvas.height=height}
    renderer.render(this.scene,camera)
    const sockets:Record<string,{x:number;y:number}>={}
    for(const[name,node]of Object.entries(this.rig.itemSockets??{})){const p=node.getWorldPosition(new T.Vector3()).project(camera);sockets[name]={x:(p.x+1)/2*this.bounds.width-this.bounds.anchor.x,y:(1-p.y)/2*this.bounds.height-this.bounds.anchor.y}}
    this.lastSockets=sockets
    this.socketFrames.set(key,sockets)
    context.clearRect(0,0,width,height);context.drawImage(renderer.domElement,0,0)
    const result=this.finish.finish(context.getImageData(0,0,width,height),this.density,this.options.preserveAlpha)
    while(this.frames.size&&((this.frames.size+1)*width*height*4>8_000_000||this.frames.size>=96)){const oldest=this.frames.keys().next().value!;this.frames.delete(oldest);this.socketFrames.delete(oldest)}
    this.frames.set(key,result);return result
  }
  projectedSocket(name:string){return this.lastSockets[name]}
  get bounds(){const pad=this.padding;return{width:64+pad*2,height:80+pad*2,anchor:{x:32+pad,y:60+pad}}}
  portrait(){
    const canvas=document.createElement('canvas');canvas.width=this.bounds.width*this.density;canvas.height=this.bounds.height*this.density
    canvas.getContext('2d')!.putImageData(this.frame('idle','down',0),0,0)
    return canvas.toDataURL('image/png')
  }
  dispose(){
    if(this.disposed)return;this.disposed=true
    if(this.rig)disposeRig(this.rig)
    this.frames.clear();this.socketFrames.clear();this.lastSockets={}
    if(--this.shared.references===0){const shared=this.shared;releaseTimer=setTimeout(()=>{if(shared.references===0){shared.renderer.dispose();shared.renderer.forceContextLoss();if(stage===shared)stage=undefined}},1500)}
  }
}
