import {trainingSword} from './sword-pilot'
import {itemId,type ActionKey,type ItemAction,type ItemDocument} from './document'
import {spectralBladeTexture} from './spectral-art'
import icons from './spectral-icons.json'

/** Original weapon and rehearsal moveset, guided by the owner's spectral-guardian video. */
export function spectralSwordsman():ItemDocument{
 const base=trainingSword()
 const descriptions:Record<ActionKey,string>={
  primary:'Slash with your twin blades, followed by a delayed strike from the guardian. Press J again during the combo window to chain a crosscut and finisher.',
  combo2:'Continue the combo with a crossing blade strike as the guardian follows through. Press J again during the combo window for the finisher.',
  combo3:'Finish the sequence with a stronger spectral follow-up that pushes nearby targets away.',
  running:'Advance a short distance with a pursuing slash. The guardian follows with a wider blade sweep. Movement stops at obstacles.',
  extend:'Release a spectral blade wave straight ahead. The wave can pass through targets and stops at walls or when its range runs out.',
  special:'Call on the guardian to sweep a wide circle around you, knocking nearby targets back as a golden halo appears. You remain stationary during the ultimate.',
 }
 const move=(key:ActionKey,name:string,duration:number,special=false):ItemAction=>{
  const source=structuredClone(special?base.actions.special:base.actions.primary),ratio=duration/source.duration
  const windup=Math.round(duration*.24),activeEnd=Math.round(duration*.65)
  const action:ItemAction={...source,id:itemId(),name,description:descriptions[key],duration,windup,activeEnd,
   cooldown:key==='special'?4200:key==='extend'?1500:300,lockMovement:key==='special',
   frames:source.frames.map(f=>({...f,id:itemId(),time:f.time*ratio})),
   itemFrames:[{time:0,rotation:[0,0,0]},{time:windup,rotation:[0,0,95]},{time:windup+90,rotation:[0,0,-35]},{time:duration,rotation:[0,0,0]}],
   rootMotion:{distance:key==='running'?14:key==='special'?0:5,start:windup,end:activeEnd},
   area:{kind:key==='special'?'circle':'arc',range:key==='special'?112:96,width:80,angle:key==='special'?360:150,offset:8},
   melee:key!=='extend',projectile:{...source.projectile,speed:240,width:64,range:240},
   events:[{id:itemId(),time:windup,kind:'sound',color:'#cf87f5',size:64,lifetime:220,sound:'swing'},
    {id:itemId(),time:windup+25,kind:key==='extend'?'projectile':key==='special'?'burst':'trail',color:'#dd68c0',size:key==='special'?160:96,lifetime:320,sound:key==='extend'?'wave':'swing'},
    {id:itemId(),time:Math.round(duration*.5),kind:'burst',color:'#c998fa',size:key==='special'?176:72,lifetime:220,sound:'impact'}],
   hitWindows:key==='extend'?[]:[
    {id:'blade',start:windup,end:windup+80,knockback:3,area:{kind:'arc',range:64,width:56,angle:125,offset:8}},
    {id:'guardian',start:Math.round(duration*.47),end:activeEnd,knockback:key==='special'?12:6,area:{kind:key==='special'?'circle':'arc',range:key==='special'?112:104,width:88,angle:key==='special'?360:160,offset:8}},
   ],hitStop:key==='special'?36:22}
  if(key==='primary'||key==='combo2')action.combo={next:key==='primary'?'combo2':'combo3',open:Math.round(duration*.4),close:Math.round(duration*.83),buffer:180}
  return action
 }
 const parts=base.parts.map(part=>({...part,color:part.id==='grip'?'#32203b':part.id==='guard'?'#9e78bd':'#cf69aa',
  ...(['blade','tip','fuller'].includes(part.id)?{texture:spectralBladeTexture}:{}),
  ...(part.id==='blade'?{scale:[2.4,19,.9] as [number,number,number],position:[0,12,0] as [number,number,number]}:{}),
  ...(part.id==='tip'?{position:[0,23.5,0] as [number,number,number]}:{}),
  ...(part.id==='edge'?{color:'#ffe1f5',scale:[.3,19,.12] as [number,number,number],position:[-.95,12,.5] as [number,number,number]}:{})}))
 parts.push({id:'guard-gem',name:'Magenta guard crystal',shape:'sphere',position:[0,2,1.3],scale:[1.5,1.9,.7],rotation:[0,0,0],color:'#ed79d1',visible:true})
 for(const side of [-1,1])parts.push({id:'guard-wing-'+side,name:'Swept crossguard '+side,shape:'cone',position:[side*3.2,1.9,0],scale:[1.5,3.2,1.4],rotation:[0,0,side*82],color:'#9e78bd',visible:true})
 return{...base,id:'spectral-swordsman-v1',name:'Spectral swordsman',idleChain:false,parts,icons,
  guardian:{kind:'spectral-swordsman',scale:1,opacity:.78,offset:[0,8,-15]},
  equipment:{socket:'WristRight',position:[0,-.2,1.2],rotation:[0,0,-118],pivot:[0,0,0],tip:[0,25.3,0]},
  actions:{primary:move('primary','Twin-blade strike',620),combo2:move('combo2','Guardian crosscut',680),combo3:move('combo3','Spectral finisher',820),running:move('running','Pursuing slash',660),extend:move('extend','Spectral wave',850,true),special:move('special','Guardian circle',1100,true)}}
}
