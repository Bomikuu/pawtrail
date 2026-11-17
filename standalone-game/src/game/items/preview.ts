import {StagePlaytest} from '../stage-editor/playtest'
import {stageImage,paintAsset,assetsById,assetView} from '../stage-editor/data'
import {trainingStage,trainingSpawn,trainingTargets} from './training'
import {audio} from '../systems/audio'
import {forward} from './spatial'
import {getAction,type ItemDocument,type ActionKey,type Vec} from './document'
export type TrainingReport={cooldowns:Record<ActionKey,number>;hits:number;log:string[];phase:string;time:number;canChain:boolean;buffered:boolean;activeAction:ActionKey|null;zoom:number}
/** Canvas2D rehearsal adapter using the stage editor's actual actor/movement/collision path. */
export class ItemPreview{
 readonly canvas=document.createElement('canvas')
 private ctx:CanvasRenderingContext2D
 private player:StagePlaytest
 private stage=trainingStage()
 private observer:ResizeObserver
 private events=new AbortController()
 private frame=0
 private last=0
 private reportAt=0
 private keys=new Set<string>()
 private images=new Map<string,HTMLImageElement>()
 private scale=1
 private userZoom:number|null=null
 private wheelZoom=0
 private offset={x:0,y:0}
 private disposed=false
 private failed=false
 private visible=true
 private move:Vec={x:0,y:0}
 private running=false
 private paused=false
 private timeline:{key:ActionKey;duration:number;speed:number;loop:boolean;time:number}|null=null
 private activeAction:ActionKey='primary'
 private debug=true
 private handleStart:(()=>void)|null=null
 private areaHandle:((range:number,width?:number)=>void)|null=null
 private dragging=false
 private dragKind:'range'|'width'='range'
 static async create(host:HTMLElement,item:ItemDocument,character:'amber'|'yae',report:(state:TrainingReport)=>void,error:(message:string)=>void){const player=await StagePlaytest.create(trainingStage(),character,trainingSpawn,item);player.face('up');player.setTrainingTargets(trainingTargets);return new ItemPreview(host,player,report,error)}
 private constructor(private host:HTMLElement,player:StagePlaytest,private report:(state:TrainingReport)=>void,private error:(message:string)=>void){
  this.player=player;this.ctx=this.canvas.getContext('2d')!;this.canvas.className='block h-full w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring';this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Item training garden. WASD move, Shift run, J combo, R running sweep, L extending chain, K special.');host.append(this.canvas)
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize()
  const files=new Set([assetsById[this.stage.baseTile].file,...this.stage.objects.map(o=>assetView(o).file)])
  for(const file of files)stageImage(file).then(image=>{if(!this.disposed)this.images.set(file,image)}).catch(()=>{if(!this.disposed)this.error('A training texture could not load. The grid and collision rehearsal remain available.')})
  const signal=this.events.signal
  this.canvas.addEventListener('wheel',event=>{
   event.preventDefault()
   this.wheelZoom+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?240:1)
   if(Math.abs(this.wheelZoom)<(event.ctrlKey?8:70))return
   const direction=this.wheelZoom<0?1:-1;this.wheelZoom=0
   const box=this.canvas.getBoundingClientRect()
   this.zoomBy(direction,{x:event.clientX-box.left,y:event.clientY-box.top})
  },{signal,passive:false})
  window.addEventListener('keydown',e=>{if(this.blocked()||!this.host.contains(document.activeElement))return;const key=e.key.toLowerCase();if(['+','=','-','0'].includes(key)){e.preventDefault();if(!e.repeat){if(key==='0')this.fitZoom();else this.zoomBy(key==='-'?-1:1)}return}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','j','k','r','l'].includes(key)){e.preventDefault();if(!e.repeat&&['j','k','r','l'].includes(key))this.activate(({j:'primary',k:'special',r:'running',l:'extend'} as const)[key as 'j'|'k'|'r'|'l']);this.keys.add(key)}},{signal})
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()),{signal});window.addEventListener('blur',()=>this.clearInput(),{signal});document.addEventListener('visibilitychange',()=>{this.last=0;this.clearInput();this.player.effects.clear()},{signal})
  this.canvas.addEventListener('pointerdown',e=>{this.canvas.focus();if(this.areaHandle){this.handleStart?.();const b=this.canvas.getBoundingClientRect(),p=this.player.position,f=forward(this.player.facing),h=getAction(this.player.equippedItem!,this.activeAction).area,x=(e.clientX-b.left-this.offset.x)/this.scale-p.x,y=(e.clientY-b.top-this.offset.y)/this.scale-p.y;this.dragKind=Math.abs(x*f.y-y*f.x)>h.width*.35?'width':'range';this.dragging=true;this.canvas.setPointerCapture(e.pointerId);this.dragArea(e)}},{signal});this.canvas.addEventListener('pointermove',e=>{if(this.dragging)this.dragArea(e)},{signal});this.canvas.addEventListener('pointerup',()=>{this.dragging=false},{signal});this.canvas.addEventListener('pointercancel',()=>{this.dragging=false},{signal});this.tick(0)
 }
 private blocked(){return !!document.activeElement?.closest('input,textarea,select,[role="combobox"],[role="dialog"],[role="menu"]')}
 private resize(){
  const box=this.host.getBoundingClientRect();this.visible=box.width>1&&box.height>1
  const dpr=Math.min(2,window.devicePixelRatio||1)
  this.canvas.width=Math.round(box.width*dpr);this.canvas.height=Math.round(box.height*dpr)
  this.scale=this.userZoom??Math.max(1,Math.min(6,Math.floor(Math.min(box.width/640,box.height/448))))
  this.offset={x:box.width/2-this.player.position.x*this.scale,y:Math.min((box.height-448*this.scale)/2,box.height*.72-this.player.position.y*this.scale)}
 }
 zoomBy(delta:number,anchor?:Vec){
  const next=Math.max(1,Math.min(6,this.scale+Math.sign(delta)))
  if(next===this.scale)return
  const point=anchor??{x:this.offset.x+this.player.position.x*this.scale,y:this.offset.y+this.player.position.y*this.scale}
  const world={x:(point.x-this.offset.x)/this.scale,y:(point.y-this.offset.y)/this.scale}
  this.userZoom=next;this.scale=next
  this.offset={x:point.x-world.x*next,y:point.y-world.y*next}
  this.canvas.focus({preventScroll:true});this.publish()
 }
 fitZoom(){this.userZoom=null;this.resize();this.canvas.focus({preventScroll:true});this.publish()}
 setOptions(key:ActionKey,debug:boolean,muted:boolean,areaHandle:((range:number,width?:number)=>void)|null=null,onStart:(()=>void)|null=null){this.activeAction=key;this.debug=debug;this.player.effects.muted=muted;if(muted)this.player.effects.stopVoices();this.areaHandle=areaHandle;this.handleStart=onStart;this.canvas.style.cursor=areaHandle?'crosshair':'default'}
 private dragArea(e:PointerEvent){const b=this.canvas.getBoundingClientRect(),p=this.player.position,f=forward(this.player.facing),h=getAction(this.player.equippedItem!,this.activeAction).area,x=(e.clientX-b.left-this.offset.x)/this.scale-p.x,y=(e.clientY-b.top-this.offset.y)/this.scale-p.y;this.areaHandle?.(this.dragKind==='range'?Math.max(8,Math.min(256,x*f.x+y*f.y-h.offset)):h.range,this.dragKind==='width'?Math.max(8,Math.min(192,Math.abs(x*f.y-y*f.x)*2)):undefined)}
 activate(key:ActionKey){this.timeline=null;this.paused=false;void audio.unlock();this.canvas.focus({preventScroll:true});const result=this.player.useItem(key);if(!result.ok)this.error(result.reason==='cooldown'?'This action is cooling down.':result.reason==='busy'?'Use J during the combo window, or wait for recovery.':'This item does not have that move, or the character must stand up first.');return result}
 seek(key:ActionKey,time:number){this.timeline=null;this.paused=true;this.player.seekItem(key,time);this.last=0;this.publish()}
 playTimeline(key:ActionKey,time:number,speed:number,loop:boolean){this.seek(key,time);this.timeline={key,duration:getAction(this.player.equippedItem!,key).duration,speed,loop,time};this.paused=false;this.last=0}
 pause(){this.paused=true;this.clearInput();this.player.effects.stopVoices()}
 resume(){this.paused=false;this.last=0}
 setInput(x:number,y:number,run=false){this.move={x,y};this.running=run}
 clearInput(){this.keys.clear();this.move={x:0,y:0};this.running=false}
 reset(){this.timeline=null;this.player.resetItems();this.player.respawn();Object.assign(this.player.position,trainingSpawn);this.player.face('up');this.paused=false;this.clearInput();this.publish()}
 private publish(){const s=this.player.abilitySnapshot,c=s.cast;this.report({cooldowns:s.cooldowns,hits:[...this.player.hitCounts.values()].reduce((a,b)=>a+b,0),log:[...this.player.abilityLog],time:c?.elapsed??this.timeline?.time??0,canChain:c?.canChain??false,buffered:c?.buffered??false,activeAction:c?.key??null,zoom:this.scale,phase:c?c.action.name+' · '+(c.buffered?'next strike queued':c.canChain?'press J to chain':c.elapsed<c.action.windup?'Preparation':c.elapsed<c.action.activeEnd?'Active':'Recovery'):'Ready'})}
 setDefinition(item:ItemDocument){this.player.updateItem(item)}
 setTargetEligibility(eligible:boolean){this.player.setTargetsEligible(eligible)}
 private tick=(time:number)=>{if(this.disposed||this.failed)return;this.frame=requestAnimationFrame(this.tick);try{const dt=this.last?Math.min(40,time-this.last):0;this.last=time;if(document.hidden||!this.visible){this.last=0;return}if(!this.paused){if(this.blocked())this.clearInput();const k=this.keys;this.player.tick(dt*(this.timeline?.speed??1),{x:this.move.x+(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),y:this.move.y+(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0)},this.running||k.has('shift'))}if(this.timeline&&!this.paused){const cast=this.player.abilitySnapshot.cast;this.timeline.time=cast?.elapsed??this.timeline.duration;if(!cast){if(this.timeline.loop){this.player.seekItem(this.timeline.key,0);this.timeline.time=0}else{this.timeline.time=this.timeline.duration;this.paused=true}}}const box=this.host.getBoundingClientRect(),screen={x:this.offset.x+this.player.position.x*this.scale,y:this.offset.y+this.player.position.y*this.scale},margin=48;if(screen.x<margin)this.offset.x+=margin-screen.x;if(screen.x>box.width-margin)this.offset.x-=screen.x-box.width+margin;if(screen.y<margin)this.offset.y+=margin-screen.y;if(screen.y>box.height-margin)this.offset.y-=screen.y-box.height+margin;this.draw();if(time-this.reportAt>100){this.reportAt=time;this.publish()}}catch(reason){this.failed=true;this.error(reason instanceof Error?reason.message:'Training rendering stopped. Reopen Try to recover.');this.paused=true}}
 private draw(){const c=this.ctx,dpr=Math.min(2,window.devicePixelRatio||1);c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#252b28';c.fillRect(0,0,this.canvas.width/dpr,this.canvas.height/dpr);c.save();c.translate(Math.round(this.offset.x),Math.round(this.offset.y));c.scale(this.scale,this.scale);c.imageSmoothingEnabled=false;c.fillStyle='#a3b17b';c.fillRect(0,0,640,448);const tile=assetsById[this.stage.baseTile],image=this.images.get(tile.file);if(image)for(let y=0;y<14;y++)for(let x=0;x<20;x++)paintAsset(c,image,tile,x*32,y*32)
  if(this.debug){c.strokeStyle='#334d4333';c.lineWidth=.5;c.beginPath();for(let x=0;x<=640;x+=32){c.moveTo(x,0);c.lineTo(x,448)}for(let y=0;y<=448;y+=32){c.moveTo(0,y);c.lineTo(640,y)}c.stroke()}
  for(const o of this.stage.objects){const a=assetView(o),image=this.images.get(a.file);if(image)paintAsset(c,image,a,o.x-a.anchor[0],o.y-a.anchor[1])}
  this.player.drawItemWorld(c,this.debug,this.activeAction);
  if(this.areaHandle){const h=getAction(this.player.equippedItem!,this.activeAction).area,p=this.player.position,f=forward(this.player.facing);c.fillStyle='#fff5d6';c.strokeStyle='#265341';c.lineWidth=1;for(const point of [{x:p.x+f.x*(h.offset+h.range),y:p.y+f.y*(h.offset+h.range)},{x:p.x+f.x*(h.offset+h.range/2)+f.y*h.width/2,y:p.y+f.y*(h.offset+h.range/2)-f.x*h.width/2}]){c.beginPath();c.arc(point.x,point.y,4,0,Math.PI*2);c.fill();c.stroke()}}
this.player.draw(c);if(this.debug)this.player.drawDiagnostics(c,this.scale);c.restore()
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.events.abort();this.observer.disconnect();this.player.dispose();this.canvas.remove()}
}
