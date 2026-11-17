import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import type {ActionKey,ItemAction,ItemDocument} from './document'
import {spectralTexture,type SpectralSurface} from './spectral-art'

const smooth=(a:number,b:number,x:number)=>{const t=T.MathUtils.clamp((x-a)/Math.max(.001,b-a),0,1);return t*t*(3-2*t)}

/** Cosmetic weapon companion. Its mesh never participates in player collision or hit detection. */
export function attachSpectralGuardian(rig:Rig){
 const root=new T.Group(),shadow=new T.Group(),offhand=new T.Group(),orbit=new T.Group()
 root.name='SpectralGuardian';shadow.name='SpectralGuardianGroundShadow';offhand.name='SpectralOffhand';orbit.name='SpectralTalismans'
 rig.root.add(root,shadow,orbit);rig.root.getObjectByName('WristLeft')!.add(offhand)
 const roots=[root,shadow,offhand,orbit];roots.forEach(n=>n.visible=false)
 const materials=new Map<string,T.MeshBasicMaterial>(),geometries=new Set<T.BufferGeometry>()
 const unitBox=new T.BoxGeometry(1,1,1),unitSphere=new T.SphereGeometry(1,10,6),unitArmor=new T.DodecahedronGeometry(1,0)
 geometries.add(unitBox);geometries.add(unitSphere);geometries.add(unitArmor)
 let built=false
 let chest:T.Group,head:T.Group,aura:T.Mesh,ground:T.Mesh,ultimateHalo:T.Mesh
 const arms:{shoulder:T.Group;elbow:T.Group;hand:T.Group;sword:T.Group;side:number}[]=[]
 const wisps:T.Mesh[]=[],seals:T.Mesh[]=[]
 const material=(surface:SpectralSurface|undefined,color:string,opacity=1)=>{
  const key=[surface,color,opacity].join(':');let found=materials.get(key)
  if(!found){found=new T.MeshBasicMaterial({color,map:surface?spectralTexture(surface):undefined,transparent:opacity<1,opacity,depthWrite:opacity===1,side:T.DoubleSide,toneMapped:false});found.userData.baseOpacity=opacity;materials.set(key,found)}
  return found
 }
 const group=(name:string,parent:T.Object3D,x=0,y=0,z=0)=>{const n=new T.Group();n.name=name;n.position.set(x,y,z);parent.add(n);return n}
 const mesh=(name:string,parent:T.Object3D,geometry:T.BufferGeometry,mat:T.MeshBasicMaterial,p:[number,number,number],scale:[number,number,number])=>{
  geometries.add(geometry);const n=new T.Mesh(geometry,mat);n.name=name;n.position.set(...p);n.scale.set(...scale);n.raycast=()=>{};parent.add(n);return n
 }
 const sword=(parent:T.Object3D,name:string)=>{
  const n=group(name,parent)
  mesh('WrappedHilt',n,unitBox,material('armor','#ffffff'),[0,0,0],[1.4,4.4,1.4])
  for(const y of [-1.4,0,1.4])mesh('HiltBinding',n,unitBox,material(undefined,'#b88bcc'),[0,y,.02],[1.65,.35,1.65])
  mesh('Crossguard',n,unitArmor,material('armor','#ffffff'),[0,2.5,0],[4,1,1.3])
  mesh('GuardGem',n,unitArmor,material(undefined,'#dd5cbb'),[0,2.5,1.4],[.85,1.1,.35])
  const shape=new T.Shape();shape.moveTo(-1.65,3.2);shape.lineTo(1.65,3.2);shape.lineTo(1.65,25);shape.lineTo(0,29);shape.lineTo(-1.65,25);shape.closePath()
  const blade=new T.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:false,steps:1}),uv=blade.getAttribute('uv'),positions=blade.getAttribute('position')
  for(let i=0;i<uv.count;i++)uv.setXY(i,(positions.getX(i)+1.65)/3.3,(positions.getY(i)-3.2)/25.8)
  mesh('EtchedSpectralBlade',n,blade,material('blade','#ffffff'),[0,0,-.4],[1,1,1])
  mesh('LuminousBladeEdge',n,unitBox,material(undefined,'#ffe0f4'),[-1.46,14,.48],[.2,21,.14])
  mesh('BladeSpine',n,unitBox,material(undefined,'#441a49'),[.85,14,.49],[.28,20,.14])
  return n
 }
 const build=()=>{
  built=true
  const body=material('body','#ffffff',.86),armor=material('armor','#ffffff'),rim=material(undefined,'#b781dd')
  chest=group('GuardianBreathingTorso',root,0,24,0)
  mesh('TaperedEnergyTorso',chest,new T.CylinderGeometry(13,7.5,18,10),body,[0,0,0],[1,1,.55])
  mesh('SpectralAbdomen',chest,unitSphere,body,[0,-10,0],[7.5,6,4.5])
  for(const side of [-1,1]){
   mesh('PectoralEnergy',chest,unitSphere,body,[side*6,4,2.2],[6.7,5.2,3.5])
   mesh('CollarArmor',chest,unitArmor,armor,[side*5,10,0],[5.3,2.3,4.5])
   mesh('RibGlow',chest,unitBox,rim,[side*7.8,-.5,4.25],[.55,5,.3]).rotation.z=side*.25
   const shoulder=group('GuardianShoulder'+side,chest,side*13,6,0)
   mesh('ShoulderPlate',shoulder,unitArmor,armor,[side*.5,0,0],[5.7,4,5])
   const point=mesh('SweptShoulderSpike',shoulder,new T.ConeGeometry(2.3,7,4),armor,[side*3.7,2,-1],[1,1,1]);point.rotation.z=-side*Math.PI/3
   mesh('UpperArmEnergy',shoulder,unitSphere,body,[0,-5.2,0],[3.3,6,3.5])
   const elbow=group('GuardianElbow'+side,shoulder,0,-10.5,0)
   mesh('ElbowGuard',elbow,unitArmor,armor,[0,0,0],[3.6,2.8,3.8])
   mesh('ForearmEnergy',elbow,unitSphere,body,[0,-5,0],[3.7,5.6,3.5])
   mesh('WristBracer',elbow,unitArmor,armor,[0,-8.3,0],[4,2,4])
   const hand=group('GuardianHand'+side,elbow,0,-10,0)
   mesh('ClenchedFist',hand,unitSphere,body,[0,-.2,0],[3.4,3.3,3.3])
   for(let i=0;i<3;i++)mesh('FingerCrease',hand,unitBox,material(undefined,'#3b204c'),[-1.4+i*1.4,-1.8,2.8],[.25,2,.2])
   const blade=sword(hand,'GuardianSword'+side);blade.rotation.z=-side*2.06
   arms.push({shoulder,elbow,hand,sword:blade,side})
  }
  head=group('SpectralHelm',chest,0,16,0)
  const mask=new T.Shape();mask.moveTo(-4,2);mask.lineTo(-3,5);mask.lineTo(0,6);mask.lineTo(3,5);mask.lineTo(4,2);mask.lineTo(2,-3);mask.lineTo(0,-5);mask.lineTo(-2,-3);mask.closePath()
  const helmet=new T.ExtrudeGeometry(mask,{depth:5,steps:1,bevelEnabled:false});helmet.translate(0,0,-2.5)
  const uv=helmet.getAttribute('uv'),position=helmet.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setXY(i,(position.getX(i)+4)/8,(position.getY(i)+5)/11)
  mesh('PointedMaskedHead',head,helmet,armor,[0,0,0],[1,1,1])
  mesh('DarkVisor',head,unitBox,material(undefined,'#11101c'),[0,.5,2.6],[6.8,1.9,.7])
  for(const side of [-1,1]){
   mesh('GlowingEye',head,unitBox,material(undefined,'#ead3ff'),[side*1.8,.55,3.02],[1.5,.6,.18]).rotation.z=side*.23
   const horn=mesh('CrownFlame',head,new T.ConeGeometry(1.7,8,4),rim,[side*4,6,0],[1,1,1]);horn.rotation.z=-side*.36
  }
  mesh('ForeheadCrest',head,unitArmor,rim,[0,4,2.6],[1.1,2.5,.5])
  mesh('WaistSeal',root,unitArmor,armor,[0,11,0],[8.5,3,5.2])
  aura=mesh('SoftEnergyEnvelope',root,unitSphere,material(undefined,'#b664e6',.15),[0,25,0],[19,25,10])
  ultimateHalo=mesh('UltimateCrownHalo',root,new T.TorusGeometry(22,.7,4,40),material(undefined,'#f4ce70',.8),[0,27,-8],[1,1,1]);ultimateHalo.visible=false
  ground=mesh('GroundShadow',shadow,new T.CircleGeometry(14,24),material(undefined,'#211827',.24),[0,.18,0],[1,.65,1]);ground.rotation.x=-Math.PI/2
  for(let i=0;i<9;i++)wisps.push(mesh('RisingSpirit_'+i,root,new T.ConeGeometry(.75,4.4,3),material(undefined,'#cf87f5',.42),[0,0,0],[1,1,1]))
  for(let i=0;i<2;i++)seals.push(mesh('OrbitingSeal_'+i,orbit,new T.PlaneGeometry(4.6,4.6),material('talisman','#ffffff',.9),[0,0,0],[1,1,1]))
  sword(offhand,'OffhandSpectralBlade').scale.setScalar(.84)
 }
 return{
  update(item:ItemDocument,phase:number,locomotion=0,move?:ItemAction,elapsed=0,key?:ActionKey){
   const config=item.guardian
   roots.forEach(n=>n.visible=!!config)
   if(!config)return
   if(!built)build()
   const t=phase*Math.PI*2,p=move?T.MathUtils.clamp(elapsed/move.duration,0,1):0
   const preparation=move?smooth(0,.24,p)*(1-smooth(.26,.56,p)):0
   const strike=move?smooth(.25,.49,p)*(1-smooth(.64,1,p)):0
   const follow=move?smooth(.38,.64,p)*(1-smooth(.72,1,p)):0
   root.position.fromArray(config.offset);root.position.y+=Math.sin(t)*.65+locomotion*.3
   root.scale.setScalar(config.scale)
   root.rotation.set(-.025+Math.sin(t)*.012,move&&key==='special'?smooth(.16,.87,p)*Math.PI*2:Math.sin(t-.5)*.025+strike*.38,Math.sin(t-.6)*.014)
   chest.position.y=24+Math.sin(t-.2)*.27
   chest.scale.set(1+Math.sin(t)*.012,1+Math.sin(t)*.008,1+Math.sin(t)*.015)
   chest.rotation.x=-preparation*.09+follow*.14
   head.rotation.set(Math.sin(t-.4)*.012-preparation*.03,Math.sin(t-.6)*.025,0)
   for(const arm of arms){
    const opposite=key==='combo2'?-1:1,side=arm.side
    arm.shoulder.rotation.set(-.06+Math.sin(t-side*.2)*.025-preparation*.85-follow*.35,
     side*(preparation*.22-strike*.65)*opposite,side*(.06+preparation*.12+follow*.42))
    arm.elbow.rotation.set(-.16+Math.sin(t-.3)*.018-preparation*.65+follow*.2,0,0)
    arm.hand.rotation.y=side*follow*.35*opposite
    arm.sword.rotation.set(0,0,-side*(2.06-preparation*1.2+follow*.55))
   }
   offhand.position.set(0,-.2,1.2);offhand.rotation.set(0,0,2.06-preparation*1.15+strike*.45)
   shadow.position.set(config.offset[0],0,config.offset[2]);shadow.scale.setScalar(config.scale)
   ground.scale.x=1+Math.sin(t)*.025
   aura.scale.set(19+Math.sin(t)*.5+strike*2,25+Math.sin(t)*.4,10)
   ultimateHalo.visible=!!move&&key==='special';ultimateHalo.scale.setScalar(.75+strike*.35);ultimateHalo.rotation.z=t+p*Math.PI*2
   for(const [i,wisp] of wisps.entries()){
    const age=(phase+i/9)%1,angle=i*2.4+t*.35
    wisp.position.set(Math.cos(angle)*(12+Math.sin(age*Math.PI)*4),8+age*38,Math.sin(angle)*7)
    wisp.scale.setScalar(Math.sin(age*Math.PI)*(.7+strike*.4));wisp.rotation.z=Math.sin(t+i)*.2
   }
   for(const [i,seal] of seals.entries()){
    const angle=t+i*Math.PI;seal.position.set(Math.cos(angle)*15,31+Math.sin(t+i)*1.2,Math.sin(angle)*10)
    seal.rotation.set(.1*Math.sin(t),-angle,Math.sin(t+i)*.2)
   }
   for(const mat of materials.values()){
    const opacity=Number(mat.userData.baseOpacity)
    if(opacity<1)mat.opacity=opacity*config.opacity
    if(mat.map&&mat===materials.get('body:#ffffff:0.86'))mat.map.offset.y=Math.sin(t)*.04
   }
  },
  dispose(){
   roots.forEach(n=>n.removeFromParent());geometries.forEach(g=>g.dispose())
   materials.forEach(m=>{m.map?.dispose();m.dispose()});materials.clear()
  },
 }
}
