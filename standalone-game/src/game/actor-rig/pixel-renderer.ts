import * as T from 'three'
import { createRescuer, disposeRig, appearancePalette, actions, type Rig } from './rigs'
import { fittedAppearance, appearanceSignature, type ActorAppearance } from './appearance'

export const CREATOR_FRAME = {width:128, height:160, density:2 as const, worldWidth:64, worldHeight:80, anchor:{x:.5,y:.75}}
const directions = ['down','down_left','left','up_left','up','up_right','right','down_right']
type Clip = {fps:number; repeat:number; frames?:number}
export const humanClips = actions.rescuer as Record<string,Clip>
let stage: {renderer:T.WebGLRenderer; camera:T.OrthographicCamera; context:CanvasRenderingContext2D; references:number} | undefined
let releaseTimer:ReturnType<typeof setTimeout>|undefined
function acquireStage() {
  clearTimeout(releaseTimer)
  if(stage?.renderer.getContext().isContextLost())stage=undefined
  if (!stage) {
    const renderer = new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true,premultipliedAlpha:false,powerPreference:'low-power'})
    renderer.setPixelRatio(1); renderer.setSize(64,80,false); renderer.setClearColor(0x000000,0)
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping
    const camera=new T.OrthographicCamera(-32,32,40,-40,.1,200)
    camera.position.set(0,56,90);camera.lookAt(0,21.5,0)
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
  finish(source:ImageData,contour=1){
    const {width:w,height:h,data:s}=source,out=new ImageData(w,h),d=out.data
    const radius=Math.max(1,Math.min(2,Math.round(contour)))
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4
      if(s[i+3]>=128){
        const key=s[i]*65536+s[i+1]*256+s[i+2]
        let c=this.cache.get(key)
        if(!c){let best=Infinity;c=this.colors[0];for(const candidate of this.colors){const distance=(candidate[0]-s[i])**2+(candidate[1]-s[i+1])**2+(candidate[2]-s[i+2])**2;if(distance<best){best=distance;c=candidate}}
          this.cache.set(key,c)}
        d.set([...c,255],i)
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
  private disposed=false
  private headScale=1
  constructor(appearance:ActorAppearance,private density:1|2=1){try{this.setAppearance(appearance)}catch(error){this.dispose();throw error}}
  setAppearance(appearance:ActorAppearance){
    const signature=appearanceSignature(appearance)
    if(signature===this.signature)return
    const next=createRescuer(fittedAppearance(appearance))
    if(this.rig)disposeRig(this.rig)
    this.rig=next;this.scene.add(next.root);this.signature=signature
    this.finish=new PixelFinish(appearancePalette(appearance));this.frames.clear()
  }
  setHeadScale(value=1){
    const next=Number.isFinite(value)?Math.max(.8,Math.min(1.25,value)):1
    if(next!==this.headScale){this.headScale=next;this.frames.clear()}
  }
  frame(action:string,direction:string,index:number,locomotionFrame?:number,gait:'walk'|'run'='walk'){
    const clip=humanClips[action]??humanClips.idle,count=clip.frames??8
    index=Math.max(0,Math.min(count-1,Math.floor(index)))
    const key=action+':'+direction+':'+index+':'+(locomotionFrame??'-')+':'+gait,cached=this.frames.get(key)
    if(cached)return cached
    this.rig.pose(action,index/(clip.repeat===0?count-1:count),{locomotionPhase:locomotionFrame===undefined?undefined:locomotionFrame/(humanClips[gait].frames??8),gait})
    if(this.headScale!==1)this.rig.root.getObjectByName('Head')?.scale.multiplyScalar(this.headScale)
    this.rig.root.rotation.y=-Math.max(0,directions.indexOf(direction))*Math.PI/4
    const {renderer,camera,context}=this.shared
    if(renderer.getContext().isContextLost())throw new Error('The character renderer was interrupted. Retry the preview.')
    const width=64*this.density,height=80*this.density
    if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false)
    if(context.canvas.width!==width||context.canvas.height!==height){context.canvas.width=width;context.canvas.height=height}
    renderer.render(this.scene,camera)
    context.clearRect(0,0,width,height);context.drawImage(renderer.domElement,0,0)
    const result=this.finish.finish(context.getImageData(0,0,width,height),this.density)
    if(this.frames.size>=96)this.frames.delete(this.frames.keys().next().value!)
    this.frames.set(key,result);return result
  }
  portrait(){
    const canvas=document.createElement('canvas');canvas.width=64*this.density;canvas.height=80*this.density
    canvas.getContext('2d')!.putImageData(this.frame('idle','down',0),0,0)
    return canvas.toDataURL('image/png')
  }
  dispose(){
    if(this.disposed)return;this.disposed=true
    if(this.rig)disposeRig(this.rig)
    this.frames.clear()
    if(--this.shared.references===0){const shared=this.shared;releaseTimer=setTimeout(()=>{if(shared.references===0){shared.renderer.dispose();shared.renderer.forceContextLoss();if(stage===shared)stage=undefined}},1500)}
  }
}
