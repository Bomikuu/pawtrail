import { StagePlaytest } from '../stage-editor/playtest'
import { stageImage, assetView, depthOf, type StageDocument } from '../stage-editor/data'
import { characterCreator } from '../creator/state'
import { furniture } from '../housing/geometry'
import type { Point, ObjectState } from '../housing/types'
import { SofaPalette } from './sofa-palette'

export const SPRITE_TRIAL_LABELS={sofa:'Couch','wooden-door':'Wooden door','sofa-sage':'Sofa Sage','sofa-terracotta':'Sofa Terracotta','sofa-cream':'Sofa Cream','three-seat-sofa':'Three Seat Sofa'} as const
export type SpriteTrialAsset=keyof typeof SPRITE_TRIAL_LABELS
const itemId='sprite-furniture-trial'
const floorFile='/assets/game/housing/tilesets/wood-dark-a-housing-v1.png'
type ActorReport=ReturnType<StagePlaytest['report']>
export type SpriteCouchState={assetId:SpriteTrialAsset;sourceFile:string;frame:[number,number];upholsteryColor?:string;rotation:number;primary:ActorReport;companion:ActorReport;third?:ActorReport;seats:{id:string;occupant:'you'|'companion'|'companion-2'|null}[];door?:{open:boolean;busy:boolean;occupied:boolean}}

/** Shared local sprite trial: existing actors/controllers, native art and contacts. */
export class SpriteCouchTrial {
  private raf=0
  private previous=0
  private lastPaint=0
  private keys=new Set<string>()
  private touch:Point={x:0,y:0}
  private geometry=false
  private disposed=false
  private signature=''
  private events=new AbortController()
  private palette?:SofaPalette
  private get item(){return this.stage.objects[0]}
  private get definition(){return furniture[this.assetId]}
  private get actors(){return [this.primary,this.companion,...(this.third?[this.third]:[])]}
  private constructor(private canvas:HTMLCanvasElement,readonly assetId:SpriteTrialAsset,private stage:StageDocument,private primary:StagePlaytest,private companion:StagePlaytest,private third:StagePlaytest|undefined,private claims:Map<string,string>,private objectStates:Record<string,ObjectState>,private images:Map<string,HTMLImageElement>,private changed:(state:SpriteCouchState)=>void,private failed:(reason:unknown)=>void){
    canvas.width=canvas.height=256
    if(assetId==='sofa')this.palette=new SofaPalette(images)
    const signal=this.events.signal
    canvas.addEventListener('pointerdown',()=>canvas.focus({preventScroll:true}),{signal})
    canvas.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase()
      if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','r'].includes(key))return
      event.preventDefault();this.keys.add(key)
      if(key==='e'&&!event.repeat){this.primary.interact();this.publish()}
      if(key==='r'&&!event.repeat)this.rotate()
    },{signal})
    canvas.addEventListener('keyup',event=>this.keys.delete(event.key.toLowerCase()),{signal})
    canvas.addEventListener('blur',()=>this.clearInput(),{signal})
    document.addEventListener('visibilitychange',()=>{this.clearInput();this.previous=0},{signal})
    this.publish();this.raf=requestAnimationFrame(this.tick)
  }
  static async create(canvas:HTMLCanvasElement,changed:(state:SpriteCouchState)=>void,failed:(reason:unknown)=>void,assetId:SpriteTrialAsset='sofa'){
    const stage:StageDocument={format:'pawtrail-stage',version:1,name:'Sprite furniture trial',width:8,height:8,baseTile:'tile:wood-dark-a',tiles:{},shell:false,wallpaper:'cream',objects:[{id:itemId,asset:'f:'+assetId,x:128,y:128,elevation:0,layer:'world',bias:0,rotation:0}]}
    if(assetId==='wooden-door')for(const x of [16,48,80,96,168,200,232,240])stage.objects.push({id:'partition-'+x,asset:'wall:wood:north',x,y:128,elevation:0,layer:'world',bias:0,rotation:0})
    const files=new Set([floorFile]),def=furniture[assetId]
    for(const object of stage.objects){const view=assetView(object);files.add(view.file);if(view.frontFile)files.add(view.frontFile)}
    for(const style of def.styles??[])for(const view of Object.values(style.views)){files.add(view.file);files.add(view.frontFile)}
    if(def.stateViews?.open)files.add(def.stateViews.open.file)
    const images=new Map(await Promise.all([...files].map(async file=>[file,await stageImage(file)] as const)))
    const pick=characterCreator.getSnapshot(),claims=new Map<string,string>(),objectStates:Record<string,ObjectState>={},actors:StagePlaytest[]=[]
    const options={claims,objectStates,occupants:()=>actors.map(actor=>actor.position)}
    const primary=await StagePlaytest.createForCreator(stage,pick,{x:assetId==='wooden-door'?128:118,y:200},{...options,actorId:'you',name:'You'});actors.push(primary)
    try{
      const companion=await StagePlaytest.createForCreator(stage,pick,{x:183,y:200},{...options,actorId:'companion',name:'Companion'});actors.push(companion)
      try{
        const third=def.geometry.seats.length>2?await StagePlaytest.createForCreator(stage,pick,{x:198,y:200},{...options,actorId:'companion-2',name:'Companion 2'}):undefined
        if(third)actors.push(third)
        try{return new SpriteCouchTrial(canvas,assetId,stage,primary,companion,third,claims,objectStates,images,changed,failed)}catch(error){third?.dispose();throw error}
      }catch(error){companion.dispose();throw error}
    }catch(error){primary.dispose();throw error}
  }
  private clearInput(){this.keys.clear();this.touch={x:0,y:0}}
  private focus(){this.canvas.focus({preventScroll:true})}
  sit(seatId:string){this.clearInput();this.primary.sitOn(itemId,seatId);this.publish();this.focus()}
  both(){this.clearInput();this.actors.forEach(actor=>actor.stand());this.definition.geometry.seats.forEach((seat,index)=>this.actors[index]?.sitOn(itemId,seat.id));this.publish();this.focus()}
  stand(){this.clearInput();this.primary.stand();this.publish();this.focus()}
  toggleDoor(){this.clearInput();this.primary.useObject(itemId);this.publish();this.focus()}
  doorwayCompanion(){
    if(!this.objectStates[itemId]?.open)return
    this.companion.stand();Object.assign(this.companion.position,this.companion.position.x===128?{x:183,y:200}:{x:128,y:120});this.publish();this.paint();this.focus()
  }
  reset(){
    this.clearInput();this.actors.forEach(actor=>actor.stand())
    delete this.objectStates[itemId]
    Object.assign(this.primary.position,{x:this.assetId==='wooden-door'?128:118,y:200});Object.assign(this.companion.position,{x:183,y:200});if(this.third)Object.assign(this.third.position,{x:198,y:200})
    this.actors.forEach(actor=>actor.refreshFurnitureContacts());this.publish();this.focus()
  }
  setGeometry(value:boolean){this.geometry=value;this.paint()}
  input(x:number,y:number){this.touch={x,y}}
  setUpholsteryColor(color:string){this.palette?.setColor(color);this.paint();this.publish()}
  private image(file:string){return this.palette?.image(file)??this.images.get(file)!}
  rotate(){
    const rotations=this.definition.supportedRotations??[0]
    if(rotations.length<2)return
    this.clearInput();this.item.rotation=rotations[(rotations.indexOf(this.item.rotation)+1)%rotations.length]
    this.actors.forEach(actor=>actor.refreshFurnitureContacts());this.paint();this.publish();this.focus()
  }
  private publish(){
    const primary=this.primary.report(),companion=this.companion.report(),view=assetView(this.item)
    const state:SpriteCouchState={assetId:this.assetId,sourceFile:this.definition.file,frame:[this.definition.width,this.definition.height],...(this.palette?{upholsteryColor:this.palette.color}:{}),...(this.third?{third:this.third.report()}:{}),rotation:this.item.rotation,primary,companion,seats:view.geometry.seats.map(seat=>({id:seat.id,occupant:(this.claims.get(itemId+'/'+seat.id) as 'you'|'companion'|'companion-2'|undefined)??null})),...(this.assetId==='wooden-door'?{door:{open:!!this.objectStates[itemId]?.open,busy:primary.phase!=='idle',occupied:companion.x===128&&companion.y===120}}:{})}
    const signature=JSON.stringify(state)
    if(signature!==this.signature){this.signature=signature;this.changed(state)}
  }
  private tick=(now:number)=>{
    if(this.disposed)return
    const delta=this.previous?Math.min(40,now-this.previous):0;this.previous=now
    if(!document.hidden){
      const x=this.touch.x+Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'))
      const y=this.touch.y+Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'))
      this.primary.tick(delta,{x,y},this.keys.has('shift'));this.companion.tick(delta,{x:0,y:0},false);this.third?.tick(delta,{x:0,y:0},false)
      if(now-this.lastPaint>=80){this.lastPaint=now;try{this.paint();this.publish()}catch(error){this.dispose();this.failed(error);return}}
    }
    this.raf=requestAnimationFrame(this.tick)
  }
  private paint(){
    const context=this.canvas.getContext('2d')!
    context.imageSmoothingEnabled=false;context.clearRect(0,0,256,256)
    for(let y=0;y<256;y+=32)for(let x=0;x<256;x+=32)context.drawImage(this.images.get(floorFile)!,x,y,32,32)
    const layers:{depth:number;draw:()=>void}[]=[]
    for(const object of this.stage.objects){
      const view=assetView(object),file=this.objectStates[object.id]?.open&&view.stateViews?.open?view.stateViews.open.file:view.file
      layers.push({depth:depthOf(object),draw:()=>context.drawImage(this.image(file),object.x-view.anchor[0],object.y-view.anchor[1])})
      if(view.frontFile&&this.actors.some(actor=>actor.foregroundTarget===object.id))layers.push({depth:depthOf(object)+1,draw:()=>context.drawImage(this.image(view.frontFile!),object.x-view.anchor[0],object.y-view.anchor[1])})
    }
    for(const actor of this.actors)layers.push({depth:actor.renderDepth,draw:()=>actor.draw(context)})
    layers.sort((a,b)=>a.depth-b.depth).forEach(layer=>layer.draw())
    if(this.geometry){
      this.primary.drawDiagnostics(context,1);context.fillStyle='#216b68';context.font='8px sans-serif'
      const view=assetView(this.item)
      for(const [i,seat] of view.geometry.seats.entries()){
        const x=this.item.x-view.anchor[0]+seat.point[0],y=this.item.y-view.anchor[1]+seat.point[1]-seat.elevation-5
        context.fillRect(x-1,y-1,3,3);context.fillText(String(i+1),x+3,y-2)
      }
    }
  }
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.events.abort();this.clearInput();this.actors.forEach(actor=>actor.dispose());this.palette?.dispose()}
}
