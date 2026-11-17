import * as T from 'three'
import {createRescuer,type Rig} from './rigs'
import type {ActorAppearance} from './appearance'
import {refinedModelKit,type BodySection} from './refined-model-kit'
import {archiveBodyGeometry,bindTorsoParts,refinedFaceState} from './refined-action-support'
import {createAnimeFaceGeometry} from './anime-face-geometry'
import {createFaceContour} from './face-contour'
import {sieghartTexture} from './sieghart-textures'

/** Character-specific volumes and clothing on the unchanged shared action rig. */
export function createSieghart(appearance:ActorAppearance):Rig{
 const base=createRescuer(appearance),C=appearance.colors,get=(name:string)=>base.root.getObjectByName(name)!
 archiveBodyGeometry(base,'SieghartOriginalMeshArchive')
 const {group,mesh,round,loft,volume,cloth,animateCloth}=refinedModelKit(sieghartTexture)
 const head=get('Head'),upper=get('UpperBody'),chest=get('ChestBreath'),spine=get('SpineBend')
 const sections:readonly (readonly[number,number,number])[]=[[-6.6,.35,1],[-5.8,1.6,1.9],[-4.5,2.8,2.65],[-2.8,3.9,3.4],[-.6,4.4,3.95],[1.5,4.55,4.05],[3.7,4.3,3.65],[5.3,3.5,2.8],[6.3,2,1.8]]
 const face=createAnimeFaceGeometry(sections)
 const faces=(['face','half','closed']as const).map(surface=>{
  const n=new T.Mesh(face,[new T.MeshBasicMaterial({map:sieghartTexture(surface),side:T.DoubleSide,toneMapped:false}),new T.MeshBasicMaterial({color:C.skin,toneMapped:false})]);n.name='SieghartFace_'+surface;head.add(n);return n
 })
 head.add(createFaceContour(face,'#805b60',.36,[new T.Vector3(-4.1,-2.7,1.4),new T.Vector3(-2.8,-5,2),new T.Vector3(0,-6.6,1.15),new T.Vector3(2.8,-5,2),new T.Vector3(4.1,-2.7,1.4)]))
 for(const s of [-1,1])round('SieghartEar',head,C.skin,s*4.9,-1.2,-.1,.65,1.15,.85)
 loft('SieghartNeck',upper,[[28,1.6,1.65],[25.4,1.6,1.65]],C.skin)
 // A shaped dome opens above the eyebrows; it is not a textured head box.
 const p:number[]=[],uv:number[]=[],ix:number[]=[],rows=10,cols=40
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const a=c/cols*Math.PI*2,f=r/rows,front=Math.max(0,Math.cos(a)),phi=f*(Math.PI*.7-front*Math.PI*.28)
  p.push(Math.sin(a)*Math.sin(phi)*5.8,2+Math.cos(phi)*5.8,-1+Math.cos(a)*Math.sin(phi)*4.8);uv.push(c/cols,1-f)
 }
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
 const crown=new T.BufferGeometry();crown.setAttribute('position',new T.Float32BufferAttribute(p,3));crown.setAttribute('uv',new T.Float32BufferAttribute(uv,2));crown.setIndex(ix);mesh('SieghartCurvedHairCrown',head,crown,C.hair,'hair')
 const locks:T.Group[]=[]
 const lock=(name:string,x:number,y:number,z:number,angle:number,length:number,width:number,purple=false)=>{
  const root=group(name,head,x,y,z);root.rotation.z=angle;locks.push(root)
  loft(name+'Layer',root,[[1,width*.5,1],[0,width,1.2],[-length*.35,width*.85,1.2,.35,.45],[-length*.7,width*.45,.8,.8,.7],[-length,.025,.06,1.4,.5]],C.hair,purple?'fringe':'hair')
 }
 lock('SieghartVioletForelock',-3.6,6.2,3.45,-.2,5.3,1.45,true)
 lock('SieghartSweptBang',-.7,6.8,3.5,.62,4.4,1.8)
 lock('SieghartRightBang',2.6,5.8,3,.35,3.6,1.2)
 const tufts=[[-3.8,4.5,-2,-2.3,3,1.1],[-1.9,5.6,-1.4,-2.65,2.8,1.1],[.2,5.8,-1.2,2.1,3,1.15],[3.7,4.6,-1.6,1.65,3.1,1]]
 for(const[i,t]of tufts.entries()){const[x,y,z,a,l,w]=t;lock('SieghartCrownTuft'+i,x,y,z,a,l,w)}
 for(const s of [-1,1]){
  lock('SieghartTemple'+s,s*4.9,2.6,.3,-s*.2,5.6,1.1)
  for(let i=0;i<3;i++)lock('SieghartBackSpikes'+s+i,s*(3.6+i*.5),2-i*1.5,-3,s*1.2,3.4,1.1)
 }
 // Fitted vest plus separate thick lapels and coat side pieces.
 loft('SieghartFittedVest',chest,[[5.4,3.7,2.8],[3.3,4.9,3.2],[0,4.8,3.3],[-3.4,4.2,2.85],[-5.7,4.5,2.9]],C.shirt,'vest',true)
 loft('SieghartDarkBackCoatShell',chest,[[5.6,3.9,3],[3.3,5.1,3.45],[0,5,3.5],[-3.4,4.4,3.1],[-5.8,4.7,3.15]],C.jacket,'coat',false,[Math.PI/2,Math.PI])
 loft('SieghartHighPurpleCollar',upper,[[28.2,1.8,1.8],[26.2,2.25,2.1],[25.6,3.1,2.55]],C.ribbon,'lining')
 for(const s of [-1,1]){
  const coat=volume('SieghartCoatFront'+s,chest,[[s*4.8,4.8],[s*3.1,5.5],[s*2.9,2.6],[s*4.2,-5.9],[s*5.6,-5.4]],.65,C.jacket,'coat');coat.position.z=1.6
  const lapel=volume('SieghartRaisedSilverLapel'+s,chest,[[s*2.8,5.5],[s*3.4,4.2],[s*2.4,1.8],[s*2.8,-4.8],[s*1.8,-5.9],[s*1.9,.4]],.3,C.metal);lapel.position.z=3.3
 }
 loft('SieghartDoubleWaistBelt',upper,[[15.6,4.65,3.15],[13.5,4.8,3.2]],C.shoe)
 for(const[y,x]of [[15.1,-.7],[13.9,1]]){const buckle=mesh('SieghartSilverBuckle',upper,new T.TorusGeometry(.65,.16,4,4),C.metal);buckle.position.set(x,y,3.5);buckle.rotation.z=Math.PI/4}
 const sash=volume('SieghartAngledWaistStrap',chest,[[-4.3,-2.2],[-4.2,-3.1],[4,-5.5],[4.2,-4.7]],.25,C.shoe);sash.position.z=3.6
 // Separate front lining, side tails and back coat panels, attached at the waist.
 for(const s of [-1,1]){
  const back=group('SieghartBackCoatRoot'+s,spine,s*2.4,.3,-3.05);back.rotation.y=s*.15
  cloth('SieghartLongBackCoat'+s,back,5.2,13.1,'coat',s*.7,{flare:.25,curve:.85,lining:'lining',thickness:.3})
  const side=group('SieghartSideCoatRoot'+s,spine,s*4.3,.3,-.2);side.rotation.y=s*1.2;side.rotation.z=-s*.1
  cloth('SieghartSplitSideCoat'+s,side,4,12.5,'coat',s*.9,{flare:.3,curve:.8,lining:'lining',thickness:.28})
 }
 // A volumetric scarf knot and collar sit above the vest; two articulated tails.
 const collar=mesh('SieghartScarfCollar',spine,new T.TorusGeometry(2.6,.8,8,28),C.jacket,'scarf');collar.rotation.x=Math.PI/2;collar.position.set(0,12.3,0);collar.scale.z=1.1
 const cowl=volume('SieghartFrontScarfFold',chest,[[-3.4,5.7],[-2.3,3.7],[.5,3],[3.3,4.5],[3.4,5.7],[.4,4.4]],.8,C.jacket,'scarf');cowl.position.z=3.45
 const scarfRoots:T.Group[]=[]
 for(const s of [-1,1]){
  const root=group('SieghartScarfTailRoot'+s,spine,s*.8,12,-3.2);root.rotation.set(.28,-.25+s*.16,1.05+s*.12);scarfRoots.push(root)
  cloth('SieghartLongSilverTrimScarf'+s,root,2.9,s<0?16:18,'scarf',s*1.1,{flare:.1,curve:1.1,lining:'scarf',sweep:s*2.2,lift:2.4,thickness:.2})
 }
 const jewel=mesh('SieghartBlueNeckJewel',chest,new T.OctahedronGeometry(.7),appearance.face.leftEye);jewel.position.set(-2.8,3.2,4.1);jewel.scale.set(.5,1.1,.4)
 for(const s of [-1,1]){
  const side=s<0?'Left':'Right',hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
  loft('SieghartTailoredThigh',hip,[[.6,2.2,2.45],[-2.5,2.05,2.45],[-5.5,1.65,2]],C.shorts,'trousers')
  loft('SieghartFittedCalf',knee,[[.25,1.7,2],[-3,1.45,1.8],[-5.3,1.3,1.5]],C.shorts,'trousers')
  loft('SieghartPurpleBootShaft',knee,[[-1.9,1.75,2.1],[-2.7,1.7,2.1],[-5.5,1.45,1.75]],C.shoe,'boots')
  round('SieghartRoundedArmorBoot',ankle,C.metal,0,-.9,1,1.95,1.15,3,'boots');round('SieghartBootSole',ankle,C.ink,0,-1.85,1,2,.3,3)
  if(s<0){const plate=volume('SieghartFacetedKneePlate',knee,[[-1.5,.5],[0,1.2],[1.5,.5],[1.7,-.9],[0,-2.6],[-1.7,-.9]],.6,C.metal);plate.position.z=2.1}
  else loft('SieghartPurpleThighStrap',hip,[[-1.5,2.15,2.55],[-2.35,2.1,2.5]],C.ribbon)
  loft('SieghartRoundedCoatSleeve',shoulder,[[.6,.25,.4],[-.2,1.7,2.1],[-1.6,1.9,2.25],[-4.4,1.45,1.7]],C.jacket,'coat')
  loft('SieghartPurpleSleeveCuff',shoulder,[[-3.35,1.6,1.85],[-4.4,1.65,1.85]],C.ribbon,'lining')
  const pauldron=round('SieghartCurvedShoulderArmor',shoulder,C.jacket,0,-.65,0,2.1,1.5,2.45,'coat');pauldron.rotation.z=-s*.12
  const rim=mesh('SieghartShoulderSilverRim',shoulder,new T.TorusGeometry(1.75,.14,4,20,Math.PI),C.metal);rim.rotation.x=.7;rim.rotation.z=Math.PI;rim.position.set(0,-.6,1.2)
  loft('SieghartBareForearm',elbow,[[.2,1.12,1.4],[-3.6,.95,1.15]],C.skin)
  loft('SieghartPurpleGauntlet',wrist,[[2,1.05,1.25],[-1.1,1.1,1.25]],C.jacket,'coat');round('SieghartFingerlessKnuckles',wrist,C.skin,0,-1.05,.4,.8,.4,.9)
 }
 const sword=group('SieghartHeldBroadsword',get('WristLeft'),0,-.9,.7)
 const blade=volume('SieghartCharcoalVioletBlade',sword,[[-1.2,-1.5],[1.3,-1.5],[1.5,-4],[1.1,-12.2],[0,-14],[-1.25,-12.2],[-1.5,-4]],.65,C.metal,'blade');blade.position.z=.15
 volume('SieghartForkGuard',sword,[[-2.4,-1.6],[-1.9,-.2],[-.5,-.6],[0,.1],[.5,-.6],[1.9,-.2],[2.4,-1.6],[1,-1.25],[0,-1.7],[-1,-1.25]],.9,C.metalShade)
 loft('SieghartSwordGrip',sword,[[2,.4,.45],[-.5,.4,.45]],C.shoe)
 const gem=mesh('SieghartGuardAmethyst',sword,new T.OctahedronGeometry(.65),C.ribbon);gem.scale.z=.4;gem.position.set(0,-1.2,.7)
 const stowed=sword.clone(true);stowed.name='SieghartStowedBroadsword';spine.add(stowed);stowed.position.set(-3.2,3.5,-4.5);stowed.rotation.z=-2.85
 bindTorsoParts(base,['SieghartNeck','SieghartHighPurpleCollar','SieghartDoubleWaistBelt','SieghartSilverBuckle'])
 return {...base,pose(action,phase,layers){
  base.pose(action,phase,layers);head.position.y=17.1;head.scale.setScalar(.9)
  const moving=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number'
  const state=refinedFaceState(action,phase,moving);faces[0].visible=!state.closed&&!state.half;faces[1].visible=state.half;faces[2].visible=state.closed
  const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,weight=layers?.secondaryMotion?.locomotion??(action==='run'?1.2:moving?1:0)
  locks.forEach((n,i)=>{n.rotation.x=Math.sin(t-i*.27)*(.015+weight*.025)})
  const resting=['sit','sleep','float','ride'].includes(action)
  const clearance=T.MathUtils.clamp((13+upper.position.y)/13,.32,1)
  animateCloth(t,weight,resting,clearance/(resting?.72:1))
  scarfRoots.forEach((n,i)=>{n.rotation.x=.28+Math.sin(t-i*.8)*(.03+weight*.045)})
  const care=!['idle','walk','run','inspect','power_run','rescue_dash'].includes(action);sword.visible=!care;stowed.visible=care&&!['sit','sleep','ride'].includes(action)
 }}
}
