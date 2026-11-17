import art from './hammer-art.json'
import {trainingSword} from './sword-pilot'
import {itemId,type ItemAction,type ItemDocument,type ItemPart} from './document'
import type {StudioPose,Triple} from '../skin-studio/model-document'
const colors={gold:'#c89a4e',goldLight:'#f6d586',dark:'#4c3024',red:'#a62119',ruby:'#e13e2c'}
function part(id:string,name:string,shape:ItemPart['shape'],position:Triple,scale:Triple,color:string,texture?:string,textureLayout?:'box-2x2'):ItemPart{return{id,name,shape,position,scale,color,rotation:[0,0,0],visible:true,...(texture?{texture}:{}),...(textureLayout?{textureLayout}:{})}}
function heavyPose(raise:number,lean:number,turn:number,lead:number):StudioPose {
 const knee=Math.max(5,-lead*.8)
 return{root:[0,0,0],angles:{
  ShoulderRight:[raise,turn,-10],ElbowRight:[raise<-80?-65:-22,0,0],WristRight:[-8,0,0],
  ShoulderLeft:[raise*.8,-8,-22],ElbowLeft:[-70,0,0],WristLeft:[0,0,0],
  SpineBend:[lean,turn*.35,0],HipLeft:[lead,0,0],KneeLeft:[knee,0,0],AnkleLeft:[-lead-knee,0,0],
  HipRight:[4,0,0],KneeRight:[8,0,0],AnkleRight:[-12,0,0],
 }}
}
function hammerAction(special:boolean):ItemAction {
 const base=structuredClone(trainingSword().actions.primary),duration=special?1200:900
 base.id=itemId();base.name=special?'Ruby shockwave':'Hammer slam';base.duration=duration;base.cooldown=special?2200:1200
 base.windup=special?500:400;base.activeEnd=special?650:530
 base.rootMotion={distance:special?4:8,start:duration*.3,end:duration*.56}
 base.area={kind:'arc',range:64,width:56,angle:110,offset:8};base.melee=!special
 base.frames=[
  {id:itemId(),time:0,pose:heavyPose(-20,0,0,-2)},
  {id:itemId(),time:duration*.26/1000,pose:heavyPose(-108,-5,-28,5)},
  {id:itemId(),time:duration*.43/1000,pose:heavyPose(-145,-3,-18,-15)},
  {id:itemId(),time:duration*.55/1000,pose:heavyPose(-45,18,22,-28)},
  {id:itemId(),time:duration*.7/1000,pose:heavyPose(-30,12,25,-22)},
  {id:itemId(),time:duration/1000,pose:heavyPose(-20,0,0,-2)},
 ]
 base.itemFrames=[{time:0,rotation:[0,0,0]},{time:duration*.43,rotation:[0,0,15]},{time:duration*.55,rotation:[0,0,-22]},{time:duration,rotation:[0,0,0]}]
 base.projectile={speed:192,width:96,depth:18,range:160,lifetime:1000,pierce:true,stopAtWalls:true}
 base.hitStop=55
 base.events=[{id:itemId(),time:base.windup-25,kind:'sound',color:'#f0b569',size:64,lifetime:220,sound:'swing'},{id:itemId(),time:base.windup,kind:special?'projectile':'burst',color:'#ea9d5b',size:special?96:64,lifetime:280,sound:special?'wave':'impact'}]
 return base
}
/** AI-generated 2D artwork mapped to 3D surfaces, carried diagonally behind the torso. */
export function rubyHammer():ItemDocument {
 return{format:'pawtrail-item',version:1,id:'ruby-hammer-v1',name:'Gilded ruby hammer',idleChain:false,meshEdits:[],equipment:{socket:'WristRight',position:[0,0,1],rotation:[0,0,-8],pivot:[0,0,0],tip:[0,31,0],carry:{socket:'SpineBend',position:[2,-6,-7],rotation:[0,0,38]}},parts:[
  part('shaft','Textured wrapped shaft','cylinder',[0,9,0],[2,29,2],colors.dark,art.handle),
  part('pommel','Gold pommel','sphere',[0,-6,0],[3.1,2.5,3.1],colors.gold),
  part('collar-low','Lower gold collar','cylinder',[0,-3.8,0],[2.7,1.1,2.7],colors.goldLight),
  part('collar-high','Head shaft collar','cylinder',[0,13.6,0],[3.2,2,3.2],colors.gold),
  part('hammer-head','Painted ruby hammer head','box',[0,22,0],[16,17,8.5],colors.gold,art.atlas,'box-2x2'),
  part('rim-upper','Upper brass rim','box',[0,30.6,0],[16.6,.8,9],colors.goldLight),
  part('rim-lower','Lower brass rim','box',[0,13.4,0],[16.6,.8,9],colors.gold),
  part('ruby','Raised central ruby','sphere',[0,22,4.5],[3.2,3.5,1.3],colors.ruby),
  part('ruby-glint','Ruby glint','box',[-.6,22.7,5.15],[.7,.8,.15],'#ffe4b2'),
 ],actions:{primary:hammerAction(false),special:hammerAction(true)}}
}
