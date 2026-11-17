import {trainingSword} from './sword-pilot'
import {itemId,type ItemAction,type ItemDocument,type ItemPart,type ActionKey,type HitArea} from './document'
import type {Triple} from '../skin-studio/model-document'
import icons from './chain-icons.json'
import weaponIcons from './weapon-icons.json'
const color='#bd83fa'
const descriptions:Record<ActionKey,string>={
 primary:'Sweep the moonstone chain across the front. Press J again during the combo window to follow with a reverse swing and a wider finisher.',
 combo2:'Reverse the chain into a crossing sweep. Press J during the combo window to continue into the crescent finisher.',
 combo3:'Finish the sequence with a wider crescent sweep that pushes targets back farther.',
 running:'Surge forward a short distance while sweeping the chain ahead. Obstacles stop the advance, and manual movement is controlled by the skill.',
 extend:'Send the weighted chain far ahead in a narrow line, then draw it back into its hovering coil. Targets must be within the moving chain’s reach.',
 special:'Whirl the chain around you in three full orbits. Each swing can hit nearby targets, with a stronger final push. Manual movement is locked during the ultimate.',
}
function part(id:string,name:string,shape:ItemPart['shape'],position:Triple,scale:Triple,color:string):ItemPart{return{id,name,shape,position,scale,color,rotation:[0,0,0],visible:true}}
/** Original Moonvine training chain, inspired by the reference's moveset structure. */
export function chainWeapon():ItemDocument {
 const sword=trainingSword()
 const make=(key:ActionKey,duration:number,reach:number,mode:'sweep'|'thrust'|'orbit',angle:number,reverse=false):ItemAction=>{
  const action=structuredClone(sword.actions.primary)
  action.id=itemId();action.name=({primary:'Mooncut · 1',combo2:'Backlash · 2',combo3:'Crescent finisher',running:'Running sweep',extend:'Reaching chain',special:'Moonvine circle'})[key]
  action.description=descriptions[key]
  action.duration=duration;action.cooldown=key==='special'?1800:key==='extend'?900:key==='running'?800:650
  action.windup=key==='running'?110:duration*.26
  action.activeEnd=duration*.72
  action.area={kind:mode==='orbit'?'circle':mode==='thrust'?'capsule':'arc',range:reach,width:18,angle:mode==='orbit'?360:angle,offset:0}
  action.frames=action.frames.map(frame=>{
   const pose=structuredClone(frame.pose),phase=frame.time/.6
   if(reverse){const rotation=pose.angles.SpineBend;if(rotation)rotation[1]*=-1;const arm=pose.angles.ShoulderRight;if(arm)arm[1]*=-1}
   if(key==='combo3'&&phase>.1&&phase<.8){
    const spine=pose.angles.SpineBend;if(spine)spine[0]+=7
    const arm=pose.angles.ShoulderRight;if(arm)arm[0]-=20
   }
   if(key==='extend'&&phase>.2&&phase<.7){pose.angles.ShoulderRight=[-95,0,-5];pose.angles.ElbowRight=[-8,0,0];pose.angles.SpineBend=[12,0,0]}
   if(key==='special'){pose.angles.ShoulderRight=[-75,Math.sin(phase*Math.PI*2)*30,-20];pose.angles.ElbowRight=[-35,0,0];pose.angles.ShoulderLeft=[-55,0,-16];pose.angles.SpineBend=[5,Math.sin(phase*Math.PI*2)*25,0];pose.angles.HipLeft=[-10,0,0];pose.angles.HipRight=[-10,0,0];pose.angles.KneeLeft=[20,0,0];pose.angles.KneeRight=[20,0,0];pose.angles.AnkleLeft=[-10,0,0];pose.angles.AnkleRight=[-10,0,0]}
   return{id:itemId(),time:frame.time/.6*duration/1000,pose}
  })
  action.itemFrames=action.itemFrames.map(frame=>({time:frame.time/600*duration,rotation:frame.rotation.map(n=>reverse?-n:n) as Triple}))
  action.rootMotion={distance:key==='running'?24:key==='special'?0:key==='combo3'?14:8,start:duration*.17,end:duration*.48}
  if(key==='running'){action.mask=action.mask.filter(joint=>!['HipLeft','HipRight','KneeLeft','KneeRight','AnkleLeft','AnkleRight'].includes(joint));action.rootMotion={distance:24,start:0,end:duration*.7}}
  action.chain={mode,reach,angle,reverse,start:duration*.12,end:duration*.87,color,segments:mode==='orbit'?32:24,width:8}
  action.hitStop=key==='combo3'?55:key==='special'?24:38
  const window=(id:string,start:number,end:number,area:HitArea,knockback:number)=>({id,start,end,area:{...area},knockback})
  action.hitWindows=key==='special'?[
   window('orbit-one',210,370,action.area,3),window('orbit-two',490,650,action.area,3),window('orbit-three',780,950,action.area,7),
  ]:[window('strike',action.windup,action.activeEnd,action.area,key==='combo3'?16:8)]
  action.events=[{id:itemId(),time:action.windup-12,kind:'sound',color,size:reach,lifetime:230,sound:'swing'},{id:itemId(),time:action.windup,kind:'trail',color,size:reach,lifetime:210,sound:'swing'}]
  if(key==='special')action.activeEnd=950
  if(key==='special')action.events.push({id:itemId(),time:440,kind:'sound',color,size:reach,lifetime:200,sound:'wave'},{id:itemId(),time:660,kind:'burst',color,size:reach,lifetime:330,sound:'wave'})
  return action
 }
 const primary=make('primary',520,78,'sweep',160)
 primary.combo={next:'combo2',open:180,close:400,buffer:170}
 const combo2=make('combo2',520,88,'sweep',175,true)
 combo2.combo={next:'combo3',open:180,close:400,buffer:170}
 return{format:'pawtrail-item',version:1,id:'moonvine-chain-v1',name:'Moonvine chain',weaponIcon:weaponIcons['moonvine-chain-v1'],idleChain:true,icons,meshEdits:[],equipment:{socket:'WristRight',position:[0,-.2,1.2],rotation:[0,0,-12],pivot:[0,0,0],tip:[0,9,0]},parts:[
  part('grip','Wrapped chain grip','cylinder',[0,0,0],[2,5,2],'#5d3d51'),
  part('guard','Violet guard','sphere',[0,3,0],[3.4,1.5,3],'#846095'),
  part('pommel','Moonstone pommel','sphere',[0,-3,0],[2.5,2.5,2.5],'#d5b9ed'),
  ...[0,1,2].map(i=>part('deployed-link-'+i,'Resting chain link '+(i+1),'box',[0,4+i*1.3,0],[i%2?1.5:.6,1.7,i%2?.6:1.5],'#9d8caa')),
  part('deployed-head','Crescent weight','sphere',[0,9,0],[4.5,4.5,4.5],'#8c57bb'),
  part('deployed-glint','Weight glint','box',[-.7,9.7,2],[1.2,1.4,.3],'#f6dfb7'),
 ],actions:{primary,combo2,combo3:make('combo3',660,104,'sweep',250),running:make('running',650,110,'sweep',170),extend:make('extend',800,156,'thrust',20),special:make('special',1150,104,'orbit',1080)}}
}
