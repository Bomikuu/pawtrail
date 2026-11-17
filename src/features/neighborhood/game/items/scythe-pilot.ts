import type {StudioPose,Triple} from '../skin-studio/model-document'
import {itemId,type ActionKey,type ItemAction,type ItemDocument,type ItemPart,type WeaponStance} from './document'
import art from './scythe-art.json'
import icons from './scythe-icons.json'
import weaponIcons from './weapon-icons.json'

export const scytheStance:WeaponStance={name:'Low crescent guard',walkWeight:.78,runWeight:.63,angles:{
 SpineBend:[2,0,-2],ShoulderRight:[-18,-10,18],ElbowRight:[-34,0,0],WristRight:[8,12,-5],
 ShoulderLeft:[-30,14,-20],ElbowLeft:[-48,0,0],WristLeft:[4,-12,8],
}}
const part=(id:string,name:string,shape:ItemPart['shape'],position:Triple,scale:Triple,surface:keyof typeof art,color='#ffffff',rotation:Triple=[0,0,0]):ItemPart=>({id,name,shape,position,scale,rotation,color,texture:art[surface],visible:true})

function scytheParts():ItemPart[]{
 const parts:ItemPart[]=[
  part('shaft-low','Lower silver staff','cylinder',[0,9,0],[.9,18,.9],'ivory'),
  part('shaft-high','Upper silver staff','cylinder',[0,25,0],[.8,14,.8],'ivory'),
  part('grip','Burgundy wrapped grip','cylinder',[0,0,0],[1.4,7,1.4],'leather'),
  ...[-3.5,3.5].map((y,i)=>part('grip-ring-'+i,'Bronze grip collar '+(i+1),'cylinder',[0,y,0],[1.9,.65,1.9],'bronze')),
  part('pommel','Pointed bronze pommel','cone',[0,-5.2,0],[2.2,3,1.7],'bronze','#ffffff',[0,0,180]),
  part('pommel-gem','Pommel turquoise','sphere',[0,-5,.95],[.9,1.1,.4],'crystal'),
  part('star','Bronze star collar','box',[0,32,0],[3.7,3.7,1.5],'bronze','#ffffff',[0,0,45]),
  part('collar-gem','Turquoise star center','sphere',[0,32,1],[1.5,1.5,.65],'crystal'),
  part('blade','Long ivory crescent','crescent',[13.5,32.8,0],[9,28,1.1],'ivory','#ffffff',[0,0,-90]),
 ]
 for(const [i,x,y,angle]of [[0,0,35,0],[1,0,29,180],[2,3,32,-90],[3,-3,32,90]])parts.push(part('star-point-'+i,'Bronze star point '+(i+1),'cone',[x,y,0],[1.8,4,1.25],'bronze','#ffffff',[0,0,angle]))
 for(let i=0;i<3;i++)parts.push(part('feather-'+i,'Ivory counterweight '+(i+1),'cone',[-3.5-i,30-i*.6,-.1],[1,6,.75],'ivory','#ffffff',[0,0,65+i*20]))
 for(let i=0;i<3;i++)parts.push({id:'rivet-'+i,name:'Dark blade rivet '+(i+1),shape:'sphere',position:[2+i*2,34+i*.6,.64],scale:[.48,.48,.18],rotation:[0,0,0],color:'#4f4b3e',visible:true})
 return parts
}

const descriptions:Record<ActionKey,string>={
 primary:'Sweep both ivory crescents across the front, then follow through with the second staff. Press J during the combo window to continue the sequence.',
 combo2:'Reverse the twin scythes into a crossing sweep. Press J again during the combo window to finish the sequence.',
 combo3:'Bring the paired crescents through a wider finishing sweep, pushing nearby targets back.',
 running:'Advance a short distance while sweeping the scythes ahead. Walls and furniture still block your movement.',
 extend:'Release a turquoise crescent wave ahead of you. It passes through targets and disappears at walls or when its range runs out.',
 special:'Sweep both scythes around you in two broad arcs, releasing a moon-colored burst and pushing nearby targets away. You remain stationary during the ultimate.',
}

function move(key:ActionKey,name:string,duration:number):ItemAction{
 const reverse=key==='combo2'?-1:1,ultimate=key==='special',wave=key==='extend'
 const pose=(lean=2,turn=0,right:Triple=[-18,-10,18],left:Triple=[-30,14,-20],elbow=-34):StudioPose=>({root:[0,0,0],angles:{...scytheStance.angles,SpineBend:[lean,turn,-2],ShoulderRight:right,ShoulderLeft:left,ElbowRight:[elbow,0,0],ElbowLeft:[elbow-12,0,0]}})
 const frames=[
  {time:0,pose:pose()},
  {time:.18,pose:pose(-4,-28*reverse,[-60,-28*reverse,26],[-55,30*reverse,-26],-68)},
  {time:.34,pose:pose(7,36*reverse,[-92,55*reverse,24],[-78,-50*reverse,-24],-22)},
  {time:.55,pose:pose(5,48*reverse,[-28,60*reverse,20],[-20,-35*reverse,-22],-28)},
  {time:.78,pose:pose(2,10*reverse,[-24,14,18],[-32,-14,-20],-34)},
  {time:1,pose:pose()},
 ].map(f=>({id:itemId(),time:f.time*duration/1000,pose:f.pose}))
 const windup=Math.round(duration*.23),activeEnd=Math.round(duration*.72)
 const action:ItemAction={id:itemId(),name,description:descriptions[key],duration,
  cooldown:ultimate?5000:wave?1600:key==='running'?1200:350,windup,activeEnd,lockMovement:ultimate,
  rootMotion:{distance:key==='running'?12:ultimate||wave?0:3,start:windup,end:Math.round(duration*.54)},
  mask:Object.keys(scytheStance.angles) as ItemAction['mask'],frames,
  itemFrames:[{time:0,rotation:[0,0,0]},{time:windup,rotation:[0,12,-72*reverse]},{time:Math.round(duration*.41),rotation:[0,-16,48*reverse]},{time:Math.round(duration*.64),rotation:[0,10,ultimate?-100*reverse:20*reverse]},{time:duration,rotation:[0,0,0]}],
  area:{kind:ultimate?'circle':'arc',range:ultimate?112:96,width:88,angle:ultimate?360:155,offset:8},melee:!wave,
  projectile:{speed:224,width:72,depth:16,range:224,lifetime:1200,pierce:true,stopAtWalls:true},
  hitWindows:wave?[]:[{id:'first-crescent',start:windup+10,end:Math.round(duration*.42),knockback:4,area:{kind:ultimate?'circle':'arc',range:ultimate?100:88,width:72,angle:ultimate?360:145,offset:8}},
   {id:'second-crescent',start:Math.round(duration*.5),end:activeEnd,knockback:ultimate?12:key==='combo3'?8:5,area:{kind:ultimate?'circle':'arc',range:ultimate?112:96,width:88,angle:ultimate?360:160,offset:8}}],
  hitStop:ultimate?32:18,
  events:[{id:itemId(),time:windup,kind:'sound',color:'#f4dfb3',size:64,lifetime:240,sound:'swing'},
   {id:itemId(),time:windup+25,kind:wave?'projectile':ultimate?'burst':'trail',color:wave?'#58d4cc':'#f4dfb3',size:ultimate?168:96,lifetime:320,sound:wave?'wave':'swing'},
   {id:itemId(),time:Math.round(duration*.52),kind:'burst',color:'#95e5da',size:ultimate?192:72,lifetime:300,sound:'impact'}]}
 if(key==='primary'||key==='combo2')action.combo={next:key==='primary'?'combo2':'combo3',open:Math.round(duration*.4),close:Math.round(duration*.82),buffer:180}
 return action
}

export function twinScythes():ItemDocument{
 return{format:'pawtrail-item',version:1,id:'ivory-twin-scythes-v1',name:'Ivory twin scythes',weaponIcon:weaponIcons['ivory-twin-scythes-v1'],idleChain:false,stance:structuredClone(scytheStance),parts:scytheParts(),meshEdits:[],icons,
  equipment:{socket:'WristRight',position:[0,-.2,1.5],rotation:[-4,-5,82],pivot:[0,0,0],tip:[26,32,0],paired:{position:[0,.4,-1.5],rotation:[4,5,-64],mirror:false}},
  actions:{primary:move('primary','Crossing crescents',650),combo2:move('combo2','Returning crescent',700),combo3:move('combo3','Twin reaping arc',850),running:move('running','Reaper’s stride',720),extend:move('extend','Moonlit crescent',900),special:move('special','Harvest moon',1250)}}
}
