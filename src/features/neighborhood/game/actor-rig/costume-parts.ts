import * as T from 'three'
import { solid, type PartKit } from './part-kit'

/** Large swept clumps and two forehead locks give the hero a distinct silhouette. */
export function attachHeroHair(kit:PartKit,head:T.Object3D){
  const {colors:C,group,round,paint}=kit,root=group('HeroHair',head)
  paint(round('HeroHairCrown',root,C.hair,0,3.1,-.8,13.8,7.5,10.5))
  paint(round('HeroHairNape',root,C.hair,0,.2,-3.1,13,10,6.4))
  const clumps=[
    [-3.4,5.1,-.5,-.65,.82,-.1,9.2,3.4],
    [.3,5.8,-1,.12,1,-.1,10,3.6],
    [4,4.9,-1,.75,.72,-.1,8.9,3.2],
    [-5.2,2.2,-1.3,-1,.23,-.15,7.4,3.2],
    [5.1,1.8,-1.5,1,.3,-.1,7.2,3],
    [-2.4,4.1,-3.7,-.4,.65,-.65,7.5,3],
    [2.7,3.7,-3.8,.55,.5,-.65,7.2,2.9],
    [-2.8,3.2,3.5,-.3,-.9,.2,5,2.5],
    [2.7,3.1,3.8,.15,-.95,.2,4.8,2.1],
  ]
  clumps.forEach(([x,y,z,dx,dy,dz,length,radius],i)=>{
    const direction=new T.Vector3(dx,dy,dz).normalize()
    const spike=paint(solid(kit,new T.ConeGeometry(radius,length,4),C.hair))
    spike.name='HeroHairClump_'+i;spike.position.set(x,y,z).addScaledVector(direction,length/2)
    spike.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction);root.add(spike)
  })
  return root
}

export function attachGi(kit:PartKit,chest:T.Object3D,upper:T.Object3D){
  const {colors:C,part,round}=kit
  part('GiWrapTorso',chest,C.jacket,0,-.3,.2,10.3,11.8,6,.65)
  part('GiBlueUndershirt',chest,C.shirt,0,4.8,3.35,5.8,3.5,.7,.25)
  for(const side of [-1,1]){
    const lapel=part('GiCrossedLapel',chest,C.jacketLight,side*2.1,2.8,3.85,2.1,7,.6,.1);lapel.rotation.z=side*.48
    part('GiSideFold',chest,C.jacketDark,side*4.5,-1.5,2.5,.55,6.8,.5,.1)
  }
  part('GiSash',upper,C.shirtDark,0,14.4,.2,10.8,2,6.3,.2)
  round('GiKnot',upper,C.shirt,1.9,14.2,3.9,2.8,2.4,1.6)
  for(const side of [-1,1]){
    const tail=part('GiSashTail',upper,C.shirt,2+side*.75,11.9,3.7,1.4,4.5,.7,.15);tail.rotation.z=side*.25
  }
  round('GiChestCrest',chest,C.cream,-3.2,1.3,3.85,2.7,2.7,.45)
  part('GiCrestMark',chest,C.ink,-3.2,1.3,4.15,1.2,.5,.2,.02)
}

export function attachSpaceHelmet(kit:PartKit,head:T.Object3D){
  const {colors:C,group,round,part}=kit,root=group('SpaceHelmet',head)
  round('HelmetShell',root,C.jacket,0,.8,-.15,17,17.5,15)
  round('HelmetUpperLight',root,C.jacketLight,-1.8,6.7,.2,12,4.5,10.6)
  round('VisorSeal',root,C.shoe,0,.7,4.5,15.5,13.1,5.3)
  round('GoldVisor',root,C.hat,0,.85,5.5,13.5,11.1,4.6)
  part('VisorSkyReflection',root,C.cream,-3.7,3.8,7.4,2,3.2,.35,.15)
  part('VisorLightStep',root,C.gold,-1.5,4.6,7.5,3.3,.7,.3,.08)
  part('VisorLowerShade',root,C.hatBand,1.9,-2.5,7.45,4.8,.7,.3,.1)
  for(const side of [-1,1]){
    round('HelmetHinge',root,C.metalShade,side*7.8,.2,.6,2,4.3,4)
    part('HelmetHingeCap',root,C.jacketLight,side*8.6,.2,.8,.8,2.1,2.5,.2)
  }
  part('HelmetSealCollar',root,C.metalShade,0,-6.7,0,11,2,10,.5)
  part('HelmetCommLight',root,C.orange,6.2,-3.2,3.5,1.3,1.2,.7,.12)
  return root
}

export function attachSpacesuit(kit:PartKit,chest:T.Object3D,upper:T.Object3D){
  const {colors:C,round,part}=kit
  round('PaddedSuitTorso',chest,C.jacket,0,-.2,.1,12.1,13.8,8.2)
  for(const side of [-1,1]){
    part('SuitSideSeam',chest,C.jacketDark,side*5,-.2,2.3,.6,8.2,.5,.1)
    part('PackHarness',chest,C.metalShade,side*4,2.1,3.8,1.2,8.7,.8,.2)
  }
  part('LifeSupportControl',chest,C.metalShade,0,.9,4.3,6.6,5,.9,.25)
  part('ControlPanelFace',chest,C.shirt,0,1,4.85,5.5,3.9,.35,.15)
  part('PanelScreen',chest,C.shirtLight,-1.1,1.7,5.1,2.4,1.1,.25,.05)
  for(const x of [-1.2,.2,1.6])round('SuitControlButton',chest,x<0?C.orange:C.cream,x,-.1,5.1,.8,.8,.35)
  part('SuitWaistSeal',upper,C.metalShade,0,14.4,0,11,2.1,7.5,.35)
  part('SuitBeltBuckle',upper,C.orange,0,14.4,4,2.6,1.7,.6,.15)
}

export function attachLifeSupport(kit:PartKit,upper:T.Object3D){
  const {colors:C,part,round}=kit
  part('LifeSupportPack',upper,C.backpack,0,21,-5.5,10.8,13.3,5,.8)
  part('PackBackPanel',upper,C.backpackLight,0,21.8,-8.2,8.5,9.1,.8,.35)
  for(const side of [-1,1]){
    round('OxygenTank',upper,C.metal,side*4.8,20.8,-6.1,3.7,10.8,4)
    for(const y of [17.3,24])part('TankStrap',upper,C.metalShade,side*4.8,y,-8.1,3.2,.85,.5,.1)
    part('TankValve',upper,C.orange,side*4.7,26.8,-6,1.7,1.7,1.8,.2)
  }
  for(const y of [19,20.5,22])part('PackVent',upper,C.metalShade,0,y,-8.75,5,.5,.3,.04)
}
