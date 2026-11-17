import * as T from 'three'
import {createRescuer,type Rig} from './rigs'
import type {ActorAppearance} from './appearance'
import {createAnimeFaceGeometry} from './anime-face-geometry'
import {createFaceContour} from './face-contour'
import {archiveBodyGeometry,bindTorsoParts,refinedFaceState} from './refined-action-support'
import {siegTexture,type SiegSurface} from './sieg-textures'

type Section=[y:number,width:number,depth:number,x?:number,z?:number]
/** New silhouette on the existing skeleton, gait, care props and action library. */
export function createSieg(appearance:ActorAppearance):Rig{
 const base=createRescuer(appearance),C=appearance.colors,get=(name:string)=>base.root.getObjectByName(name)!
 archiveBodyGeometry(base,'SiegOriginalMeshArchive')
 const materials=new Map<string,T.MeshBasicMaterial>()
 const mat=(color:string,surface?:SiegSurface)=>{
  const key=surface??color
  if(!materials.has(key))materials.set(key,new T.MeshBasicMaterial({color:surface?'#ffffff':color,map:surface?siegTexture(surface):null,vertexColors:true,side:T.DoubleSide,toneMapped:false}))
  return materials.get(key)!
 }
 const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
 const mesh=(name:string,parent:T.Object3D,g:T.BufferGeometry,color:string,surface?:SiegSurface)=>{
  g.computeVertexNormals();const normals=g.getAttribute('normal'),colors:number[]=[]
  for(let i=0;i<normals.count;i++){const light=-normals.getX(i)*.23+normals.getY(i)*.35+normals.getZ(i)*.3,s=light<-.2?.78:light<.1?.91:1;colors.push(s,s,s)}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const n=new T.Mesh(g,mat(color,surface));n.name=name;parent.add(n);return n
 }
 const round=(name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,rx:number,ry:number,rz:number)=>{
  const n=mesh(name,parent,new T.SphereGeometry(1,16,10),color);n.position.set(x,y,z);n.scale.set(rx,ry,rz);return n
 }
 const loft=(name:string,parent:T.Object3D,sections:Section[],color:string,surface?:SiegSurface)=>{
  const p:number[]=[],uv:number[]=[],ix:number[]=[],segments=20,top=sections[0][0],bottom=sections.at(-1)![0]
  for(const[y,w,d,x=0,z=0] of sections)for(let c=0;c<=segments;c++){
   const angle=-Math.PI+c/segments*Math.PI*2;p.push(Math.sin(angle)*w+x,y,Math.cos(angle)*d+z);uv.push(c/segments,(y-bottom)/(top-bottom))
  }
  for(let r=0;r<sections.length-1;r++)for(let c=0;c<segments;c++){const a=r*(segments+1)+c,b=a+segments+1;ix.push(a,b,a+1,a+1,b,b+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix)
  return mesh(name,parent,g,color,surface)
 }
 const extrude=(name:string,parent:T.Object3D,points:number[][],depth:number,color:string,surface?:SiegSurface)=>{
  const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath()
  const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:1,steps:1});g.translate(0,0,-depth/2)
  if(surface){g.computeBoundingBox();const box=g.boundingBox!,p=g.getAttribute('position'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)-box.min.x)/Math.max(.01,box.max.x-box.min.x),(p.getY(i)-box.min.y)/Math.max(.01,box.max.y-box.min.y))}
  return mesh(name,parent,g,color,surface)
 }
 const upper=get('UpperBody'),chest=get('ChestBreath'),head=get('Head')
 // Narrow cheek taper and soft jaw seam; depth remains visible from side views.
 const sections:Section[]=[[-6.5,.3,1],[-5.7,1.8,1.9],[-4.4,3.1,2.7],[-2.7,4.2,3.4],[-.8,4.9,3.9],[1.4,5,4],[3.5,4.9,3.7],[5.2,4,3],[6.2,2.4,1.9]]
 const face=createAnimeFaceGeometry(sections.map(([y,w,d])=>[y,w,d] as const))
 const faces=(['face','half','closed'] as const).map(surface=>{
  const painted=new T.MeshBasicMaterial({map:siegTexture(surface),side:T.DoubleSide,toneMapped:false})
  const n=new T.Mesh(face,[painted,new T.MeshBasicMaterial({color:C.skin,toneMapped:false})]);n.name='SiegFace_'+surface;head.add(n);return n
 })
 head.add(createFaceContour(face,'#805c50',.38,[new T.Vector3(-4.4,-2,1),new T.Vector3(-2.7,-5,2),new T.Vector3(0,-6.5,1.2),new T.Vector3(2.7,-5,2),new T.Vector3(4.4,-2,1)]))
 for(const s of [-1,1])round('SiegEar',head,C.skin,s*4.9,-1.2,0,.65,1.15,.8)
 loft('SiegNeck',upper,[[28.1,1.65,1.6],[25.9,1.65,1.6]],C.skin)
 // Rounded crown plus separate thick, tapered locks; copper is a real forelock.
 const crown=mesh('SiegHairCrown',head,new T.SphereGeometry(1,24,16),C.hair,'hair');crown.position.set(0,3,-1);crown.scale.set(5.7,3.7,4.8)
 const locks:T.Group[]=[]
 const lock=(name:string,x:number,y:number,z:number,angle:number,length:number,width:number,copper=false)=>{
  const root=group(name,head,x,y,z);root.rotation.z=angle;locks.push(root)
  loft(name+'Volume',root,[[1,width*.55,.9],[0,width,1.25],[-length*.4,width*.8,1.15,.5,.4],[-length*.8,width*.35,.65,1,.7],[-length,.025,.05,1.55,.6]],C.hair,copper?'copper':'hair')
 }
 lock('SiegCopperForelock',-3.9,5.7,3.15,-.28,7.2,1.6,true)
 lock('SiegSweptFringe',-1.7,6.9,3.4,.64,4.2,1.7)
 lock('SiegCrossingFringe',1.3,6.8,3.15,.55,3.8,1.6)
 lock('SiegRightTemple',4.8,2.9,1.1,-.18,6,1.2)
 lock('SiegLeftTemple',-4.9,2.7,1,.3,5.7,1)
 for(const [i,tuft] of [[-3.8,4.4,-2.1,-2.3,2.6,1],[-1.8,5.4,-1.2,-2.7,2.7,1],[.1,5.6,-1.2,2.2,2.8,1],[3.8,4.6,-1.7,1.7,2.8,.9]].entries()){
  const [x,y,z,angle,length,width]=tuft;lock('SiegCrownSpike'+i,x,y,z,angle,length,width)
 }
 for(const s of [-1,1])for(let i=0;i<3;i++)lock('SiegBackWisp'+s+i,s*(3.3+i*.6),2-i*1.4,-3.4,s*.55,3.4,1.15)
 loft('SiegFittedIvoryShirt',chest,[[5.2,3.6,2.7],[3.5,4.9,3.2],[0,4.9,3.3],[-3.5,4.2,2.9],[-5.6,4.5,2.9]],C.shirt,'shirt')
 loft('SiegHighCollar',upper,[[28,1.85,1.9],[26.5,2.3,2.1],[25.9,3.4,2.5]],C.cream)
 loft('SiegLeatherBelt',upper,[[15.3,4.6,3.15],[13.8,4.8,3.2]],C.shoe)
 const buckle=mesh('SiegBeltBuckle',upper,new T.TorusGeometry(.8,.19,4,4),C.gold);buckle.position.set(.4,14.5,3.4);buckle.rotation.z=Math.PI/4
 const harness=extrude('SiegDiagonalHarness',chest,[[-4.4,3.6],[-3.6,4.1],[4.2,-3.4],[3.5,-4.2]],.28,C.shoe);harness.position.z=3.3
 for(const[y,x]of [[3,1.2],[1,.3],[-1,-.6]]){const clasp=mesh('SiegBrassClasp',chest,new T.CapsuleGeometry(.16,1,2,6),C.gold);clasp.rotation.z=.95;clasp.position.set(x,y,3.55)}
 const capeRoot=group('SiegStormCape',get('SpineBend'),0,12,0)
 // The mantle folds over the shoulders as it does in the illustration.
 // Back-only cloth disappears behind the torso in the front camera.
 for(const s of [-1,1]){
  const mantle=extrude('SiegFrontMantle'+s,chest,[[s*1.2,5.8],[s*4.8,4.7],[s*5.5,1.5],[s*6,-.6],[s*2.8,1.1],[s*.4,3.7]],.5,C.jacket,'cape');mantle.position.z=3.25
  const edge=extrude('SiegMantleTealEdge'+s,chest,[[s*2.8,1.1],[s*6,-.6],[s*5.8,-1.3],[s*2.5,.4]],.18,C.backpack);edge.position.z=3.65
 }
 const p:number[]=[],uv:number[]=[],ix:number[]=[],cols=16,rows=10
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const u=c/cols,v=r/rows,angle=(u-.5)*Math.PI*1.55,flare=5.6+v*3.9
  p.push(Math.sin(angle)*flare,-v*(10.5+Math.sin(u*Math.PI)*2),-Math.cos(angle)*(3.4+v*1.1));uv.push(u,1-v)
 }
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c;ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2)}
 const cloth=new T.BufferGeometry();cloth.setAttribute('position',new T.Float32BufferAttribute(p,3));cloth.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cloth.setIndex(ix)
 const cape=mesh('SiegNavyTealCape',capeRoot,cloth,C.jacket,'cape'),rest=new Float32Array(p)
 const lining=mesh('SiegTealCapeLining',capeRoot,cloth.clone(),C.backpack,'lining');lining.scale.setScalar(.986)
 for(const s of [-1,1]){
  const side=s<0?'Left':'Right',hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
  loft('SiegTailoredThigh',hip,[[.6,2.2,2.5],[-2.5,2.1,2.4],[-5.5,1.65,2]],C.shorts,'trousers')
  loft('SiegTrouserCalf',knee,[[.3,1.7,2],[-2.5,1.45,1.9],[-5.25,1.25,1.5]],C.shorts,'trousers')
  loft('SiegCalfBoot',knee,[[-1.8,1.65,2.05],[-2.4,1.7,2.1],[-5.4,1.4,1.7]],C.shoe,'boots')
  const boot=mesh('SiegRoundedBoot',ankle,new T.SphereGeometry(1,16,10),C.shoe,'boots');boot.position.set(0,-.9,1);boot.scale.set(1.9,1.15,2.9)
  round('SiegBootSole',ankle,C.ink,0,-1.85,1,1.95,.3,2.9)
  for(let j=0;j<2;j++){const strap=mesh('SiegBootBuckle',knee,new T.TorusGeometry(.45,.12,4,4),C.gold);strap.rotation.z=Math.PI/4;strap.position.set(s*1.4,-2.9-j*1.4,1.7)}
  if(s<0)loft('SiegTealKneeWrap',knee,[[.3,1.82,2.1],[-1.2,1.78,2.1],[-2.2,1.65,2]],C.backpack,'lining')
  loft('SiegRoundedSleeve',shoulder,[[.6,.35,.5],[-.2,1.75,2.1],[-1.8,1.85,2.2],[-4.5,1.35,1.65]],C.shirt,'shirt')
  loft('SiegRolledCuff',shoulder,[[-3.3,1.6,1.9],[-4.4,1.55,1.85]],C.cream)
  loft('SiegForearm',elbow,[[.2,1.18,1.45],[-3.7,1,1.2]],C.skin)
  loft('SiegFingerlessGlove',wrist,[[.9,1.08,1.25],[-1.1,1.05,1.25]],C.shoe)
  round('SiegKnuckles',wrist,C.skin,0,-1.1,.35,.85,.45,.95)
  if(s>0){const armor=round('SiegCurvedBrassPauldron',shoulder,C.gold,0,-.65,0,2.35,1.7,2.65);armor.rotation.z=-.15;round('SiegPauldronInset',shoulder,'#d5b580',0,-.6,1.55,1.7,1,.8)}
 }
 // The short broad blade is a prop; it is not an unauthorised combat ability.
 const sword=group('SiegHeldSaber',get('WristLeft'),0,-1,.5)
 const blade=extrude('SiegBroadSingleEdge',sword,[[-.55,-2],[1.05,-2],[1,-10],[-.9,-12],[-1.15,-10]],.5,C.metal,'blade')
 blade.position.z=.1
 extrude('SiegForkedGuard',sword,[[-2.2,-1.3],[-1,-.5],[0,-1],[1.5,-.5],[2,-1.3],[.4,-1.6],[-.5,-1.6]],.8,C.gold)
 loft('SiegSaberGrip',sword,[[1.6,.4,.4],[-.8,.4,.4]],C.shoe)
 round('SiegTealGuardGem',sword,C.backpack,0,-1,.6,.45,.55,.25)
 const stowed=sword.clone(true);stowed.name='SiegHolsteredSaber';get('SpineBend').add(stowed);stowed.position.set(-4,7,-4.6);stowed.rotation.z=-.38
 bindTorsoParts(base,['SiegNeck','SiegHighCollar','SiegLeatherBelt','SiegBeltBuckle'])
 return {...base,pose(action,phase,layers){
  base.pose(action,phase,layers)
  head.position.y=17.3;head.scale.setScalar(.98)
  const walking=['walk','run','power_run','rescue_dash'].includes(action)||typeof layers?.locomotionPhase==='number'
  const {closed,half}=refinedFaceState(action,phase,walking);faces[0].visible=!closed&&!half;faces[1].visible=half;faces[2].visible=closed
  const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,weight=layers?.secondaryMotion?.locomotion??(action==='run'?1.2:walking?1:0)
  locks.forEach((n,i)=>{n.rotation.x=Math.sin(t-i*.22)*(.015+weight*.025)})
  for(const node of [cape,lining]){const positions=node.geometry.getAttribute('position') as T.BufferAttribute
   for(let i=0;i<positions.count;i++){const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],v=-y/12.5;positions.setXYZ(i,x+Math.sin(t-v*1.9+x*.12)*(.15+weight*.3)*v*v,y+Math.sin(t+x*.15)*.12*v,z-Math.sin(t-v*2+x*.1)*(.3+weight*.65)*v*v-weight*.7*v)}
   positions.needsUpdate=true
  }
  capeRoot.scale.y=['sit','sleep','float','ride'].includes(action)?.7:1
  const holstered=!['idle','walk','run','inspect','power_run','rescue_dash'].includes(action)
  sword.visible=!holstered;stowed.visible=holstered&&!['sleep','sit','ride'].includes(action)
 }}
}
