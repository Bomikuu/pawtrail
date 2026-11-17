import {STUDIO_LOCOMOTION,approachVelocity,approachFacing} from '../systems/studio-locomotion'
import {itemTravel} from '../items/travel'
import {ultimateCutIn} from '../items/ultimate-cut-in'
import {actorIllustrations} from '../creator/illustrations'
import {loadActorIllustration} from '../creator/illustration-assets'
import {AbilitySession,type AbilityTarget,type AbilityEvent} from '../items/runtime'
import {ItemPresentation,drawArea} from '../items/presentation'
import {forward,areaHits,clearSight,center} from '../items/spatial'
import {equippedFactory,prepareItem,itemPalette} from '../items/equipment'
import {getAction,availableActions,type ItemDocument,type ActionKey,type Vec} from '../items/document'
import {audio} from '../systems/audio'
import { PixelActor, CREATOR_FRAME, humanClips } from '../actor-rig/pixel-renderer'
import { creatorTemplates } from '../creator/state'
import { prepareCreatorModel, creatorModelFactory } from '../creator/preview-models'
import type { CreatorPreviewModel } from '../creator/preview-models'
import type { ActorAppearance } from '../actor-rig/appearance'
import { movementVector } from '../systems/behavior'
import { footRect, intersects, worldRect, worldPoint } from '../housing/spatial'
import { groundForState } from '../housing/geometry'
import type { Point, Rect, Placement, ObjectState } from '../housing/types'
import { InteractionController } from '../housing/interactions'
import { clearSegment, interactionPath } from './interaction-path'
import { assetsById, assetView, footprint, depthOf, type StageDocument, type StageObject } from './data'

export type PlayCharacter='amber'|'yae'
export type PlayInteractionPrompt={target:string;label:string;description:string;button:string;kind:'sit'|'rest'|'door'|'light';disabled:boolean}
type SeatTarget={object:StageObject;seatId:string;label:string;kind:'sit'|'rest';point:Point;exit:Point;approaches:Point[];direction:string;elevation:number}
type PlaytestOptions={claims?:Map<string,string>;actorId?:string;name?:string;objectStates?:Record<string,ObjectState>;occupants?:()=>Point[]}
type InteractionPlan={target:SeatTarget;approach:Point;exit:Point}
type Solid={rect:Rect;label:string}
const directions=['down','down_left','left','up_left','up','up_right','right','down_right']
const sector=(x:number,y:number)=>directions[(Math.round(Math.atan2(-x,y)/(Math.PI/4))+8)%8]
/** Disposable rehearsal actor. No room edits, game progress, inventory or platform writes. */
export class StagePlaytest {
  readonly name:string
  readonly solids:Solid[]=[]
  readonly position:Point
  readonly sprite=document.createElement('canvas')
  readonly character:PlayCharacter
  private interactions:InteractionController
  private targets:SeatTarget[]=[]
  private plan:InteractionPlan|null=null
  private path:Point[]=[]
  private heldPose:'sit'|'sleep'|null=null
  private poseStarted=0
  private feedback=''
  private lastSafe:Point={x:0,y:0}
  private actor:PixelActor
  private cells=new Map<string,Solid[]>()
  private elapsed=0
  private stride=0
  private moving=false
  private running=false
  private direction='down'
  private yaw=0
  private velocity:Point={x:0,y:0}
  private renderAction=''
  private renderPhase=0
  private fromAction=''
  private fromPhase=0
  private transitionStarted=0
  private seekOrigin:Point|null=null
  private originalTargets:AbilityTarget[]=[]
  private recoils=new Map<string,{velocity:Point;remaining:number}>()
  private hitPause=0
  private signature=''
  private contact=''
  private disposed=false
  private claims:Map<string,string>
  private actorId:string
  private objectStates:Record<string,ObjectState>
  private occupants:()=>Point[]
  private objectTarget:{object:StageObject;label:string}|null=null
  private gesture:string|null=null
  private stateSignature=''
  private item:ItemDocument|null=null
  private cutInSource='playtest-'+crypto.randomUUID()
  readonly ability=new AbilitySession()
  readonly effects=new ItemPresentation()
  readonly trainingTargets:AbilityTarget[]=[]
  readonly hitCounts=new Map<string,number>()
  readonly hitTimes=new Map<string,number>()
  readonly abilityLog:string[]=[]
  get facing(){return this.direction}
  get equippedItem(){return this.item}
  get abilitySnapshot(){return this.ability.snapshot()}
  updateItem(item:ItemDocument){ultimateCutIn.clear(this.cutInSource);if(this.item)Object.assign(this.item,structuredClone(item));this.ability.equip(this.item);this.effects.clear();this.signature=''}
  setTrainingTargets(targets:AbilityTarget[]){this.originalTargets=structuredClone(targets);this.trainingTargets.splice(0,this.trainingTargets.length,...structuredClone(targets))}
  setTargetsEligible(eligible:boolean){for(const target of [...this.trainingTargets,...this.originalTargets])target.eligible=eligible}
  useItem(key:ActionKey){
    if(this.interactions.active)this.interactions.cancel()
    const result=this.ability.activate(key,{id:this.actorId,position:{...this.position},direction:this.direction,running:this.running,eligible:!this.heldPose&&!this.gesture})
    if(!result.ok)this.feedback=({busy:'Finish the current action first.',cooldown:'That action is cooling down.','no-item':'Choose a saved item first.','invalid-state':'Stand up before using the item.'})[result.reason]
    else if(result.buffered)this.feedback='Next strike queued'
    else{this.velocity={x:0,y:0};this.seekOrigin={...this.position};this.feedback=this.item?getAction(this.item,this.abilitySnapshot.cast?.key??key).name:'';void audio.unlock();if(key==='special')ultimateCutIn.show({source:this.cutInSource,castId:result.castId,character:this.character,ability:this.feedback})}
    return result
  }
  private consumeAbility(events:AbilityEvent[],silent=false){
    this.effects.consume(events,silent)
    for(const event of events){
      if(event.kind==='hit'&&event.targetId){
        this.hitCounts.set(event.targetId,(this.hitCounts.get(event.targetId)??0)+1)
        this.hitTimes.set(event.targetId,this.ability.snapshot().time)
        if(event.impulse)this.recoils.set(event.targetId,{velocity:{x:event.impulse.x/(.075*(1-Math.exp(-220/75))),y:event.impulse.y/(.075*(1-Math.exp(-220/75)))},remaining:220})
        if(!silent)this.hitPause=Math.max(this.hitPause,event.hitStop??0)
      }
      if(event.kind!=='sound'){this.abilityLog.unshift(`${Math.round(event.time)} ms · ${event.kind}${event.targetId?' · '+event.targetId:''}`);if(this.abilityLog.length>40)this.abilityLog.pop()}
    }
  }
  resetItems(){
    ultimateCutIn.clear(this.cutInSource)
    this.seekOrigin=null;this.velocity={x:0,y:0};this.renderAction='';this.fromAction='';this.hitPause=0;this.recoils.clear()
    this.trainingTargets.splice(0,this.trainingTargets.length,...structuredClone(this.originalTargets))
    this.ability.reset();this.ability.equip(this.item);this.effects.clear();this.hitCounts.clear();this.hitTimes.clear();this.abilityLog.length=0;this.signature=''
  }
  seekItem(key:ActionKey,time:number){
    const origin={...(this.seekOrigin??this.position)}
    this.resetItems();this.seekOrigin=origin;Object.assign(this.position,origin)
    this.velocity={x:0,y:0};this.moving=false;this.running=false
    this.ability.activate(key,{id:this.actorId,position:{...this.position},direction:this.direction})
    let remaining=Math.max(0,time)
    while(remaining>0){const dt=Math.min(remaining,1000/60);this.advanceItem(dt,true);remaining-=dt}
    this.yaw=-directions.indexOf(this.direction)*Math.PI/4
    this.renderAction='item-'+key;this.fromAction='';this.signature=''
  }
  private moveGround(dx:number,dy:number){
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3))
    for(let step=0;step<steps;step++){
      const x={x:this.position.x+dx/steps,y:this.position.y},blockedX=this.obstruction(x)
      if(!blockedX)this.position.x=x.x;else if(dx){this.contact=blockedX;this.velocity.x=0}
      const y={x:this.position.x,y:this.position.y+dy/steps},blockedY=this.obstruction(y)
      if(!blockedY)this.position.y=y.y;else if(dy){this.contact=blockedY;this.velocity.y=0}
    }
    if(!this.obstruction(this.position))this.lastSafe={...this.position}
  }
  private advanceItem(deltaMs:number,silent=false){
    for(const[id,recoil]of this.recoils){
      const target=this.trainingTargets.find(t=>t.id===id)
      if(!target){this.recoils.delete(id);continue}
      const used=Math.min(deltaMs,recoil.remaining),decay=Math.exp(-used/75),dx=recoil.velocity.x*.075*(1-decay),dy=recoil.velocity.y*.075*(1-decay),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3))
      for(let step=0;step<steps;step++){
        const next={...target.rect,x:target.rect.x+dx/steps,y:target.rect.y+dy/steps}
        if(next.x>=0&&next.y>=0&&next.x+next.width<=this.stage.width*32&&next.y+next.height<=this.stage.height*32&&!this.solids.some(s=>intersects(next,s.rect)))Object.assign(target.rect,next)
        else{recoil.velocity={x:0,y:0};break}
      }
      recoil.velocity.x*=decay;recoil.velocity.y*=decay;recoil.remaining-=used
      if(recoil.remaining<=0)this.recoils.delete(id)
    }
    const cast=this.ability.snapshot().cast
    if(cast&&this.item){
      const action=getAction(this.item,cast.key),f=forward(cast.actor.direction)
      const travel=itemTravel(action,cast.elapsed+deltaMs)-itemTravel(action,cast.elapsed)
      if(travel)this.moveGround(f.x*travel,f.y*travel)
    }
    this.effects.advance(deltaMs)
    this.consumeAbility(this.ability.advance(deltaMs,{targets:this.trainingTargets,solids:this.solids.map(s=>s.rect),actorPosition:{...this.position}}),silent)
    if(cast?.key==='special'&&this.ability.snapshot().cast?.id!==cast.id)ultimateCutIn.finish(this.cutInSource,cast.id)
  }
  face(direction:string){this.direction=direction;this.yaw=-directions.indexOf(direction)*Math.PI/4;this.signature=''}

  private constructor(private stage:StageDocument,character:PlayCharacter,actor:PixelActor,initial?:Point,options:PlaytestOptions={}){
    this.actor=actor;this.character=character;this.name=options.name??(character==='amber'?'Amber':'Yae Miko')
    this.claims=options.claims??new Map();this.actorId=options.actorId??crypto.randomUUID()
    this.objectStates=options.objectStates??{};this.occupants=options.occupants??(()=>[this.position])
    this.sprite.width=actor.bounds.width*CREATOR_FRAME.density;this.sprite.height=actor.bounds.height*CREATOR_FRAME.density
    this.buildSolids()
    const spawn=this.findSpawn(initial??{x:stage.width*16,y:stage.height*32-64})
    if(!spawn)throw Error('There is no walkable spawn. Return to Edit and leave a clear floor area for the character.')
    this.position=spawn;this.lastSafe={...spawn};this.buildTargets()
    this.interactions=new InteractionController({
      status:()=>{},now:()=>this.elapsed*1000,send:()=>{},path:path=>{this.path=[...path]},
      face:point=>{this.direction=sector(point.x-this.position.x,point.y-this.position.y)},
      pose:name=>{
        if(!['sit','sleep'].includes(name)){this.gesture=humanClips[name]?name:null;this.poseStarted=this.elapsed;this.signature='';return}
        if(!this.plan)return
        this.heldPose=name as 'sit'|'sleep';this.poseStarted=this.elapsed;this.direction=this.plan.target.direction
        Object.assign(this.position,this.plan.target.point);this.moving=false;this.running=false;this.signature=''
      },
      recover:()=>this.releasePose(),message:text=>{this.feedback=text},
    })
  }
  static async create(stage:StageDocument,character:PlayCharacter,initial?:Point,item?:ItemDocument){
    const illustration=item?actorIllustrations[character]:undefined
    if(illustration)void loadActorIllustration(illustration).catch(()=>{})
    await Promise.all([prepareCreatorModel(character),item?prepareItem(item):Promise.resolve()])
    const preset=creatorTemplates.find(row=>row.id===(character==='amber'?'amber-outrider':'yae-miko'))!
    if(item)item=structuredClone(item)
    const actor=new PixelActor(preset.appearance,CREATOR_FRAME.density,item?equippedFactory(creatorModelFactory(character),item):creatorModelFactory(character),item?{padding:item.guardian||item.equipment.paired?36:24,palette:itemPalette(item),preserveAlpha:!!item.guardian,measureActions:['idle',...availableActions(item).map(key=>'item-'+key)]}:{})
    try{const play=new StagePlaytest(stage,character,actor,initial);if(item){play.item=item;play.ability.equip(item);const p=play.position;play.setTrainingTargets([{id:'near',rect:{x:p.x-30,y:p.y-64,width:18,height:22},kind:'training',eligible:true},{id:'far',rect:{x:p.x+12,y:p.y-116,width:24,height:24},kind:'training',eligible:true},{id:'wide',rect:{x:p.x-44,y:p.y-176,width:64,height:24},kind:'training',eligible:true}])}return play}catch(error){actor.dispose();throw error}
  }
  static async createForCreator(stage:StageDocument,pick:{appearance:ActorAppearance;previewModel:CreatorPreviewModel;name:string},initial:Point,options:PlaytestOptions={}){
    await prepareCreatorModel(pick.previewModel)
    const actor=new PixelActor(pick.appearance,CREATOR_FRAME.density,creatorModelFactory(pick.previewModel))
    try{return new StagePlaytest(stage,pick.previewModel==='yae'?'yae':'amber',actor,initial,{...options,name:options.name??pick.name})}catch(error){actor.dispose();throw error}
  }
  private add(rect:Rect,label:string){
    if(rect.width<=0||rect.height<=0)return
    const solid={rect,label};this.solids.push(solid)
    for(let x=Math.floor(rect.x/32);x<=Math.floor((rect.x+rect.width)/32);x++)for(let y=Math.floor(rect.y/32);y<=Math.floor((rect.y+rect.height)/32);y++){
      const key=x+','+y;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key)!.push(solid)
    }
  }
  private buildSolids(){
    const w=this.stage.width*32,h=this.stage.height*32
    if(this.stage.shell){
      this.add({x:0,y:0,width:w,height:64},'Back wall');this.add({x:0,y:0,width:16,height:h},'Left wall');this.add({x:w-16,y:0,width:16,height:h},'Right wall')
      const door=(Math.floor(this.stage.width/2)-1)*32
      this.add({x:0,y:h-12,width:door,height:12},'Front wall');this.add({x:door+64,y:h-12,width:w-door-64,height:12},'Front wall')
    }
    for(const object of this.stage.objects){
      const asset=assetsById[object.asset],view=assetView(object)
      if(asset.furniture){
        if(!asset.furniture.blocking)continue
        const placement:Placement={id:object.id,item:asset.furniture.id,x:(object.x-16)/32,y:(object.y-32)/32,rotation:object.rotation,style:object.style}
        for(const rect of groundForState(view,this.objectStates[object.id]))this.add(worldRect(placement,rect),asset.label)
      }else this.add(footprint(object),asset.label)
    }
    for(let y=0;y<this.stage.height;y++)for(let x=0;x<this.stage.width;x++)if((this.stage.tiles[x+','+y]??this.stage.baseTile)==='terrain:17')this.add({x:x*32,y:y*32,width:32,height:32},'Water')
  }
  private obstruction(point:Point){
    const foot=footRect(point),w=this.stage.width*32,h=this.stage.height*32
    if(foot.x<0||foot.y<0||foot.x+foot.width>w||foot.y+foot.height>h)return 'Stage boundary'
    for(let x=Math.floor(foot.x/32);x<=Math.floor((foot.x+foot.width)/32);x++)for(let y=Math.floor(foot.y/32);y<=Math.floor((foot.y+foot.height)/32);y++)for(const solid of this.cells.get(x+','+y)??[])if(intersects(foot,solid.rect))return solid.label
    return ''
  }
  private findSpawn(preferred:Point):Point|null{
    const point={x:Math.max(5,Math.min(this.stage.width*32-5,preferred.x)),y:Math.max(6,Math.min(this.stage.height*32,preferred.y))}
    if(!this.obstruction(point))return point
    const range=Math.max(this.stage.width,this.stage.height)*32
    for(let r=8;r<=range;r+=8)for(let delta=-r;delta<=r;delta+=8)for(const candidate of [{x:point.x+delta,y:point.y-r},{x:point.x+delta,y:point.y+r},{x:point.x-r,y:point.y+delta},{x:point.x+r,y:point.y+delta}])if(!this.obstruction(candidate))return candidate
    return null
  }
  private buildTargets(){
    for(const object of this.stage.objects){
      const base=assetsById[object.asset].furniture
      if(!base)continue
      const kind=base.interaction==='sit'?'sit':base.interaction==='sleep'||base.interaction==='rest'?'rest':null
      if(!kind)continue
      const view=assetView(object),placement:Placement={id:object.id,item:base.id,x:(object.x-16)/32,y:(object.y-32)/32,rotation:object.rotation,style:object.style}
      for(const seat of view.geometry.seats){
        const point=worldPoint(placement,seat.point),exit=worldPoint(placement,seat.exit)
        const approaches=[exit,...view.geometry.approaches.map(p=>worldPoint(placement,p))]
        const facing=Math.max(0,directions.indexOf(seat.facing)),turn=Math.round(object.rotation/45)
        this.targets.push({object,seatId:seat.id,label:base.label,kind,point,exit,approaches,direction:directions[(facing+turn)%8],elevation:object.elevation+seat.elevation})
      }
    }
  }
  /** Refresh native contacts after local furniture rotation without rebuilding actors. */
  refreshFurnitureContacts(){
    const previous=this.plan,held=this.heldPose
    if(!held)this.interactions.cancel()
    this.solids.length=0;this.cells.clear();this.targets=[];this.buildSolids();this.buildTargets()
    const target=previous&&this.targets.find(row=>row.object.id===previous.target.object.id&&row.seatId===previous.target.seatId)
    if(held&&target){
      const clear=target.approaches.filter(point=>!this.obstruction(point))
      const approach=clear[0]
      if(!approach){this.interactions.cancel();return}
      this.plan={target,approach,exit:!this.obstruction(target.exit)?target.exit:approach}
      Object.assign(this.position,target.point);this.direction=target.direction;this.signature=''
    }else{
      const safe=this.findSpawn(this.position)
      if(safe){Object.assign(this.position,safe);this.lastSafe={...safe}}
      if(target)this.beginInteraction(target)
    }
  }
  private nearby(){
    let closest:SeatTarget|null=null,best=96
    for(const target of this.targets){if(this.claims.has(this.key(target))&&this.claims.get(this.key(target))!==this.actorId)continue;const distance=Math.hypot(target.point.x-this.position.x,target.point.y-this.position.y);if(distance<best){best=distance;closest=target}}
    return closest
  }
  private nearbyObject(){
    return this.stage.objects.filter(object=>assetsById[object.asset].furniture?.geometry.actions.some(action=>action==='toggle_door'||action==='toggle_light')).map(object=>({object,label:assetsById[object.asset].label})).sort((a,b)=>Math.hypot(a.object.x-this.position.x,a.object.y-this.position.y)-Math.hypot(b.object.x-this.position.x,b.object.y-this.position.y)).find(row=>Math.hypot(row.object.x-this.position.x,row.object.y-this.position.y)<96)
  }
  useObject(objectId:string){
    if(this.interactions.active)return false
    const object=this.stage.objects.find(row=>row.id===objectId),asset=object&&assetsById[object.asset]
    if(!object||!asset?.furniture?.geometry.actions.some(action=>action==='toggle_door'||action==='toggle_light'))return false
    const action=asset.furniture.geometry.actions.includes('toggle_door')?'toggle_door':'toggle_light'
    const view=assetView(object),placement:Placement={id:object.id,item:asset.furniture.id,x:(object.x-16)/32,y:(object.y-32)/32,rotation:object.rotation}
    const clear=(point:Point)=>!this.obstruction(point)
    const approaches=view.geometry.approaches.map(point=>worldPoint(placement,point)).filter(clear).sort((a,b)=>Math.hypot(a.x-this.position.x,a.y-this.position.y)-Math.hypot(b.x-this.position.x,b.y-this.position.y))
    for(const approach of approaches){
      const path=interactionPath(this.position,approach,clear);if(!path)continue
      const opening=!this.objectStates[object.id]?.open,lighting=this.objectStates[object.id]?.lit===false
      this.feedback=''
      this.interactions.start({target:object.id,label:asset.label,action,point:approach,lookAt:{x:object.x,y:object.y-8},path,duration:350,local:true,onComplete:()=>{
        if(action==='toggle_door'&&!opening&&this.occupants().some(point=>view.geometry.ground.some(rect=>intersects(footRect(point),worldRect(placement,rect))))){this.feedback='Wait until the doorway is clear before closing it.';return false}
        this.objectStates[object.id]={...this.objectStates[object.id],...(action==='toggle_door'?{open:opening}:{lit:lighting})}
        this.feedback=action==='toggle_door'?(opening?'Door opened.':'Door closed.'):(lighting?'Candles lit.':'Candles extinguished.');return true
      }},this.elapsed*1000)
      this.objectTarget={object,label:asset.label};return true
    }
    this.feedback='The approach is blocked. Clear a side of the furniture.';return false
  }
  prompt():PlayInteractionPrompt|null{
    const door=this.objectTarget??this.nearbyObject()
    if(door&&assetsById[door.object.asset].furniture?.geometry.actions.includes('toggle_light'))return {target:door.object.id,label:door.label,kind:'light',button:this.interactions.active?'Cancel':this.objectStates[door.object.id]?.lit===false?'Turn on':'Turn off',description:this.feedback||'Press E to switch the light.',disabled:false}
    if(door)return {target:door.object.id,label:door.label,kind:'door',button:this.interactions.active?'Cancel':this.objectStates[door.object.id]?.open?'Close door':'Open door',description:this.feedback||'Press E to use the door. Its frame stays solid.',disabled:false}
    const active=this.interactions.active,target=this.plan?.target??this.nearby()
    if(!target)return null
    if(active)return {target:target.object.id,label:target.label,kind:target.kind,disabled:false,button:this.heldPose?(target.kind==='rest'?'Wake up':'Stand up'):'Cancel',description:this.heldPose?(target.kind==='rest'?'Sleeping · press E or move to wake up.':'Seated · press E or move to stand up.'):(active.phase==='approach'?'Walking to an open approach…':'Getting into position…')}
    const blocked=!target.approaches.some(point=>!this.obstruction(point))
    return {target:target.object.id,label:target.label,kind:target.kind,button:target.kind==='rest'?'Sleep':'Sit down',disabled:blocked,description:blocked?'Clear an approach in Edit to use this furniture.':this.feedback||'Press E or choose the action to approach.'}
  }
  interact(){
    if(this.interactions.active){this.interactions.cancel();this.feedback='';return}
    const door=this.nearbyObject();if(door){this.useObject(door.object.id);return}
    const target=this.nearby();if(!target)return
    this.beginInteraction(target)
  }
  private key(target:SeatTarget){return target.object.id+'/'+target.seatId}
  sitOn(objectId:string,seatId:string){
    const target=this.targets.find(row=>row.object.id===objectId&&row.seatId===seatId)
    if(!target){this.feedback='That seat is unavailable.';return false}
    return this.beginInteraction(target)
  }
  private beginInteraction(target:SeatTarget){
    const owner=this.claims.get(this.key(target))
    if(owner&&owner!==this.actorId){this.feedback='That seat is occupied. Choose the other seat.';return false}
    if(this.plan?.target===target&&this.interactions.active)return true
    this.interactions.cancel()
    const clear=(point:Point)=>!this.obstruction(point)
    const approaches=target.approaches.filter(clear).sort((a,b)=>Math.hypot(a.x-this.position.x,a.y-this.position.y)-Math.hypot(b.x-this.position.x,b.y-this.position.y))
    for(const approach of approaches){
      const path=interactionPath(this.position,approach,clear);if(!path)continue
      const exit=clear(target.exit)&&clearSegment(approach,target.exit,clear)?target.exit:approach
      this.claims.set(this.key(target),this.actorId)
      this.plan={target,approach:{...approach},exit:{...exit}};this.feedback=''
      this.interactions.start({target:target.object.id,label:target.label,action:target.kind,point:approach,lookAt:target.point,path,duration:250,local:true,held:true,onComplete:()=>true},this.elapsed*1000)
      return true
    }
    this.feedback='The approach is blocked. Try another side or move furniture in Edit.'
    return false
  }
  private releasePose(){
    if(this.plan&&this.claims.get(this.key(this.plan.target))===this.actorId)this.claims.delete(this.key(this.plan.target))
    const exit=this.heldPose?(this.plan?.exit??this.lastSafe):!this.obstruction(this.position)?this.position:this.lastSafe
    const safe=!this.obstruction(exit)?exit:!this.obstruction(this.lastSafe)?this.lastSafe:this.findSpawn(exit)
    if(safe)Object.assign(this.position,safe)
    this.velocity={x:0,y:0};this.lastSafe={...this.position};this.plan=null;this.heldPose=null;this.objectTarget=null;this.gesture=null;this.path=[];this.moving=false;this.running=false;this.signature=''
  }
  get handoffPosition(){return this.heldPose&&this.plan?this.plan.exit:this.position}
  get renderDepth(){return this.heldPose&&this.plan?depthOf(this.plan.target.object)+.5+this.plan.target.point.y*.0001:this.position.y}
  get foregroundTarget(){return this.heldPose&&this.plan?this.plan.target.object.id:null}
  stand(){this.interactions.cancel();this.feedback=''}
  report(){return {name:this.name,x:Math.round(this.position.x),y:Math.round(this.position.y),seated:!!this.heldPose,seatId:this.plan?.target.seatId??null,phase:this.interactions.active?.phase??'idle',message:this.feedback,contact:this.contact}}
  objectState(id:string){return this.objectStates[id]}
  respawn(){this.velocity={x:0,y:0};this.renderAction='';this.fromAction='';this.interactions.cancel();this.feedback='';const spawn=this.findSpawn({x:this.stage.width*16,y:this.stage.height*32-64});if(spawn){Object.assign(this.position,spawn);this.lastSafe={...spawn};this.contact='';this.moving=false;this.signature=''}}
  tick(delta:number,input:Point,sprint:boolean){
    const signature=JSON.stringify(this.objectStates)
    if(signature!==this.stateSignature){this.stateSignature=signature;this.solids.length=0;this.cells.clear();this.buildSolids()}
    const frameMs=Math.max(0,Math.min(delta,40)),pause=Math.min(frameMs,this.hitPause);this.hitPause-=pause
    const dt=(frameMs-pause)/1000;this.elapsed+=dt;this.contact=''
    const activeCast=this.ability.snapshot().cast
    if(this.item){if(activeCast?.locked){input={x:0,y:0};this.velocity={x:0,y:0}}this.advanceItem(dt*1000)}
    const manual=Math.hypot(input.x,input.y)>.05
    if(manual){if(!activeCast)this.seekOrigin=null;if(this.interactions.active)this.interactions.cancel();this.feedback=''}
    if(this.interactions.locksMovement){this.velocity={x:0,y:0};this.yaw=-directions.indexOf(this.direction)*Math.PI/4;this.moving=false;this.running=false;this.interactions.step(this.elapsed*1000,this.position,this.path.length===0);return}
    while(this.path.length&&Math.hypot(this.path[0].x-this.position.x,this.path[0].y-this.position.y)<1)this.path.shift()
    const goal=!manual&&!activeCast?.locked?this.path[0]:undefined
    const intent=goal?{x:goal.x-this.position.x,y:goal.y-this.position.y}:input
    const target=movementVector(intent.x,intent.y,manual&&sprint)
    target.x*=STUDIO_LOCOMOTION.speedMultiplier;target.y*=STUDIO_LOCOMOTION.speedMultiplier
    this.velocity=approachVelocity(this.velocity,target,dt)
    let dx=this.velocity.x*dt,dy=this.velocity.y*dt
    if(goal&&Math.hypot(dx,dy)>Math.hypot(intent.x,intent.y)){dx=intent.x;dy=intent.y}
    const before={...this.position}
    this.moveGround(dx,dy)
    const distance=Math.hypot(this.position.x-before.x,this.position.y-before.y)
    this.moving=distance>.001;this.running=manual&&sprint&&this.moving
    if(intent.x||intent.y)this.direction=sector(intent.x,intent.y)
    const facing=activeCast?.actor.direction??this.direction
    this.yaw=approachFacing(this.yaw,-directions.indexOf(facing)*Math.PI/4,dt)
    if(this.moving)this.stride=(this.stride+distance/(this.running?STUDIO_LOCOMOTION.runCycleDistance:STUDIO_LOCOMOTION.walkCycleDistance))%1
    if(!this.obstruction(this.position))this.lastSafe={...this.position}
    while(this.path.length&&Math.hypot(this.path[0].x-this.position.x,this.path[0].y-this.position.y)<1)this.path.shift()
    this.interactions.step(this.elapsed*1000,this.position,this.path.length===0)
  }
  private prepareSprite(){
    const cast=this.ability.snapshot().cast,action=cast?'item-'+cast.key:this.heldPose??this.gesture??(this.moving?(this.running?'run':'walk'):'idle'),clip=humanClips[action]??humanClips.idle,count=clip.frames??8
    const phase=cast?cast.elapsed/cast.duration:this.moving?this.stride:((this.elapsed-(this.heldPose?this.poseStarted:0))*clip.fps/count)%1
    const frame=Math.floor(phase*count)%count,secondary=Math.floor((this.elapsed%2.4)/2.4*64)/64
    if(action!==this.renderAction){
      this.fromAction=this.renderAction;this.fromPhase=this.renderPhase
      this.renderAction=action;this.transitionStarted=this.elapsed
    }
    const transition=Math.min(1,(this.elapsed-this.transitionStarted)*1000/STUDIO_LOCOMOTION.blendMs)
    if(transition>=1)this.fromAction=''
    const facing=cast?.actor.direction??this.direction
    const playback={yaw:Math.round(this.yaw/(Math.PI/24))*(Math.PI/24),fromAction:this.fromAction||undefined,fromPhase:Math.floor(this.fromPhase*64)/64,transition:Math.round(transition*16)/16}
    const gait=this.running?'run':'walk',locomotion=cast&&this.moving?Math.floor(this.stride*64)/64*(humanClips[gait].frames??8):undefined
    const signature=[action,facing,frame,Math.floor(phase*64),secondary,locomotion,JSON.stringify(playback)].join(':')
    if(signature!==this.signature){
      this.sprite.getContext('2d')!.putImageData(this.actor.frame(action,facing,frame,locomotion,gait,Math.floor(phase*64)/64,{phase:secondary,locomotion:this.moving?1:0},playback),0,0)
      this.signature=signature
    }
    this.renderPhase=phase
  }
  draw(context:CanvasRenderingContext2D){
    this.prepareSprite()
    const snapshot=this.ability.snapshot(),socket=this.actor.projectedSocket('grip')
    const hand=socket?{x:this.position.x+socket.x,y:this.position.y+socket.y}:undefined
    const solids=this.solids.map(s=>s.rect)
    this.effects.drawChain(context,snapshot,hand,solids,'back')
    const{x}=this.position,y=this.position.y-(this.heldPose&&this.plan?this.plan.target.elevation:0)
    context.save();if(!this.heldPose){context.fillStyle='#27342644';context.beginPath();context.ellipse(Math.round(x),Math.round(y)-1,7,3,0,0,Math.PI*2);context.fill()}context.imageSmoothingEnabled=false
    context.drawImage(this.sprite,Math.round(x-this.actor.bounds.anchor.x),Math.round(y-this.actor.bounds.anchor.y),this.actor.bounds.width,this.actor.bounds.height);context.restore()
    this.effects.drawChain(context,snapshot,hand,solids,'front')
  }
  drawItemWorld(context:CanvasRenderingContext2D,debug=false,key:ActionKey='primary'){
    if(!this.item)return
    const snapshot=this.ability.snapshot(),origin=snapshot.cast?.actor.position??this.position,direction=forward(snapshot.cast?.actor.direction??this.direction),action=getAction(this.item,snapshot.cast?.key??key)
    if(debug){
      context.save();context.fillStyle='#72e4ac20';const radius=action.area.range+action.area.width+action.area.offset;for(let y=Math.max(0,Math.floor((origin.y-radius)/32));y<Math.min(this.stage.height,Math.ceil((origin.y+radius)/32));y++)for(let x=Math.max(0,Math.floor((origin.x-radius)/32));x<Math.min(this.stage.width,Math.ceil((origin.x+radius)/32));x++){const tile={x:x*32,y:y*32,width:32,height:32};if(areaHits(origin,direction,action.area,tile)&&clearSight(origin,tile,this.solids.map(s=>s.rect)))context.fillRect(tile.x+1,tile.y+1,30,30)}context.restore()
      drawArea(context,origin,direction,action.area);context.save();context.lineWidth=1;for(const target of this.trainingTargets){const hit=areaHits(origin,direction,action.area,target.rect),clear=clearSight(origin,target.rect,this.solids.map(s=>s.rect));context.strokeStyle=target.eligible&&hit&&clear?'#83efb0':'#bcae90';context.strokeRect(target.rect.x,target.rect.y,target.rect.width,target.rect.height)}for(const p of snapshot.projectiles){context.save();context.translate(p.position.x,p.position.y);context.rotate(Math.atan2(p.forward.y,p.forward.x));context.strokeStyle='#8be8fa';context.strokeRect(-p.spec.depth/2,-p.spec.width/2,p.spec.depth,p.spec.width);context.restore()}context.restore()}
    for(const target of this.trainingTargets){const p=center(target.rect),flash=snapshot.time-(this.hitTimes.get(target.id)??-1000)<160;context.save();context.fillStyle=flash?'#fff6c2':'#ba8151';context.fillRect(p.x-2,p.y-5,4,11);context.fillStyle=flash?'#fff6c2':'#a04e36';context.fillRect(target.rect.x,target.rect.y,target.rect.width,target.rect.height-5);context.strokeStyle='#4b302b';context.strokeRect(target.rect.x+.5,target.rect.y+.5,target.rect.width-1,target.rect.height-5);context.fillStyle='#f9ddb2';context.fillRect(p.x-3,p.y-8,6,6);context.font='10px sans-serif';context.textAlign='center';context.fillStyle='#fff2d5';context.fillText(String(this.hitCounts.get(target.id)??0),p.x,target.rect.y-4);context.restore()}
    this.effects.draw(context,snapshot)
  }
  drawDiagnostics(context:CanvasRenderingContext2D,scale:number){
    context.save();context.lineWidth=1/scale
    for(const solid of this.solids){context.strokeStyle=solid.label===this.contact?'#ffb563':'#ff898280';context.strokeRect(solid.rect.x,solid.rect.y,solid.rect.width,solid.rect.height)}
    if(this.plan){context.strokeStyle='#8bcfff';context.beginPath();context.arc(this.plan.approach.x,this.plan.approach.y,4,0,Math.PI*2);context.moveTo(this.plan.approach.x,this.plan.approach.y);context.lineTo(this.plan.target.point.x,this.plan.target.point.y);context.stroke();context.strokeRect(this.plan.exit.x-3,this.plan.exit.y-3,6,6)}
    const foot=footRect(this.position);context.fillStyle=this.contact?'#ffb56380':'#70f8c180';context.fillRect(foot.x,foot.y,foot.width,foot.height);context.strokeStyle=this.contact?'#ffb563':'#70f8c1';context.strokeRect(foot.x,foot.y,foot.width,foot.height);context.restore()
  }
  status(){return `${this.name} · ${Math.round(this.position.x)}, ${Math.round(this.position.y)} px · ${this.heldPose?(this.heldPose==='sleep'?'Sleeping':'Seated')+' · '+(this.plan?.target.label??''):this.interactions.active?'Approaching '+this.plan?.target.label:this.feedback|| (this.contact?'Contact: '+this.contact:this.moving?(this.running?'Running':'Walking'):'Idle')}`}
  dispose(){ultimateCutIn.clear(this.cutInSource);this.ability.cancel('leave');this.effects.clear();if(!this.disposed){this.disposed=true;this.interactions.cancel();this.actor.dispose()}}
}
