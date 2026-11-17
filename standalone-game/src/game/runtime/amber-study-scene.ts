import Phaser from 'phaser'
import { PixelActor, humanClips } from '../actor-rig/pixel-renderer'
import type { StudyModels } from './model-study-definition'
import { rendererConfig } from '../renderer'

export type AmberStudyOptions={action:'idle'|'walk'|'run';direction:string;paused:boolean;zoom:number;speed:number}
const clipDuration=(action:AmberStudyOptions['action'])=>action==='idle'?2500:(humanClips[action].frames??12)/humanClips[action].fps*1000

/** One Phaser field, two models at the same native density, feet anchor and clock. */
export function mountAmberStudy(host:HTMLElement,read:()=>AmberStudyOptions,ready:()=>void,failed:(message:string)=>void,models:StudyModels){
  class Study extends Phaser.Scene{
    private actors:PixelActor[]=[]
    private sprites:Phaser.GameObjects.Image[]=[]
    private textures2d:Phaser.Textures.CanvasTexture[]=[]
    private shadows:Phaser.GameObjects.Ellipse[]=[]
    private ground?:Phaser.GameObjects.Graphics
    private elapsed=0
    private windElapsed=0
    private walkingWeight=0
    private signature=''
    constructor(){super(models.id+'Study')}
    create(){
      try{
        for(const factory of models.factories)this.actors.push(new PixelActor(models.appearance,2,factory))
        this.ground=this.add.graphics()
        for(let i=0;i<2;i++){
          const texture=this.textures.createCanvas('amber-study:'+i,128,160)!
          texture.setFilter(Phaser.Textures.FilterMode.NEAREST);this.textures2d.push(texture)
          this.shadows.push(this.add.ellipse(0,0,30,7,0x53432f,.18))
          this.sprites.push(this.add.image(0,0,texture.key).setOrigin(.5,.75))
        }
        this.scale.on('resize',()=>this.layout());this.layout()
        this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{for(const a of this.actors)a.dispose();this.actors=[]})
        ready()
      }catch(error){for(const a of this.actors)a.dispose();this.actors=[];failed(error instanceof Error?error.message:'The model study could not open.')}
    }
    private layout(){
      const w=this.scale.width,h=this.scale.height,zoom=read().zoom,baseline=Math.min(h-28,h*.82)
      this.ground?.clear().fillStyle(0xe4e1d2).fillRect(0,0,w,h).lineStyle(1,0xb9ad91,.25)
      for(let y=baseline%32;y<h;y+=32)this.ground?.lineBetween(0,Math.round(y),w,Math.round(y))
      this.ground?.lineStyle(1,0xa99c83,.5).lineBetween(w/2,0,w/2,h).lineBetween(0,Math.round(baseline),w,Math.round(baseline))
      for(let i=0;i<2;i++){
        this.sprites[i]?.setPosition(Math.round(w*(i?.75:.25)),Math.round(baseline)).setScale(zoom/2)
        this.shadows[i]?.setPosition(Math.round(w*(i?.75:.25)),Math.round(baseline)+2).setScale(zoom)
      }
    }
    update(_time:number,delta:number){
      if(!this.actors.length||document.hidden)return
      const o=read(),dt=Math.min(delta,50)*o.speed
      if(!o.paused){this.elapsed+=dt;this.walkingWeight+=((o.action==='run'?1.25:o.action==='walk'?1:0)-this.walkingWeight)*(1-Math.exp(-dt/180));this.windElapsed+=dt*(1+this.walkingWeight*.9)}
      // Same body phase on both sides; additional samples expose the cloth's smooth deformation.
      const duration=clipDuration(o.action),phase=Math.floor((this.elapsed%duration)/duration*64)/64
      const secondaryMotion=this.secondaryMotion()
      const signature=[phase,o.action,o.direction,o.zoom,secondaryMotion.phase,secondaryMotion.locomotion].join(':')
      if(signature===this.signature)return;this.signature=signature;this.layout()
      try{
        const clip=humanClips[o.action],index=Math.floor(phase*(clip.frames??8))
        for(let i=0;i<2;i++){
          this.textures2d[i].context.putImageData(this.actors[i].frame(o.action,o.direction,index,undefined,o.action==='run'?'run':'walk',phase,secondaryMotion),0,0)
          this.textures2d[i].refresh()
        }
      }catch(error){this.actors.forEach(a=>a.dispose());this.actors=[];failed(error instanceof Error?error.message:'The character renderer stopped.')}
    }
    private secondaryMotion(){return {phase:Math.floor((this.windElapsed%2400)/2400*64)/64,locomotion:Math.round(this.walkingWeight*8)/8}}
    capture(){
      const o=read(),clip=humanClips[o.action],duration=clipDuration(o.action),phase=Math.floor((this.elapsed%duration)/duration*64)/64
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=160
      const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false
      this.actors.forEach((a,i)=>c.putImageData(a.frame(o.action,o.direction,Math.floor(phase*(clip.frames??8)),undefined,o.action==='run'?'run':'walk',phase,this.secondaryMotion()),i*128,0))
      return canvas.toDataURL('image/png')
    }
  }
  const scene=new Study(),game=new Phaser.Game({...rendererConfig(),parent:host,backgroundColor:'#e4e1d2',audio:{noAudio:true},scale:{mode:Phaser.Scale.RESIZE,width:host.clientWidth||800,height:host.clientHeight||400},scene:[scene]})
  const resize=()=>{if(game.isBooted){game.scale.resize(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight));game.scale.refresh()}}
  const observer=new ResizeObserver(resize);observer.observe(host)
  // Dialog zoom-in transforms change measured bounds without a layout resize.
  const dialog=host.closest('[role="dialog"]')
  const settled=(event:Event)=>{if(event.target===dialog)resize()}
  dialog?.addEventListener('animationend',settled)
  game.events.once(Phaser.Core.Events.READY,resize)
  const lost=(e:Event)=>{e.preventDefault();failed('The graphics connection was interrupted. Reopen the comparison to continue.')};game.canvas?.addEventListener('webglcontextlost',lost)
  return {capture:()=>scene.capture(),dispose(){observer.disconnect();dialog?.removeEventListener('animationend',settled);game.canvas?.removeEventListener('webglcontextlost',lost);game.destroy(true)}}
}
