import type {StudioPose,Triple} from '../skin-studio/model-document'
import {itemId,type ItemDocument,type ItemAction,type ItemPart,type ItemEvent} from './document'
const part=(id:string,name:string,scale:[number,number,number],position:[number,number,number],color:string,shape:ItemPart['shape']='box'):ItemPart=>({id,name,shape,position,scale,rotation:[0,0,0],color,visible:true})
export function swordParts():ItemPart[]{return[
  part('grip','Leather grip',[1.4,3.2,1.4],[0,0,0],'#68452e'),
  ...[-1,0,1].map((y,i)=>part('wrap-'+i,'Grip binding '+(i+1),[1.6,.35,1.6],[0,y,0],'#cda45b')),
  part('pommel','Gold pommel',[2.1,1.3,1.8],[0,-2,0],'#e8ba64'),
  part('guard','Crossguard',[6.2,1.1,2.1],[0,2,0],'#e8ba64'),
  part('blade','Steel blade',[2,13.3,.8],[0,9.1,0],'#bed7db'),
  part('fuller','Blade fuller',[.45,12.4,.12],[0,9.1,.46],'#688c9a'),
  part('edge','Bright edge',[.32,12.8,.12],[-.8,9.1,.46],'#f7eed5'),
  part('tip','Sword tip',[2.8,3.6,.7],[0,17.4,0],'#d6e9e6','cone'),
]}
const ev=(time:number,kind:ItemEvent['kind'],sound:ItemEvent['sound'],size=64):ItemEvent=>({id:itemId(),time,kind,sound,color:'#91ead9',size,lifetime:260})
type SwingPose={lean?:number;turn?:number;arm?:Triple;elbow?:number;guard?:number;lead?:number;rear?:number;leadKnee?:number;rearKnee?:number}
function swingPose(p:SwingPose={}):StudioPose {
  const lead=p.lead??-2,rear=p.rear??-2,leadKnee=p.leadKnee??4,rearKnee=p.rearKnee??4
  return {root:[0,0,0],angles:{
    SpineBend:[p.lean??0,p.turn??0,0],
    ShoulderRight:p.arm??[-10,0,-8],ElbowRight:[p.elbow??-12,0,0],WristRight:[-5,0,0],
    ShoulderLeft:[p.guard??-8,0,-7],ElbowLeft:[-22,0,0],WristLeft:[0,0,0],
    HipLeft:[lead,0,0],KneeLeft:[leadKnee,0,0],AnkleLeft:[-lead-leadKnee,0,0],
    HipRight:[rear,0,0],KneeRight:[rearKnee,0,0],AnkleRight:[-rear-rearKnee,0,0],
  }}
}
function action(special:boolean):ItemAction {
  const duration=special?900:600
  const poses:{time:number;pose:StudioPose}[]=special?[
    {time:0,pose:swingPose()},
    {time:.16,pose:swingPose({lean:-4,turn:-22,arm:[-80,-30,26],elbow:-74,guard:-35,lead:8,rear:-16,rearKnee:28})},
    {time:.29,pose:swingPose({lean:3,turn:-12,arm:[-112,-12,20],elbow:-60,guard:-42,lead:-12,rear:8,leadKnee:20})},
    {time:.36,pose:swingPose({lean:12,turn:20,arm:[-64,55,-22],elbow:-18,guard:-28,lead:-24,rear:12,leadKnee:28,rearKnee:10})},
    {time:.48,pose:swingPose({lean:9,turn:25,arm:[-46,65,-28],elbow:-20,guard:-20,lead:-20,rear:10,leadKnee:24,rearKnee:12})},
    {time:.69,pose:swingPose({lean:3,turn:8,arm:[-23,18,-12],elbow:-22,lead:-10,rear:3,leadKnee:15,rearKnee:7})},
    {time:.9,pose:swingPose()},
  ]:[
    {time:0,pose:swingPose()},
    {time:.08,pose:swingPose({lean:-3,turn:-16,arm:[-66,-28,24],elbow:-65,guard:-25,lead:6,rear:-12,rearKnee:20})},
    {time:.145,pose:swingPose({lean:-2,turn:-28,arm:[-112,-42,32],elbow:-62,guard:-38,lead:-12,rear:8,leadKnee:20,rearKnee:8})},
    {time:.205,pose:swingPose({lean:11,turn:20,arm:[-62,48,-24],elbow:-15,guard:-18,lead:-25,rear:13,leadKnee:27,rearKnee:8})},
    {time:.275,pose:swingPose({lean:10,turn:34,arm:[-32,72,-38],elbow:-22,guard:8,lead:-22,rear:11,leadKnee:25,rearKnee:10})},
    {time:.36,pose:swingPose({lean:5,turn:21,arm:[-24,45,-26],elbow:-28,lead:-14,rear:5,leadKnee:19,rearKnee:9})},
    {time:.48,pose:swingPose({lean:1,turn:5,arm:[-15,12,-12],elbow:-20,lead:-7,rear:0,leadKnee:10,rearKnee:5})},
    {time:.6,pose:swingPose()},
  ]
  return {
    id:itemId(),name:special?'Rescue wave':'Training slash',duration,cooldown:special?2500:800,
    windup:special?300:150,activeEnd:special?340:280,lockMovement:true,
    rootMotion:{distance:special?6:10,start:special?260:125,end:special?380:255},
    mask:['SpineBend','ShoulderRight','ElbowRight','WristRight','ShoulderLeft','ElbowLeft','WristLeft','HipLeft','HipRight','KneeLeft','KneeRight','AnkleLeft','AnkleRight'],
    frames:poses.map(frame=>({id:itemId(),...frame})),
    itemFrames:[{time:0,rotation:[0,0,0]},{time:special?280:145,rotation:[0,0,12]},{time:special?365:225,rotation:[0,0,-26]},{time:special?600:390,rotation:[0,0,-8]},{time:duration,rotation:[0,0,0]}],
    area:{kind:'arc',range:64,width:48,angle:120,offset:8},melee:!special,
    projectile:{speed:192,width:96,depth:16,range:192,lifetime:1000,pierce:true,stopAtWalls:true},
    events:special?[ev(220,'sound','wave'),ev(300,'projectile','wave',96)]:[ev(145,'sound','swing'),ev(150,'trail','swing')],
  }
}
export function trainingSword():ItemDocument{return{format:'pawtrail-item',version:1,id:'training-sword-v1',name:'Training sword',parts:swordParts(),meshEdits:[],equipment:{socket:'WristRight',position:[0,-.2,1.2],rotation:[0,0,-12],pivot:[0,0,0],tip:[0,19.2,0]},actions:{primary:action(false),special:action(true)}}}
