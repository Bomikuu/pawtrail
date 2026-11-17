import * as T from 'three'
import {createRescuer,type Rig} from './rigs'
import type {ActorAppearance} from './appearance'
import {refinedModelKit} from './refined-model-kit'
import {archiveBodyGeometry,bindTorsoParts,refinedFaceState} from './refined-action-support'
import {createAnimeFaceGeometry} from './anime-face-geometry'
import {createFaceContour} from './face-contour'
import {aureliaTexture} from './aurelia-textures'

/** Aurelia's illustration-led layered armor and feather volumes on the shared rig. */
export function createAurelia(appearance:ActorAppearance):Rig{
 const base=createRescuer(appearance),C=appearance.colors,get=(name:string)=>base.root.getObjectByName(name)!
 archiveBodyGeometry(base,'AureliaOriginalMeshArchive')
 const {group,mesh,round,loft,volume,cloth,animateCloth}=refinedModelKit(aureliaTexture)
 const head=get('Head'),upper=get('UpperBody'),chest=get('ChestBreath'),spine=get('SpineBend')
 const sections:readonly(readonly[number,number,number])[]=[[-6.5,.3,1],[-5.8,1.7,1.8],[-4.4,3.0,2.7],[-2.5,4.0,3.4],[0,4.6,3.8],[2.5,4.5,3.7],[4.7,3.7,2.9],[6.0,2.2,1.9]]
 const face=createAnimeFaceGeometry(sections)
 const faces=(['face','half','closed']as const).map(surface=>{
  const n=new T.Mesh(face,[new T.MeshBasicMaterial({map:aureliaTexture(surface),side:T.DoubleSide,toneMapped:false}),new T.MeshBasicMaterial({color:C.skin,toneMapped:false})]);n.name='AureliaFace_'+surface;head.add(n);return n
 })
 head.add(createFaceContour(face,'#956375',.34,[new T.Vector3(-3.8,-2.6,1.3),new T.Vector3(-2.7,-4.8,1.7),new T.Vector3(0,-6.5,1.1),new T.Vector3(2.7,-4.8,1.7),new T.Vector3(3.8,-2.6,1.3)]))
 for(const s of [-1,1])round('AureliaEar',head,C.skin,s*4.8,-1.1,-.1,.6,1.05,.8)
 loft('AureliaNeck',upper,[[28,1.4,1.5],[25.4,1.5,1.6]],C.skin)
 // Curved scalp with an opening above the brows, not a cuboid with a face print.
 const p:number[]=[],uv:number[]=[],ix:number[]=[],rows=10,cols=40
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const a=c/cols*Math.PI*2,f=r/rows,front=Math.max(0,Math.cos(a)),phi=f*(Math.PI*.72-front*Math.PI*.3)
  p.push(Math.sin(a)*Math.sin(phi)*5.8,2+Math.cos(phi)*5.6,-.9+Math.cos(a)*Math.sin(phi)*4.65);uv.push(c/cols,1-f)
 }
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
 const scalp=new T.BufferGeometry();scalp.setAttribute('position',new T.Float32BufferAttribute(p,3));scalp.setAttribute('uv',new T.Float32BufferAttribute(uv,2));scalp.setIndex(ix);mesh('AureliaRoundedCrown',head,scalp,C.hair,'hair')
 const locks:{node:T.Group;angle:number;long:boolean}[]=[]
 const lock=(name:string,x:number,y:number,z:number,angle:number,length:number,width:number,long=false)=>{
  const root=group(name,head,x,y,z);root.rotation.z=angle;locks.push({node:root,angle,long})
  loft(name+'Volume',root,[[1,width*.6,1.0],[0,width,1.35],[-length*.3,width*.9,1.4,.3,.3],[-length*.6,width*.7,1.05,.6,.55],[-length*.85,width*.35,.6,1,.6],[-length,.025,.06,1.4,.6]],C.hair,long?'hair':'fringe')
 }
 lock('AureliaCrossingForelock',-3.8,6.0,3.1,.42,6.6,1.6)
 lock('AureliaCentralBang',-.9,6.6,3.6,-.24,5.6,1.3)
 lock('AureliaRightBang',2.1,5.7,3.0,-.3,4.8,1.3)
 for(const s of [-1,1]){
  lock('AureliaTemple'+s,s*4.9,2.8,.1,-s*.11,8,1.15)
  for(let i=0;i<3;i++)lock('AureliaLayeredLongHair'+s+i,s*(3.5+i*.65),1.5-i,-3.1+i*.1,-s*(.04+i*.025),19+i*2.2,1.5-i*.1,true)
 }
 lock('AureliaCrownWisp',-1,7,-1,-2.3,3.4,.6)
 // The asymmetric ornament is actual thick, painted feather geometry.
 const crest=group('AureliaCrescentFeatherCrest',head,4.6,4.4,-.3);crest.rotation.z=-.45
 for(let i=0;i<3;i++){
  const plume=volume('AureliaCrestFeather'+i,crest,[[0,0],[-1.1,2.5],[-1,5.6],[.2,8.5-i],[1.2,4.7],[2,2.2],[1,0]],.45,C.feather,'feather');plume.rotation.z=-.45+i*.5;plume.position.z=-i*.18
 }
 const star=mesh('AureliaCrestGoldStar',crest,new T.OctahedronGeometry(1.35),C.gold);star.position.set(.1,.7,1);star.scale.set(1,1,.3)
 const crestGem=mesh('AureliaCrestAmethyst',crest,new T.OctahedronGeometry(.6),appearance.face.leftEye);crestGem.position.set(.1,.7,1.5);crestGem.scale.z=.5
 // Rounded fitted cuirass with distinct front and back mapping.
 loft('AureliaPearlCuirassFront',chest,[[5.3,3.3,2.7],[3.8,4.2,3.25],[1,4.25,3.3],[-2.3,3.6,2.8],[-5.5,3.7,2.8]],C.shirt,'armor',true,[-Math.PI/2,Math.PI])
 loft('AureliaCuirassBack',chest,[[5.3,3.3,2.7],[3.8,4.2,3.25],[1,4.25,3.3],[-2.3,3.6,2.8],[-5.5,3.7,2.8]],C.jacket,'back',false,[Math.PI/2,Math.PI])
 loft('AureliaStandingCollar',upper,[[28.3,1.5,1.7],[26.2,1.9,1.9],[25.8,2.4,2.1]],C.cream,'armor')
 for(const s of [-1,1]){
  const line=volume('AureliaGoldWaistTrim'+s,chest,[[s*.2,-5.6],[s*3.6,-3.8],[s*4,-2.7],[s*3.4,-4.6],[s*.2,-6.3]],.2,C.gold);line.position.z=2.9
 }
 const brooch=mesh('AureliaAmethystStar',chest,new T.OctahedronGeometry(1.15),appearance.face.leftEye);brooch.position.set(0,4.7,3.3);brooch.rotation.z=Math.PI/4;brooch.scale.z=.35
 const starTrim=mesh('AureliaBroochGoldFrame',chest,new T.TorusGeometry(1.25,.18,4,4),C.gold);starTrim.position.set(0,4.7,3.2);starTrim.rotation.z=Math.PI/4
 // Short skirt follows hips; the open long feather tails leave room for the legs.
 loft('AureliaLilacPleatedSkirt',spine,[[.8,3.7,2.8],[-.8,4.5,3.2],[-3.7,5.6,3.7],[-5.2,5.9,3.9]],C.gown,'skirt')
 const featherRoots:{node:T.Group;z:number}[]=[]
 for(const s of [-1,1]){
  for(let i=0;i<4;i++){
   const root=group('AureliaHipFeatherRoot'+s+i,spine,s*(3.7+i*.7),.4-i*.2,-.8-i*.4)
   root.rotation.y=s*(.25+i*.08);root.rotation.z=s*(.3+i*.15);featherRoots.push({node:root,z:root.rotation.z})
   cloth('AureliaLongFeatherCape'+s+i,root,3.3,11.5+i*1.1,'feather',i*.65+s*.4,{taper:1,flare:.15,curve:.75,lining:'lining',sweep:s*.6,lift:1.0,thickness:.3})
  }
 }
 for(const s of [-1,1]){
  const side=s<0?'Left':'Right',hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
  loft('AureliaBlackUndersuitThigh',hip,[[.5,1.8,2.0],[-2.7,1.7,2.0],[-5.4,1.5,1.85]],C.shorts,'undersuit')
  loft('AureliaWhiteThighBoot',hip,[[-2,1.85,2.1],[-3,1.8,2.05],[-5.7,1.5,1.85]],C.shoe,'boots')
  loft('AureliaArmoredCalf',knee,[[.4,1.55,1.9],[-2.8,1.4,1.65],[-5.3,1.3,1.5]],C.shoe,'boots')
  const plate=volume('AureliaFeatherKneePlate',knee,[[-1.6,1.1],[0,2.0],[1.6,1.1],[1.7,-.9],[0,-2.1],[-1.7,-.9]],.5,C.metal,'boots');plate.position.z=1.65
  const kneeGem=mesh('AureliaKneeAmethyst',knee,new T.OctahedronGeometry(.6),appearance.face.leftEye);kneeGem.position.set(0,-.1,2.1);kneeGem.scale.set(.7,1,.4)
  round('AureliaRoundedArmoredBoot',ankle,C.shoe,0,-.8,.85,1.6,1.0,2.65,'boots');round('AureliaBootSole',ankle,C.gold,0,-1.7,.85,1.65,.25,2.65)
  loft('AureliaDarkUpperSleeve',shoulder,[[.4,.3,.5],[-.3,1.5,1.7],[-4.4,1.2,1.5]],C.shorts,'undersuit')
  round('AureliaRoundedPauldronBase',shoulder,C.feather,0,-.7,0,1.85,1.4,2.0,'feather')
  for(let i=0;i<3;i++){
   const f=volume('AureliaLayeredShoulderFeather'+i,shoulder,[[-1.8,-.2],[0,.7],[1.8,-.2],[s*2.5,-2-i*.65],[s*.6,-1.4-i*.25]],.35,C.feather,'feather');f.position.set(0,-i*.6,1-i*.25)
  }
  loft('AureliaForearmBracer',elbow,[[.15,1.25,1.5],[-3.7,1.1,1.3]],C.metal,'bracer')
  loft('AureliaGoldWristRim',wrist,[[.8,1.1,1.35],[.2,1.12,1.35]],C.gold)
  round('AureliaHand',wrist,C.skin,0,-.5,.15,.9,.8,1.1)
 }
 bindTorsoParts(base,['AureliaNeck','AureliaStandingCollar'])
 return {...base,pose(action,phase,layers){
  base.pose(action,phase,layers);head.position.y=17.2;head.scale.setScalar(.94)
  const moving=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number'
  const state=refinedFaceState(action,phase,moving);faces[0].visible=!state.closed&&!state.half;faces[1].visible=state.half;faces[2].visible=state.closed
  const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,weight=layers?.secondaryMotion?.locomotion??(action==='run'?1.2:moving?1:0)
  locks.forEach(({node,angle,long},i)=>{node.rotation.x=Math.sin(t-i*.35)*(long?.04:.014)+weight*(long?.035:0);node.rotation.z=angle+Math.sin(t-.5-i*.25)*(long?.022:.012)})
  const resting=['sit','sleep','float','ride'].includes(action),hipHeight=(get('HipLeft').position.y+get('HipRight').position.y)/2
  const clearance=T.MathUtils.clamp((hipHeight-1)/11.4,.34,1)
  animateCloth(t,weight,resting,clearance/(resting?.72:1))
  featherRoots.forEach(({node,z},i)=>{node.rotation.z=z+Math.sin(t-i*.3)*(.012+weight*.015);node.rotation.x=Math.sin(t-i*.4)*.025})
  for(const[s,side]of[[-1,'Left'],[1,'Right']]as const){get('Shoulder'+side).position.x=s*5.3;if(action!=='power_up')get('Hip'+side).position.x+=s*(2.1-2.6)}
 }}
}
