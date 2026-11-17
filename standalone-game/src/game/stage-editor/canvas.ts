import type {ItemDocument,ActionKey} from '../items/document'
import { assetsById, assetView, cloneStage, depthOf, footprint, groundPaintings, newId, paintAsset, stageImage, TILE, type StageDocument, type StageObject } from './data'
import type { StagePlaytest, PlayCharacter, PlayInteractionPrompt, PlaytestOptions } from './playtest'
import type { ObjectState } from '../housing/types'
import { roomShellRects } from '../housing/room-shell'
import { SceneryMotionRenderer } from '../floors/scenery-motion'
import type { FloorPropRenderer } from '../floors/prop-renderer'
import type { FloorNpcRenderer } from '../floors/npc-renderer'
import type { FixtureHandle,FloorWorldControls } from '../floors/view'
import type { FloorNpcId } from '../floors/npcs'
export type StageTool='select'|'stamp'|'tile'|'erase'|'pan'
export type StageOptions={tool:StageTool;asset:string;grid:boolean;depth:boolean;snap:boolean;selected:string|null}
type Point={x:number;y:number}
export type StageWorld=FloorWorldControls&{bounds?:()=>{x:number;y:number;width:number;height:number}|null;solids?:()=>{x:number;y:number;width:number;height:number}[];tick:(delta:number,play:StagePlaytest)=>void;ground:(c:CanvasRenderingContext2D,reduced:boolean)=>void;bodies:()=>{depth:number;draw:(c:CanvasRenderingContext2D,reduced:boolean)=>void}[];overlay:(c:CanvasRenderingContext2D,reduced:boolean)=>void;dispose:()=>void}
export type StageGameplay={fixtureHandle?:(handle:FixtureHandle|null)=>void;world?:StageWorld;item?:ItemDocument;initial?:Point;options?:PlaytestOptions;label?:(object:StageObject)=>string|undefined;pin?:string|null}
type Callbacks={commit:(stage:StageDocument)=>void;select:(id:string|null)=>void;status:(text:string)=>void;handle:(point:Point|null)=>void;playState?:(active:boolean)=>void;error?:(message:string)=>void;interaction?:(prompt:PlayInteractionPrompt|null)=>void;npc?:(id:FloorNpcId)=>void;item?:(message:string)=>void}
export class StageCanvas {
  readonly canvas=document.createElement('canvas')
  private context:CanvasRenderingContext2D
  private observer:ResizeObserver
  private events=new AbortController()
  private images=new Map<string,HTMLImageElement>()
  private masks=new Map<string,ImageData>()
  private pending=new Set<string>()
  private failed=new Set<string>()
  private play:StagePlaytest|null=null
  private playRequest=0
  private playPending=false
  private interactionKey=''
  private playKeys=new Set<string>()
  private touchMove={x:0,y:0}
  private touchRunning=false
  private previousTime=0
  private statusTime=0
  private editView:{scale:number;offset:Point;autoFit:boolean}|null=null
  private exporting=false
  private frame=0
  private disposed=false
  private motion=new SceneryMotionRenderer()
  private reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)')
  private props:FloorPropRenderer|null=null
  private npcs:FloorNpcRenderer|null=null
  private suspended=false
  private gameplay:StageGameplay|null=null
  private stage:StageDocument
  private options:StageOptions={tool:'select',asset:'f:sofa',grid:false,depth:false,snap:true,selected:null}
  private autoFit=true
  private scale=1
  private offset={x:24,y:24}
  private size={width:1,height:1}
  private hover:Point|null=null
  private heldPan=false
  private gesture:{pointer:number;kind:'pan'|'move'|'tiles';start:Point;offset:Point;object?:StageObject;before:StageDocument;last?:Point}|null=null
  constructor(private host:HTMLElement,stage:StageDocument,private callbacks:Callbacks){
    this.stage=cloneStage(stage);this.context=this.canvas.getContext('2d')!
    this.canvas.className='block size-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
    this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Stage canvas. Drag objects to arrange; paint tiles or drop assets. Space or middle-drag pans. Ctrl plus scroll zooms.')
    host.append(this.canvas)
    const opts={signal:this.events.signal}
    this.reducedMotion.addEventListener('change',()=>this.drawSoon(),opts)
    this.canvas.addEventListener('pointerdown',this.down,opts);this.canvas.addEventListener('pointermove',this.move,opts)
    this.canvas.addEventListener('pointerup',this.up,opts);this.canvas.addEventListener('pointercancel',()=>this.cancel(),opts);this.canvas.addEventListener('lostpointercapture',()=>this.cancel(),opts)
    this.canvas.addEventListener('pointerleave',()=>{if(!this.gesture){this.hover=null;this.drawSoon()}},opts)
    this.canvas.addEventListener('contextmenu',event=>event.preventDefault(),opts)
    this.canvas.addEventListener('wheel',event=>{
      if(event.ctrlKey||event.metaKey){event.preventDefault();const rect=this.canvas.getBoundingClientRect();this.zoom(event.deltaY<0?1:-1,{x:event.clientX-rect.left,y:event.clientY-rect.top})}
      else{event.preventDefault();this.offset.x-=event.deltaX;this.offset.y-=event.deltaY;this.drawSoon()}
    },{...opts,passive:false})
    this.canvas.addEventListener('dragover',event=>{event.preventDefault();if(this.play||this.playPending)return;if(event.dataTransfer)event.dataTransfer.dropEffect='copy';this.hover=this.world(event.clientX,event.clientY);this.drawSoon()},opts)
    this.canvas.addEventListener('dragleave',()=>{this.hover=null;this.drawSoon()},opts)
    this.canvas.addEventListener('drop',event=>{event.preventDefault();if(this.play||this.playPending)return;const id=event.dataTransfer?.getData('application/x-pawtrail-stage-asset');if(id)this.place(id,this.world(event.clientX,event.clientY),event.altKey);this.hover=null;this.drawSoon()},opts)
    window.addEventListener('blur',()=>{this.heldPan=false;this.clearPlayInput();this.cancel()},opts)
    window.addEventListener('keydown',event=>{
      if(!this.play||this.playPending||this.suspended||event.ctrlKey||event.metaKey||event.altKey||this.blockedFocus())return
      const key=event.key.toLowerCase()
      if(['j','k','r','l'].includes(key)&&!event.repeat){event.preventDefault();this.useItem(({j:'primary',k:'special',r:'running',l:'extend'} as const)[key as 'j'|'k'|'r'|'l']);return}
      if(key==='e'&&!event.repeat){event.preventDefault();this.interactPlay();return}
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(key)){event.preventDefault();if(!event.repeat)this.playKeys.add(key)}
    },opts)
    window.addEventListener('keyup',event=>this.playKeys.delete(event.key.toLowerCase()),opts)
    document.addEventListener('visibilitychange',()=>{this.clearPlayInput();this.previousTime=0;this.drawSoon()},opts)
    this.observer=new ResizeObserver(()=>{const bounds=host.getBoundingClientRect();this.size={width:Math.max(1,Math.floor(bounds.width)),height:Math.max(1,Math.floor(bounds.height))};this.canvas.width=this.size.width;this.canvas.height=this.size.height;if(this.autoFit)this.fit();else this.drawSoon()});this.observer.observe(host)
    this.fit()
  }
  setDocument(stage:StageDocument){if(this.play||this.playPending)this.stopPlay();const resized=stage.width!==this.stage.width||stage.height!==this.stage.height;if(stage.groundArt!==this.stage.groundArt)this.motion.reset();this.stage=cloneStage(stage);this.gesture=null;if(resized&&this.autoFit)this.fit();else this.drawSoon()}
  get unrecordedVictory(){return this.gameplay?.world?.unrecordedVictory??false}
  canChangeFixtures(){return this.play&&this.play.report().phase!=='idle'?'Stand up or cancel your approach before changing camp furniture.':''}
  get inEncounter(){return this.gameplay?.world?.active??false}
  beginEncounter(){return!!this.play&&!!this.gameplay?.world?.begin?.(this.play)}
  leaveEncounter(){if(this.play)this.gameplay?.world?.leave?.(this.play)}
  async retryVictory(){return this.gameplay?.world?.retryVictory?.()}
  setGameplay(gameplay:StageGameplay){this.gameplay=gameplay;this.drawSoon()}
  setSuspended(paused:boolean){this.suspended=paused;if(paused)this.clearPlayInput();this.previousTime=0;this.drawSoon()}
  updateObjectStates(states:Record<string,ObjectState>){this.play?.setObjectStates(states);this.drawSoon()}
  pinObject(id:string|null){if(this.gameplay)this.gameplay.pin=id;this.drawSoon()}
  get playPosition(){return this.play?{...this.play.handoffPosition}:null}
  focus(){if(!this.suspended)this.canvas.focus({preventScroll:true})}
  async preload(){
    const files=new Set<string>()
    if(this.stage.groundArt)files.add(groundPaintings[this.stage.groundArt].file)
    files.add(assetsById[this.stage.baseTile].file)
    for(const object of this.stage.objects){const view=assetView(object);files.add(view.file);if(view.frontFile)files.add(view.frontFile);if(view.motion?.atlas)files.add(view.motion.atlas.file)}
    await Promise.all([...files].map(async file=>{const image=await stageImage(file);if(!this.disposed)this.images.set(file,image)}))
    if(this.disposed)throw Error('The stage load was cancelled.')
  }
  setOptions(options:StageOptions){this.options=options;this.canvas.style.cursor=this.play?'default':options.tool==='pan'?'grab':options.tool==='select'?'default':'crosshair';this.drawSoon()}
  setPanHeld(value:boolean){this.heldPan=value;this.canvas.style.cursor=value?'grab':this.options.tool==='select'?'default':'crosshair'}
  cancel(){if(this.gesture){this.stage=this.gesture.before;const pointer=this.gesture.pointer;this.gesture=null;if(this.canvas.hasPointerCapture(pointer))this.canvas.releasePointerCapture(pointer);this.drawSoon()}}
  fit(){this.autoFit=true;const bounds=this.host.getBoundingClientRect();this.scale=Math.max(1,Math.min(4,Math.floor(Math.min((bounds.width-48)/(this.stage.width*32),(bounds.height-48)/(this.stage.height*32)))));this.offset={x:Math.round((bounds.width-this.stage.width*32*this.scale)/2),y:Math.round((bounds.height-this.stage.height*32*this.scale)/2)};this.drawSoon()}
  zoom(direction:number,anchor:Point={x:this.size.width/2,y:this.size.height/2}){this.autoFit=false;const world={x:(anchor.x-this.offset.x)/this.scale,y:(anchor.y-this.offset.y)/this.scale};this.scale=Math.max(1,Math.min(4,this.scale+direction));this.offset={x:Math.round(anchor.x-world.x*this.scale),y:Math.round(anchor.y-world.y*this.scale)};this.drawSoon()}
  private world(clientX:number,clientY:number){const rect=this.canvas.getBoundingClientRect();return{x:(clientX-rect.left-this.offset.x)/this.scale,y:(clientY-rect.top-this.offset.y)/this.scale}}
  private snapped(point:Point,free=false){return{x:Math.max(16,Math.min(this.stage.width*32-16,this.options.snap&&!free?Math.floor(point.x/32)*32+16:Math.round(point.x))),y:Math.max(32,Math.min(this.stage.height*32,this.options.snap&&!free?Math.floor(point.y/32)*32+32:Math.round(point.y)))}}
  private inside(point:Point){return point.x>=0&&point.y>=0&&point.x<this.stage.width*32&&point.y<this.stage.height*32}
  private commit(){this.callbacks.commit(cloneStage(this.stage));this.drawSoon()}
  private place(id:string,point:Point,free=false){
    const asset=Object.hasOwn(assetsById,id)?assetsById[id]:null;if(!asset||!this.inside(point))return
    if(asset.kind==='tile'){this.stage.tiles[Math.floor(point.x/32)+','+Math.floor(point.y/32)]=id;this.commit();return}
    if(this.stage.objects.length>=1000){this.callbacks.status('This stage already has 1,000 objects.');return}
    const object:StageObject={id:newId(),asset:id,...this.snapped(point,free),rotation:asset.rotations[0]??0,elevation:0,layer:asset.furniture?.geometry?.occlusion==='floor'?'ground':'world',bias:0}
    this.stage.objects.push(object);this.callbacks.select(object.id);this.commit()
  }
  private tile(point:Point,erase=false){if(!this.inside(point))return;const key=Math.floor(point.x/32)+','+Math.floor(point.y/32);if(erase)delete this.stage.tiles[key];else if(assetsById[this.options.asset]?.kind==='tile')this.stage.tiles[key]=this.options.asset}
  private hit(point:Point){
    return [...this.stage.objects].sort((a,b)=>depthOf(b)-depthOf(a)).find(object=>{
      const view=assetView(object),angle=-view.angle*Math.PI/180,dx=point.x-object.x,dy=point.y-object.y+object.elevation
      const x=dx*Math.cos(angle)-dy*Math.sin(angle)+view.anchor[0],y=dx*Math.sin(angle)+dy*Math.cos(angle)+view.anchor[1]
      if(x<0||y<0||x>=view.width||y>=view.height)return false
      // Ignore transparent image corners so smaller items behind them stay selectable.
      const opaque=(file:string,sourceRect?:[number,number,number,number])=>{
        const image=this.images.get(file);if(!image)return true
        let mask=this.masks.get(file)
        if(!mask){const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d')!;context.drawImage(image,0,0);mask=context.getImageData(0,0,canvas.width,canvas.height);this.masks.set(file,mask)}
        const rect=sourceRect??[0,0,mask.width,mask.height]
        const sx=Math.min(mask.width-1,rect[0]+Math.floor(x/view.width*rect[2])),sy=Math.min(mask.height-1,rect[1]+Math.floor(y/view.height*rect[3]))
        return mask.data[(sy*mask.width+sx)*4+3]>16
      }
      return opaque(view.file,view.sourceRect)||!!view.frontFile&&opaque(view.frontFile)
    })
  }
  private down=(event:PointerEvent)=>{
    if(this.suspended)return
    if(event.button!==0&&event.button!==1)return
    event.preventDefault();this.canvas.focus({preventScroll:true});if(this.play||this.playPending)return;this.canvas.setPointerCapture(event.pointerId)
    const point=this.world(event.clientX,event.clientY),before=cloneStage(this.stage)
    if(event.button===1||this.heldPan||this.options.tool==='pan'){this.autoFit=false;this.gesture={pointer:event.pointerId,kind:'pan',start:{x:event.clientX,y:event.clientY},offset:{...this.offset},before};return}
    if(!this.inside(point))return
    if(this.options.tool==='stamp'){this.place(this.options.asset,point,event.altKey);return}
    if(this.options.tool==='tile'){this.gesture={pointer:event.pointerId,kind:'tiles',start:point,offset:{...this.offset},before,last:point};this.tile(point);this.drawSoon();return}
    const object=this.hit(point)
    if(this.options.tool==='erase'){
      if(object){this.stage.objects=this.stage.objects.filter(row=>row.id!==object.id);this.callbacks.select(null);this.commit()}else{this.gesture={pointer:event.pointerId,kind:'tiles',start:point,offset:{...this.offset},before,last:point};this.tile(point,true);this.drawSoon()}return
    }
    this.callbacks.select(object?.id??null)
    if(object)this.gesture={pointer:event.pointerId,kind:'move',start:point,offset:{...this.offset},object:{...object},before}
    this.drawSoon()
  }
  private move=(event:PointerEvent)=>{
    if(this.play||this.playPending)return
    const point=this.world(event.clientX,event.clientY);this.hover=point
    this.callbacks.status(`Tile ${Math.floor(point.x/32)}, ${Math.floor(point.y/32)} · ${this.scale}× zoom`)
    const gesture=this.gesture
    if(gesture?.pointer===event.pointerId){
      if(gesture.kind==='pan')this.offset={x:gesture.offset.x+event.clientX-gesture.start.x,y:gesture.offset.y+event.clientY-gesture.start.y}
      else if(gesture.kind==='move'&&gesture.object){const object=this.stage.objects.find(row=>row.id===gesture.object!.id)!;const target=this.snapped({x:gesture.object.x+point.x-gesture.start.x,y:gesture.object.y+point.y-gesture.start.y},event.altKey);Object.assign(object,target)}
      else if(gesture.kind==='tiles'){const last=gesture.last??point,steps=Math.ceil(Math.max(Math.abs(point.x-last.x),Math.abs(point.y-last.y))/8);for(let step=0;step<=steps;step++)this.tile({x:last.x+(point.x-last.x)*(step/Math.max(1,steps)),y:last.y+(point.y-last.y)*(step/Math.max(1,steps))},this.options.tool==='erase');gesture.last=point}
    }
    this.drawSoon()
  }
  private up=(event:PointerEvent)=>{const gesture=this.gesture;if(gesture?.pointer===event.pointerId){this.gesture=null;if(gesture.kind!=='pan'&&JSON.stringify(gesture.before)!==JSON.stringify(this.stage))this.commit()}if(this.canvas.hasPointerCapture(event.pointerId))this.canvas.releasePointerCapture(event.pointerId)}
  private image(file:string){if(this.images.has(file))return this.images.get(file)!;if(!this.pending.has(file)&&!this.failed.has(file)){this.pending.add(file);stageImage(file).then(image=>{if(this.disposed)return;this.images.set(file,image);this.pending.delete(file);this.drawSoon()}).catch(()=>{if(this.disposed)return;this.pending.delete(file);this.failed.add(file);this.callbacks.status('An asset could not load. Its placeholder remains selectable.');this.drawSoon()})}return null}
  private object(object:StageObject,alpha=1,part:'all'|'base'|'front'='all'){
    const context=this.context,view=assetView(object),state=!this.exporting&&this.play?.objectState(object.id)
    const radius=Math.hypot(view.width,view.height)+24,x=this.offset.x+object.x*this.scale,y=this.offset.y+(object.y-object.elevation)*this.scale
    if(!this.exporting&&(x+radius*this.scale<0||y+radius*this.scale<0||x-radius*this.scale>this.size.width||y-radius*this.scale>this.size.height))return
    const file=state&&state.open&&view.stateViews?.open?view.stateViews.open.file:state&&state.lit===false&&view.stateViews?.unlit?view.stateViews.unlit.file:view.file,image=this.image(file)
    context.save();context.globalAlpha=alpha;context.translate(object.x,object.y-object.elevation);context.rotate(view.angle*Math.PI/180)
    if(part!=='front'&&!this.exporting&&this.play&&view.geometry.actions.includes('toggle_light')&&(!state||state.lit!==false)){
      const y=-(view.furniture?.indicatorHeight??view.height*.68),radius=Math.min(24,Math.max(12,view.width*.7)),glow=context.createRadialGradient(0,y,1,0,y,radius)
      glow.addColorStop(0,'#ffd98b99');glow.addColorStop(1,'#ffd98b00');context.fillStyle=glow;context.fillRect(-radius,y-radius,radius*2,radius*2)
    }
    const live=!this.exporting&&view.liveModel&&this.props?.has(object.id),npcLive=!this.exporting&&view.npc&&this.npcs?.has(object.id)
    if(npcLive){if(part!=='front')this.npcs!.draw(context,object.id,0,0,this.motion.clock.timeMs,this.reducedMotion.matches)}
    else if(live){
      if(view.liveModel?.file){if(part==='front'&&view.frontFile){const front=this.image(view.frontFile);if(front)context.drawImage(front,-view.anchor[0],-view.anchor[1],view.width,view.height)}if(part!=='front')this.props!.drawAuthored(context,object.id,0,0,object.rotation,this.motion.clock.timeMs,state||undefined,this.reducedMotion.matches)}
      else this.props!.draw(context,object.id,0,0,object.rotation as 0|90|180|270,this.motion.clock.phase(object.id,6000,this.reducedMotion.matches),0,part==='front'?'front':'whole')
    }else if(part!=='front'){if(image){
      if(view.motion&&!this.exporting)this.motion.draw(context,image,view,view.motion,object.id,-view.anchor[0],-view.anchor[1],this.reducedMotion.matches,view.motion.atlas?this.image(view.motion.atlas.file)??undefined:undefined)
      else paintAsset(context,image,view,-view.anchor[0],-view.anchor[1],view.width,view.height)
    }
    else{context.fillStyle='#9d846d';context.fillRect(-view.anchor[0],-view.anchor[1],view.width,view.height);context.strokeStyle='#f3e5c7';context.strokeRect(-view.anchor[0],-view.anchor[1],view.width,view.height)}}
    if(!live&&part!=='base'&&view.frontFile){const front=this.image(view.frontFile);if(front)context.drawImage(front,-view.anchor[0],-view.anchor[1],view.width,view.height)}
    context.restore()
    if(this.gameplay&&part!=='front'){
      const text=this.gameplay.label?.(object)
      if(text){context.save();context.font='600 12px "Saira Condensed",sans-serif';context.textAlign='center';const w=Math.ceil(context.measureText(text).width)+12,y=Math.round(object.y-object.elevation-view.anchor[1]*.62-18);context.fillStyle='#181b2ee8';context.fillRect(object.x-w/2,y,w,17);context.fillStyle='#fff0d2';context.fillText(text,object.x,y+13);context.restore()}
      if(this.gameplay.pin===object.id){context.save();context.strokeStyle='#ffca70';context.lineWidth=2;context.beginPath();context.ellipse(object.x,object.y,22,9,0,0,Math.PI*2);context.stroke();context.fillStyle='#ffca70';context.beginPath();context.moveTo(object.x,object.y-16);context.lineTo(object.x-5,object.y-23);context.lineTo(object.x+5,object.y-23);context.fill();context.restore()}
    }
    if(state&&part!=='front'){
      const label=state.open!==undefined?(state.open?'Open':'Closed'):state.lit!==undefined?(state.lit?'On':'Off'):state.food?'Food stocked':state.water?'Water filled':state.wateredAt!==undefined?'Watered':''
      if(label){context.save();context.font='8px "Instrument Sans",sans-serif';context.textAlign='center';const width=Math.ceil(context.measureText(label).width)+10,x=Math.round(object.x),y=Math.round(object.y-object.elevation-view.anchor[1]-13);context.fillStyle='#fff7e8';context.strokeStyle='#795536';context.fillRect(x-width/2,y,width,12);context.strokeRect(x-width/2+.5,y+.5,width-1,11);context.fillStyle='#493326';context.fillText(label,x,y+9);context.restore()}
    }
  }
  private blockedFocus(){return !!(document.activeElement instanceof HTMLElement&&document.activeElement.closest('input,textarea,select,[role="combobox"],[role="menu"],[role="dialog"],[contenteditable="true"]'))}
  clearPlayInput(){this.playKeys.clear();this.touchMove={x:0,y:0};this.touchRunning=false}
  setPlayInput(x:number,y:number){this.touchMove={x,y}}
  setPlayRun(running:boolean){this.touchRunning=running}
  respawn(){this.play?.respawn();this.clearPlayInput();this.publishInteraction();this.drawSoon()}
  interactPlay(){if(!this.play||this.playPending||this.suspended)return;this.play.interact();this.clearPlayInput();this.publishInteraction();this.canvas.focus({preventScroll:true});this.drawSoon()}
  private publishInteraction(){const prompt=this.play?.prompt()??null,key=JSON.stringify(prompt);if(key!==this.interactionKey){this.interactionKey=key;this.callbacks.interaction?.(prompt)}}
  get playCharacter(){return this.play?.character}
  async enterPlay(character:PlayCharacter,item?:ItemDocument){
    this.cancel();this.clearPlayInput();const request=++this.playRequest;this.playPending=true
    let pendingProps:FloorPropRenderer|null=null,pendingActor:StagePlaytest|null=null,pendingNpcs:FloorNpcRenderer|null=null
    try{
      const {StagePlaytest}=await import('./playtest')
      if(this.disposed||request!==this.playRequest)return false
      const next=await StagePlaytest.create(cloneStage(this.stage),character,this.play?{...this.play.handoffPosition}:this.gameplay?.initial,item??this.gameplay?.item,this.gameplay?.options)
      pendingActor=next
      if(this.disposed||request!==this.playRequest){next.dispose();return false}
      const objects=this.stage.objects.filter(object=>assetsById[object.asset].liveModel)
      if(objects.length){
        if(objects.length>16)throw Error('This rehearsal supports up to 16 live props. Remove extras in Edit before playing.')
        this.callbacks.status('Loading shared 3D prop renderer…')
        const {FloorPropRenderer}=await import('../floors/prop-renderer');pendingProps=new FloorPropRenderer()
        for(const object of objects){const asset=assetsById[object.asset],model=asset.liveModel!;if(model.file)await pendingProps.addAuthored(object.id,model.file);else pendingProps.add(object.id,model.existing!,object.style)}
      }
      const npcs=this.stage.objects.filter(object=>assetsById[object.asset].npc)
      if(npcs.length){const {FloorNpcRenderer}=await import('../floors/npc-renderer');pendingNpcs=new FloorNpcRenderer();for(const object of npcs)pendingNpcs.add(object.id,assetsById[object.asset].npc!)}
      if(this.disposed||request!==this.playRequest){next.dispose();pendingProps?.dispose();pendingNpcs?.dispose();return false}
      if(!this.editView)this.editView={scale:this.scale,offset:{...this.offset},autoFit:this.autoFit}
      this.play?.dispose();this.props?.dispose();this.npcs?.dispose();this.npcs=pendingNpcs;pendingNpcs=null;this.props=pendingProps;pendingProps=null;this.play=next;pendingActor=null;this.interactionKey='';this.playPending=false;this.previousTime=0;this.statusTime=0;this.hover=null;this.heldPan=false
      this.canvas.style.cursor='default';this.callbacks.handle(null);this.callbacks.playState?.(true);this.callbacks.status(next.name+' ready. WASD / arrows to walk, Shift to run.');if(!this.suspended)this.canvas.focus({preventScroll:true});this.followPlayer(1);this.drawSoon();return true
    }catch(error){pendingActor?.dispose();pendingProps?.dispose();pendingNpcs?.dispose();if(request!==this.playRequest||this.disposed)return false;this.playPending=false;throw error}
  }
  useItem(key:ActionKey){if(!this.play||this.playPending||this.suspended)return;const result=this.play.useItem(key);this.callbacks.item?.(result.ok?(result.buffered?'Next strike queued.':key==='special'?'Wave launched. Damage registers only on contact.':'Slash started. Damage registers only on contact.'):({busy:'Finish the current action first.',cooldown:'That action is cooling down.','no-item':'No weapon is equipped.','invalid-state':'Stand up before attacking.'})[result.reason]);this.canvas.focus({preventScroll:true});this.drawSoon();return result}
  stopPlay(notify=true){
    ++this.playRequest;this.playPending=false;this.play?.dispose();this.play=null;this.props?.dispose();this.props=null;this.npcs?.dispose();this.npcs=null;this.interactionKey='';this.callbacks.interaction?.(null);this.clearPlayInput();this.previousTime=0
    if(this.editView){this.scale=this.editView.scale;this.offset=this.editView.offset;this.autoFit=this.editView.autoFit;this.editView=null}
    this.canvas.style.cursor=this.options.tool==='select'?'default':'crosshair';if(notify)this.callbacks.playState?.(false);this.drawSoon()
  }
  private followPlayer(delta:number){
    if(!this.play)return
    const x=this.offset.x+this.play.position.x*this.scale,y=this.offset.y+this.play.position.y*this.scale
    const mx=Math.min(120,this.size.width/3),my=Math.min(100,this.size.height/3)
    const target={x:this.offset.x+(x<mx?mx-x:x>this.size.width-mx?this.size.width-mx-x:0),y:this.offset.y+(y<my?my-y:y>this.size.height-my?this.size.height-my-y:0)}
    const blend=1-Math.exp(-Math.max(0,delta)*12);this.offset.x+=(target.x-this.offset.x)*blend;this.offset.y+=(target.y-this.offset.y)*blend
  }
  private drawSoon(){
    if(!this.frame&&!this.disposed)this.frame=requestAnimationFrame(time=>{
      this.frame=0
      try{
        const visible=!document.hidden&&this.size.width>1&&this.size.height>1
        this.motion.tick(time,visible,this.suspended||this.playPending||this.blockedFocus())
        if(this.play&&visible){
          const delta=this.previousTime&&!this.suspended&&!this.blockedFocus()&&!this.playPending?Math.min(40,time-this.previousTime):0;this.previousTime=time
          if(this.suspended||this.blockedFocus()||this.playPending)this.clearPlayInput()
          const keys=this.playKeys,x=this.touchMove.x+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=this.touchMove.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)
          this.gameplay?.world?.tick(delta,this.play);this.play.tick(delta,{x,y},keys.has('shift')||this.touchRunning);this.publishInteraction();this.followPlayer(delta/1000)
          const npc=this.play.takeNpcRequest();if(npc)this.callbacks.npc?.(npc)
          if(time-this.statusTime>250){this.callbacks.status(this.play.status());this.statusTime=time}
        }else this.previousTime=0
        this.draw();if(visible&&!this.suspended&&(this.play||!this.reducedMotion.matches&&(!!(this.stage.groundArt&&groundPaintings[this.stage.groundArt].reflections?.length)||this.stage.objects.some(object=>assetsById[object.asset].motion))))this.drawSoon()
      }catch(error){this.stopPlay();this.callbacks.error?.(error instanceof Error?error.message:'The playtest renderer stopped. Return to Edit and retry.')}
    })
  }
  private draw(){
    const c=this.context,{width,height}=this.size;c.imageSmoothingEnabled=false;c.fillStyle='#252931';c.fillRect(0,0,width,height)
    c.save();c.translate(Math.round(this.offset.x),Math.round(this.offset.y));c.scale(this.scale,this.scale)
    const w=this.stage.width*TILE,h=this.stage.height*TILE
    c.fillStyle='#8b7155';c.fillRect(0,0,w,h)
    const ground=this.stage.groundArt?groundPaintings[this.stage.groundArt]:undefined,groundImage=ground?this.image(ground.file):null
    if(ground&&groundImage){const gw=Math.min(w,ground.width),gh=Math.min(h,ground.height);c.drawImage(groundImage,0,0,gw,gh,0,0,gw,gh)}
    if(groundImage&&ground?.reflections&&!this.exporting)this.motion.reflections(c,groundImage,ground.reflections,this.stage.groundArt!,this.reducedMotion.matches)
    const left=Math.max(0,Math.floor(-this.offset.x/this.scale/32)),right=Math.min(this.stage.width,Math.ceil((width-this.offset.x)/this.scale/32)),top=Math.max(0,Math.floor(-this.offset.y/this.scale/32)),bottom=Math.min(this.stage.height,Math.ceil((height-this.offset.y)/this.scale/32))
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
      if(ground&&groundImage&&x*32<ground.width&&y*32<ground.height&&!Object.hasOwn(this.stage.tiles,x+','+y))continue
      const asset=assetsById[this.stage.tiles[x+','+y]??this.stage.baseTile],image=this.image(asset.file)
      if(image)paintAsset(c,image,asset,x*32,y*32,32,32)
    }
    if(this.stage.shell){
      for(const[color,x,y,width,height]of roomShellRects(this.stage.width,this.stage.height,this.stage.wallpaper,Math.floor(this.stage.width/2))){c.fillStyle='#'+color.toString(16).padStart(6,'0');c.fillRect(x,y,width,height)}
      const asset=assetsById[`wall:${this.stage.wallpaper}:north`],image=this.image(asset.file)
      if(image)for(let x=0;x<this.stage.width;x++)c.drawImage(image,x*32,32,32,32)
    }
    if(this.options.grid&&!this.play){c.strokeStyle='#f6eed64d';c.lineWidth=1/this.scale;c.beginPath();for(let x=0;x<=w;x+=32){c.moveTo(x,0);c.lineTo(x,h)}for(let y=0;y<=h;y+=32){c.moveTo(0,y);c.lineTo(w,y)}c.stroke()}
    if(this.play&&!this.exporting)this.gameplay?.world?.ground(c,this.reducedMotion.matches)
    const objects=[...this.stage.objects].sort((a,b)=>depthOf(a)-depthOf(b)||a.id.localeCompare(b.id))
    const player=this.exporting?null:this.play
    const layers:{depth:number;object:StageObject|null;part:'all'|'base'|'front';draw?:()=>void}[]=[]
    for(const object of objects){
      const split=player?.foregroundTarget===object.id&&!!assetView(object).frontFile
      layers.push({depth:depthOf(object),object,part:split?'base':'all'})
      if(split)layers.push({depth:depthOf(object)+1,object,part:'front'})
    }
    if(player)layers.push({depth:player.renderDepth,object:null,part:'all'})
    if(player)for(const body of this.gameplay?.world?.bodies()??[])layers.push({depth:body.depth,object:null,part:'all',draw:()=>body.draw(c,this.reducedMotion.matches)})
    layers.sort((a,b)=>a.depth-b.depth)
    for(const layer of layers){if(layer.object)this.object(layer.object,1,layer.part);else if(layer.draw)layer.draw();else player?.draw(c)}
    if(player){player.drawItemWorld(c,this.options.depth);this.gameplay?.world?.overlay(c,this.reducedMotion.matches)}
    if(this.options.depth&&player)player.drawDiagnostics(c,this.scale)
    if(this.options.depth&&!player){
      const contacts=objects.map(footprint)
      objects.forEach((object,index)=>{
        const r=contacts[index];const overlap=objects.some((other,otherIndex)=>{if(other.id===object.id||other.layer!==object.layer)return false;const s=contacts[otherIndex];return r.x<s.x+s.width&&r.x+r.width>s.x&&r.y<s.y+s.height&&r.y+r.height>s.y})
        c.fillStyle=overlap?'#f5656544':'#42c8b53d';c.fillRect(r.x,r.y,r.width,r.height);c.strokeStyle=overlap?'#ff8c86':'#75eddb';c.lineWidth=1/this.scale;c.strokeRect(r.x,r.y,r.width,r.height)
        c.beginPath();c.moveTo(object.x,object.y);c.lineTo(object.x,object.y-object.elevation);c.stroke()
        c.fillStyle='#172a2a';c.fillRect(object.x-2,object.y-10,22,11);c.fillStyle='#e5fff9';c.font='9px "Instrument Sans"';c.fillText(String(index+1),object.x,object.y-2)
      })
    }
    if(this.gameplay?.fixtureHandle){
      const target=player?.foregroundTarget??player?.prompt()?.target,placed=objects.find(o=>o.id===target&&['camp-koi','camp-bench'].includes(o.id))
      if(player&&placed){const view=assetView(placed);this.gameplay.fixtureHandle({id:placed.id==='camp-koi'?'koi':'bench',x:Math.round(this.offset.x+placed.x*this.scale),y:Math.round(this.offset.y+(placed.y-placed.elevation-(view.furniture?.indicatorHeight??view.anchor[1]))*this.scale)-18,rotation:placed.rotation,occupied:player.report().phase!=='idle'})}else this.gameplay.fixtureHandle(null)
    }
    const selected=this.play?undefined:objects.find(object=>object.id===this.options.selected)
    if(selected){const view=assetView(selected);c.save();c.translate(selected.x,selected.y-selected.elevation);c.rotate(view.angle*Math.PI/180);c.strokeStyle='#ffca70';c.lineWidth=2/this.scale;c.strokeRect(-view.anchor[0],-view.anchor[1],view.width,view.height);c.restore();const point={x:this.offset.x+selected.x*this.scale,y:this.offset.y+(selected.y-selected.elevation-(view.furniture?.indicatorHeight??view.anchor[1]))*this.scale-18};this.callbacks.handle(point.x>0&&point.x<width&&point.y>0&&point.y<height?point:null)}else this.callbacks.handle(null)
    if(!this.play&&!this.playPending&&this.hover&&this.inside(this.hover)){
      if(this.options.tool==='stamp'&&assetsById[this.options.asset]?.kind==='object'){const object:StageObject={id:'ghost',asset:this.options.asset,...this.snapped(this.hover),rotation:0,elevation:0,bias:0,layer:'world'};this.object(object,.5)}
      else if(this.options.tool==='tile'||this.options.tool==='erase'){c.strokeStyle='#fff5c2';c.lineWidth=2/this.scale;c.strokeRect(Math.floor(this.hover.x/32)*32,Math.floor(this.hover.y/32)*32,32,32)}
    }
    c.strokeStyle='#e5d4ae';c.lineWidth=1/this.scale;c.strokeRect(0,0,w,h);c.restore()
  }
  async exportPNG(){
    const snapshot=cloneStage(this.stage)
    const files=new Set<string>([assetsById[snapshot.baseTile].file,...Object.values(snapshot.tiles).map(id=>assetsById[id].file)])
    if(snapshot.groundArt)files.add(groundPaintings[snapshot.groundArt].file)
    for(const object of snapshot.objects){const view=assetView(object);files.add(view.file);if(view.frontFile)files.add(view.frontFile)}
    if(snapshot.shell)files.add(assetsById[`wall:${snapshot.wallpaper}:north`].file)
    await Promise.all([...files].map(async file=>{this.images.set(file,await stageImage(file))}))
    if(this.disposed)throw Error('The stage editor was closed.')
    const previous={stage:this.stage,size:this.size,scale:this.scale,offset:this.offset,options:this.options,hover:this.hover}
    try{
      this.exporting=true;this.stage=snapshot;this.size={width:snapshot.width*32,height:snapshot.height*32};this.canvas.width=this.size.width;this.canvas.height=this.size.height;this.scale=1;this.offset={x:0,y:0};this.options={...this.options,selected:null,grid:false,depth:false};this.hover=null;this.draw();return this.canvas.toDataURL('image/png')
    }finally{this.exporting=false;this.stage=previous.stage;this.size=previous.size;this.scale=previous.scale;this.offset=previous.offset;this.options=previous.options;this.hover=previous.hover;this.canvas.width=this.size.width;this.canvas.height=this.size.height;this.drawSoon()}
  }
  dispose(){this.gameplay?.world?.dispose();this.stopPlay(false);this.disposed=true;cancelAnimationFrame(this.frame);this.motion.dispose();this.events.abort();this.observer.disconnect();this.canvas.remove();this.images.clear();this.masks.clear()}
}
