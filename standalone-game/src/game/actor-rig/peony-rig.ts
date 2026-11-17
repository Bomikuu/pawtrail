import * as T from 'three'
import {createRescuer,type Rig} from './rigs'
import type {ActorAppearance} from './appearance'
import {archiveBodyGeometry} from './refined-action-support'
import {refinedModelKit} from './refined-model-kit'
import {rikaTexture} from './rika-textures'

/** Dedicated volumetric vehicle shells on the shared articulated action pivots. */
export function createPeony(appearance:ActorAppearance):Rig{
 const base=createRescuer(appearance),C=appearance.colors,get=(name:string)=>base.root.getObjectByName(name)!
 archiveBodyGeometry(base,'PeonyOriginalMeshArchive')
 const {group,mesh,round,loft,volume}=refinedModelKit(rikaTexture)
 const spine=get('SpineBend'),chest=get('ChestBreath'),head=get('Head')
 // Layered curved shell; canopy, front rim and rear vents have distinct surfaces.
 round('PeonyRoundCockpitShell',chest,C.shirt,0,12,0,13,12.2,10,'pink')
 round('PeonyLowerReactorShell',spine,C.shirtDark,0,8,-.2,8.5,8.2,7,'pink')
 const hinge=group('PeonyCanopyHinge',chest,0,22,8)
 const canopy=round('PeonyCurvedTealCanopy',hinge,'#265f6c',0,-10,1.0,7.8,9.2,3.3,'canopy')
 const rim=mesh('PeonyCanopyDarkRim',hinge,new T.TorusGeometry(7.8,.6,8,32),'#3c354a');rim.position.set(0,-10,1.1);rim.scale.y=1.2
 const pilot=mesh('PeonySeatedPilotFace',chest,new T.PlaneGeometry(4.4,5.8),C.skin,'face');pilot.position.set(0,12,10.1);pilot.visible=false
 round('PeonyCockpitSeat',chest,'#263c4a',0,9,7.5,4.5,3.2,2.5)
 const lights:T.Mesh[]=[]
 for(const s of [-1,1]){
  round('PeonyWhiteCanopyJaw',chest,C.metal,s*8.3,6,7.0,1.4,2.5,2.1,'mech-white')
  const beacon=round('PeonySideSensor',chest,C.gold,s*10.3,17,6.2,1.05,1.05,.7);lights.push(beacon)
  const sensorRim=mesh('PeonySensorMetalRim',chest,new T.TorusGeometry(1.2,.28,6,16),C.shorts);sensorRim.position.set(s*10.3,17,6.1)
  const vent=volume('PeonyWhiteTopVent',chest,[[-1.7,-1],[1.7,-1],[2.2,.4],[1.2,1.7],[-1.4,1.4],[-2,.2]],.5,C.metal,'mech-white');vent.position.set(s*7.6,21.4,3.4);vent.rotation.z=s*.25
  round('PeonyVentInset',chest,C.ink,s*7.6,21.6,3.9,1.25,.65,.15)
  const antenna=group('PeonyAntennaRoot'+s,chest,s*7.8,22,-2.4);antenna.rotation.z=-s*.35
  loft('PeonySweptAntenna',antenna,[[10.5,.12,.2],[8,.65,.7],[1,1.1,1.2],[0,1.2,1.2]],C.shirt,'pink');loft('PeonyWhiteAntennaTip',antenna,[[10.7,.1,.15],[8.4,.65,.65]],C.metal,'mech-white')
  const thruster=mesh('PeonyRearThruster',chest,new T.CylinderGeometry(3.1,3.3,6,20),C.shorts,'metal');thruster.rotation.x=Math.PI/2;thruster.position.set(s*6.2,13,-10.3)
  const rim2=mesh('PeonyRearThrusterRim',chest,new T.TorusGeometry(2.6,.45,6,20),C.shirt,'pink');rim2.position.set(s*6.2,13,-13.4)
  const ring=mesh('PeonyRearThrusterTealCore',chest,new T.TorusGeometry(1.75,.23,6,20),C.gold);ring.position.set(s*6.2,13,-13.8);lights.push(ring)
  round('PeonyThrusterDarkInterior',chest,C.ink,s*6.2,13,-13.6,1.6,1.6,.25)
 }
 const chin=volume('PeonyFrontJawPlate',chest,[[-5.4,0],[-3.8,-2.4],[0,-3],[3.8,-2.4],[5.4,0],[4.5,1.3],[-4.5,1.3]],1.2,C.shirt,'pink');chin.position.set(0,3.9,8.2)
 const core=round('PeonyRescueReactor',chest,C.gold,0,2.5,9.2,1.7,.45,.3);lights.push(core)
 const pelvis=volume('PeonyPelvisFront',spine,[[-6.7,4],[-3,5.2],[0,3.3],[3,5.2],[6.7,4],[4.2,-.8],[0,-4],[-4.2,-.8]],4,C.shirt,'pink');pelvis.position.set(0,4,3.2)
 const claws:T.Group[]=[]
 for(const s of [-1,1]){
  const side=s<0?'Left':'Right',hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side),elbow=get('Elbow'+side),wrist=get('Wrist'+side)
  round('PeonyArmoredHaunch',hip,C.shirt,0,-3.1,0,4.2,5.1,4.7,'pink')
  round('PeonyKneeJoint',knee,C.shorts,0,-.2,.15,2.6,2.4,2.5,'metal')
  const kneeArmor=volume('PeonyKneePlate',knee,[[-2.2,1.3],[0,2],[2.2,1.3],[2.1,-1.3],[0,-2.3],[-2.1,-1.3]],.8,C.shorts,'metal');kneeArmor.position.z=2.1
  loft('PeonyCurvedShin',knee,[[.1,2.8,2.9],[-2.4,3.1,3.1],[-5.8,2.1,2.4],[-7.4,1.65,1.9]],C.shirt,'pink')
  const shinPlate=volume('PeonyWhiteShinPlate',knee,[[-1.9,-.8],[1.9,-.8],[1.4,-5.6],[.6,-7.2],[-.9,-6.3],[-1.8,-3.6]],.7,C.metal,'mech-white');shinPlate.position.z=2.7
  round('PeonyWideFoot',ankle,C.shorts,0,-1.3,1.1,3.9,1.4,5.1,'metal')
  for(let toe=-1;toe<=1;toe++){const claw=mesh('PeonyWhiteBirdToe',ankle,new T.ConeGeometry(1.25,4.5,4),C.metal,'mech-white');claw.rotation.x=Math.PI/2;claw.position.set(toe*2.2,-1.4,5);claw.scale.z=.6}
  round('PeonyAnkleHub',ankle,C.shirt,s*3.3,-.2,.3,.55,1.7,1.7,'pink')
  round('PeonyRoundedPauldron',shoulder,C.shirt,0,-.5,0,4.5,3.1,4.7,'pink')
  loft('PeonyWhiteShoulderRim',shoulder,[[-1.4,4.3,4.4],[-2.2,3.9,4.1]],C.metal,'mech-white')
  loft('PeonyUpperArmActuator',shoulder,[[-1.7,2.2,2.5],[-6.0,1.7,1.9]],C.shorts,'metal')
  round('PeonyForearmArmor',elbow,C.shirt,0,-2.6,1.1,4.5,4,4.5,'pink')
  const barrel=mesh('PeonyForearmBarrelHousing',elbow,new T.CylinderGeometry(3.3,3.8,5.4,20),C.shorts,'metal');barrel.rotation.x=Math.PI/2;barrel.position.set(0,-2.5,4.3)
  const ring=mesh('PeonyForearmWhiteRim',elbow,new T.TorusGeometry(3.4,.45,6,20),C.metal,'mech-white');ring.position.set(0,-2.5,6.1)
  for(const dx of [-1.25,1.25])for(const dy of [-1.25,1.25]){const port=mesh('PeonyShortBarrel',elbow,new T.CylinderGeometry(.85,.95,2.5,12),C.shorts,'metal');port.rotation.x=Math.PI/2;port.position.set(dx,-2.5+dy,7.3);round('PeonyDarkBore',elbow,C.ink,dx,-2.5+dy,8.6,.65,.65,.12)}
  const light=round('PeonyForearmBeacon',elbow,C.gold,s*3.6,-2.7,2.0,.25,1.1,.65);lights.push(light)
  const gripper=group('PeonyRescueGripper',wrist,0,0,2.2);claws.push(gripper)
  for(const finger of [-1,1]){const n=volume('PeonyRescueFinger',gripper,[[finger*.4,0],[finger*1.8,-.3],[finger*1.6,-2],[finger*.7,-2.5],[finger*.4,-1.9],[finger*1.1,-1.7],[finger*1.1,-.8]],.8,C.metal,'mech-white');n.position.z=2}
 }
 const lightScales=lights.map(n=>n.scale.clone())
 return{...base,pose(action,phase,layers){
  base.pose(action,phase,layers);head.visible=false
  // The larger mechanical leg uses the same solved joint angles, with scaled
  // joint spacing and soles. No human head, hair or old sprite is displayed.
  for(const[s,side]of[[-1,'Left'],[1,'Right']]as const){const hip=get('Hip'+side),knee=get('Knee'+side),ankle=get('Ankle'+side),shoulder=get('Shoulder'+side);hip.position.multiplyScalar(1.4);hip.position.x+=s*2.6;knee.position.y=-7.7;ankle.position.y=-7.42;shoulder.position.set(s*13.3,20,0);get('Elbow'+side).position.y=-6;get('Wrist'+side).position.y=-5.2;if(['idle','walk','run','power_run','rescue_dash'].includes(action)){shoulder.rotation.x*=.35;shoulder.rotation.z*=.5;get('Elbow'+side).rotation.x*=.45}}
  const t=(layers?.secondaryMotion?.phase??phase)*Math.PI*2,resting=action==='sleep'
  if(resting||['sit','float','ride'].includes(action)){get('RescuerStance').rotation.set(0,0,0);get('RescuerStance').position.set(0,action==='float'?4.5+Math.sin(t)*.4:0,0);get('UpperBody').position.y=-2;spine.rotation.set(0,0,0);for(const side of ['Left','Right']){get('Hip'+side).position.set(side==='Left'?-6.2:6.2,17.3,0);get('Hip'+side).rotation.set(-.25,0,0);get('Knee'+side).rotation.x=.6;get('Ankle'+side).rotation.x=-.35}}
  for(const name of ['SleepPillow','SleepBlanket'])get(name).visible=false
  const opening=action==='wave'?Math.sin(Math.PI*phase):0;hinge.rotation.x=-opening*1.1;pilot.visible=opening>.25;canopy.scale.z=1
  lights.forEach((n,i)=>n.scale.copy(lightScales[i]).multiplyScalar((resting?.3:1)+Math.sin(t)*.025))
  claws.forEach((n,i)=>{n.rotation.z=Math.sin(t+i)*(['feed','pet','pick_up','clean','water'].includes(action)?.12:.015)})
 }}
}
