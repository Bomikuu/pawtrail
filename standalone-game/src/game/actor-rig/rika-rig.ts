import * as T from 'three'
import {createRescuer,type Rig} from './rigs'
import type {ActorAppearance} from './appearance'
import {refinedModelKit} from './refined-model-kit'
import {archiveBodyGeometry,bindTorsoParts,refinedFaceState} from './refined-action-support'
import {createAnimeFaceGeometry} from './anime-face-geometry'
import {createFaceContour} from './face-contour'
import {rikaTexture} from './rika-textures'

/** Rika's own illustration-led surfaces, keeping the common human skeleton. */
export function createRika(appearance:ActorAppearance):Rig{
 const base=createRescuer(appearance),C=appearance.colors,get=(n:string)=>base.root.getObjectByName(n)!
 archiveBodyGeometry(base,'RikaOriginalMeshArchive')
 const {group,mesh,round,loft,volume}=refinedModelKit(rikaTexture)
 const head=get('Head'),chest=get('ChestBreath'),upper=get('UpperBody'),spine=get('SpineBend')
 const sections:readonly(readonly[number,number,number])[]=[[-6.4,.3,1],[-5.7,1.6,1.7],[-4.4,2.9,2.65],[-2.3,4,3.5],[0,4.6,3.85],[2.6,4.5,3.7],[4.8,3.65,2.85],[6,2.2,1.8]]
 const face=createAnimeFaceGeometry(sections)
 const faces=(['face','half','closed']as const).map(key=>{const n=new T.Mesh(face,[new T.MeshBasicMaterial({map:rikaTexture(key),side:T.DoubleSide,toneMapped:false}),new T.MeshBasicMaterial({color:C.skin,toneMapped:false})]);n.name='RikaFace_'+key;head.add(n);return n})
 head.add(createFaceContour(face,'#92696a',.33,[new T.Vector3(-3.8,-2.5,1.35),new T.Vector3(-2.6,-4.8,1.8),new T.Vector3(0,-6.4,1),new T.Vector3(2.6,-4.8,1.8),new T.Vector3(3.8,-2.5,1.35)]))
 // A curved scalp opens above the eyes; individual locks supply the fringe.
 const p:number[]=[],uv:number[]=[],ix:number[]=[],rows=10,cols=40
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){const a=c/cols*Math.PI*2,f=r/rows,front=Math.max(0,Math.cos(a)),phi=f*(Math.PI*.72-front*Math.PI*.3);p.push(Math.sin(a)*Math.sin(phi)*5.7,2+Math.cos(phi)*5.5,-.9+Math.cos(a)*Math.sin(phi)*4.65);uv.push(c/cols,1-f)}
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
 const scalp=new T.BufferGeometry();scalp.setAttribute('position',new T.Float32BufferAttribute(p,3));scalp.setAttribute('uv',new T.Float32BufferAttribute(uv,2));scalp.setIndex(ix);mesh('RikaRoundedScalp',head,scalp,C.hair,'hair')
 const locks:{node:T.Group;z:number;long:boolean}[]=[]
 const lock=(name:string,parent:T.Group,x:number,y:number,z:number,angle:number,length:number,width:number,long=false)=>{const root=group(name,parent,x,y,z);root.rotation.z=angle;locks.push({node:root,z:angle,long});loft(name+'Volume',root,[[1,width*.6,1.1],[0,width,1.4],[-length*.3,width*.9,1.45,.2,.35],[-length*.65,width*.6,1.0,.6,.9],[-length*.85,width*.3,.6,.9,1.0],[-length,.025,.05,1.3,.6]],C.hair,long?'hair':'fringe')}
 lock('RikaSweptForelock',head,-3.5,6.4,3.0,.48,6,1.65)
 lock('RikaCentralBang',head,-.3,6.4,3.6,-.16,5.1,1.25)
 lock('RikaRightBang',head,2.4,5.3,3,-.4,4.4,1.1)
 for(const s of [-1,1])lock('RikaTemple'+s,head,s*4.7,2.8,.2,-s*.1,6.4,1.05)
 const tail=group('RikaHighPonytail',head,0,5.4,-4.6)
 round('RikaPonytailRoot',tail,C.hair,0,.4,-.6,2.8,2.4,2.7,'hair')
 const band=mesh('RikaCoralHairTie',tail,new T.TorusGeometry(2.5,.38,8,20),C.ribbon);band.rotation.x=Math.PI/2
 for(let i=0;i<6;i++)lock('RikaPonytailLock'+i,tail,(i-2.5)*.7,-.5-i%2*.8,-1-i*.25,(i-2.5)*.08,13+i%3*1.6,1.55-i%2*.15,true)
 for(const s of [-1,1]){
  round('RikaHeadsetWhiteCup',head,C.jacket,s*4.9,-.2,0,.85,1.8,1.65,'white');round('RikaHeadsetCoralDisc',head,C.ribbon,s*5.55,-.2,.1,.32,1.1,1.05,'trim')
  const fin=volume('RikaHeadsetFin',head,[[s*4.4,.1],[s*5.6,1.4],[s*6.0,6.2],[s*4.7,3.6]],.65,C.jacket,'white');fin.position.z=-.25
 }
 loft('RikaNeck',upper,[[28,1.3,1.4],[25.6,1.5,1.6]],C.skin)
 const torso=[[5.4,3.3,2.8],[3.3,4.3,3.2],[.3,4.1,3.1],[-3,3.3,2.6],[-5.7,3.5,2.7]]as [number,number,number][]
 loft('RikaSuitFront',chest,torso,C.shirt,'suit',true,[-Math.PI/2,Math.PI]);loft('RikaSuitBack',chest,torso,C.shirtDark,'pilot-back',false,[Math.PI/2,Math.PI])
 loft('RikaStandingCollar',upper,[[28,1.5,1.6],[26,1.65,1.75],[25.6,2,1.9]],C.shirtDark,'suit')
 for(const s of [-1,1]){const trim=volume('RikaPinkTorsoPiping'+s,chest,[[s*3.4,5.2],[s*3.9,2],[s*3.5,-2.5],[s*2.8,-5.7],[s*3.3,-5.8],[s*4,-2.4],[s*4.4,2],[s*3.9,5.3]],.18,C.ribbon);trim.position.z=2.35}
 round('RikaTealChestBeacon',chest,C.gold,1.5,2.7,3.15,.4,.85,.2)
 loft('RikaSuitPelvis',spine,[[.9,3.4,2.7],[-1.2,3.5,2.8],[-3.2,3.25,2.5]],C.shirt,'suit')
 for(const s of [-1,1]){
  const side=s<0?'Left':'Right',hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
  loft('RikaFittedThigh',hip,[[.6,1.8,2.05],[-2.8,1.65,1.95],[-5.5,1.4,1.7]],C.shorts,'suit')
  const line=volume('RikaThighPinkStripe',hip,[[s*.9,.2],[s*1.4,-.1],[s*.2,-4],[s*1.2,-5.3],[s*.65,-5.4],[-s*.3,-4.1]],.2,C.ribbon);line.position.z=2.0
  round('RikaWhiteHipPlate',hip,C.jacket,s*1.6,-1,.1,.6,1.6,1.5,'white')
  loft('RikaWhiteShinArmor',knee,[[.3,1.45,1.8],[-2.7,1.3,1.65],[-5.4,1.25,1.5]],C.jacket,'white')
  const kneePlate=volume('RikaKneePlate',knee,[[-1.4,.7],[0,1.4],[1.4,.7],[1.2,-.8],[0,-1.5],[-1.2,-.8]],.45,C.jacket,'white');kneePlate.position.z=1.6
  round('RikaArmoredBoot',ankle,C.jacket,0,-.8,.9,1.6,1,2.7,'white');round('RikaMagentaSole',ankle,C.ribbon,0,-1.8,.9,1.65,.2,2.7)
  loft('RikaUpperSleeve',shoulder,[[.4,.25,.4],[-.3,1.4,1.65],[-4.5,1.1,1.4]],C.shirt,'suit')
  round('RikaCurvedPauldron',shoulder,C.jacket,0,-.8,0,1.85,1.25,2.0,'white')
  round('RikaCoralRescueBadge',shoulder,C.ribbon,s*1.5,-.65,.95,.25,.7,.65,'trim')
  loft('RikaWhiteBracer',elbow,[[.15,1.15,1.4],[-3.7,1.0,1.2]],C.jacket,'white')
  round('RikaTealWristLight',elbow,C.gold,0,-2,1.38,.25,.65,.12)
  round('RikaFingerlessGlove',wrist,C.jacket,0,-.2,.2,1.0,.65,1.15,'white');round('RikaFingers',wrist,C.skin,0,-.95,.4,.8,.35,.8)
 }
 bindTorsoParts(base,['RikaNeck','RikaStandingCollar'])
 return{...base,pose(action,phase,layers){base.pose(action,phase,layers);head.position.y=17.2;head.scale.setScalar(.94);const moving=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number';const state=refinedFaceState(action,phase,moving);faces[0].visible=!state.closed&&!state.half;faces[1].visible=state.half;faces[2].visible=state.closed;const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,w=layers?.secondaryMotion?.locomotion??(moving?1:0);locks.forEach(({node,z,long},i)=>{node.rotation.x=Math.sin(t-i*.32)*(long?.035:.012)+w*(long?.06:0);node.rotation.z=z+Math.sin(t-i*.4)*(long?.025:.012)});tail.rotation.x=Math.sin(t-.4)*.035+w*.04;for(const[s,side]of[[-1,'Left'],[1,'Right']]as const){get('Shoulder'+side).position.x=s*5.1;if(action!=='power_up')get('Hip'+side).position.x+=s*(2.1-2.6)}}}
}
