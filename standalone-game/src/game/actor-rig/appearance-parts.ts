import * as T from 'three'

export type CharacterParts = {
  hair?: 'swept' | 'spiky' | 'cropped' | 'long' | 'hero-spikes'
  headwear?: 'none' | 'wide-brim' | 'hood' | 'halo' | 'space-helmet' | 'outrider-bow'
  outfit?: 'vest' | 'tunic' | 'coat' | 'gown' | 'gi' | 'spacesuit' | 'outrider'
  legs?: 'shorts' | 'trousers'
  backpack?: boolean
  held?: 'none' | 'sword'
  wings?: 'none' | 'feathered'
  face?: 'default' | 'soft'
}

import {solid,type PartKit as Kit} from './part-kit'
import {attachHeroHair,attachGi,attachSpaceHelmet,attachSpacesuit} from './costume-parts'
import {attachOutriderHeadwear,attachOutriderTorso} from './outrider-parts'

/** Geometry changes the silhouette while the existing head joint animates it. */
export function attachHair(kit:Kit,head:T.Object3D,style:CharacterParts['hair']){
  if(style==='hero-spikes'){attachHeroHair(kit,head);return}
  const {colors:C,round,paint}=kit
  paint(round('CroppedHairBack',head,C.hair,0,1,-2.1,12.4,10,6.2))
  paint(round('CroppedHairCrown',head,C.hair,0,3.6,-.4,12.7,5.6,9.2))
  if(style!=='spiky'){
    paint(round('ShortFringe',head,C.hair,-2.2,2.6,3.8,5.8,2.9,2.4))
    return
  }
  const spikes=[
    [0,5.2,-.2,-.05,1,0,8.4,2.6],
    [-3.6,4.8,-.6,-.47,.88,-.05,7.5,2.6],
    [3.6,4.8,-.6,.47,.88,-.05,7.5,2.6],
    [-5,3.4,.2,-.8,.6,.1,6.4,2.1],
    [5,3.4,.2,.8,.6,.1,6.4,2.1],
    [-2.4,3.8,3,-.3,.75,.6,5.5,2.1],
    [2.1,3.8,3,.3,.75,.6,5.3,2],
    [-1,4,-3.6,0,.75,-.66,7.1,2.5],
  ]
  spikes.forEach(([x,y,z,dx,dy,dz,height,radius],index)=>{
    const direction=new T.Vector3(dx,dy,dz).normalize()
    const mesh=paint(solid(kit,new T.ConeGeometry(radius,height,4,1),C.hair))
    mesh.name='HairSpike_'+index
    mesh.position.set(x,y,z).addScaledVector(direction,height/2)
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction)
    head.add(mesh)
  })
}

export function attachHeadwear(kit:Kit,head:T.Object3D,style:CharacterParts['headwear']){
  if(!style||style==='none')return undefined
  if(style==='space-helmet')return attachSpaceHelmet(kit,head)
  if(style==='outrider-bow')return attachOutriderHeadwear(kit,head)
  const {colors:C,group,part,round}=kit,wear=group('Headwear_'+style,head)
  if(style==='halo'){
    const ring=solid(kit,new T.TorusGeometry(6.5,.65,4,20),C.gold)
    ring.name='FloatingHalo';ring.rotation.x=Math.PI/2;ring.position.y=10.3;wear.add(ring)
    for(const x of [-3,-1,1])part('HaloGlint',wear,C.featherLight,x,10.9,5.8,.8,.35,.6,.08)
  }else if(style==='wide-brim'){
    const brim=solid(kit,new T.CylinderGeometry(10.9,11.2,.9,16),C.hat)
    brim.position.y=5.6;brim.scale.z=.87;wear.add(brim)
    const edge=solid(kit,new T.CylinderGeometry(11.1,11.1,.35,16),C.hatBand)
    edge.position.y=5.15;edge.scale.z=.87;wear.add(edge)
    const crown=solid(kit,new T.CylinderGeometry(4.9,5.8,4.8,12),C.hat)
    crown.position.y=8.3;crown.scale.z=.9;wear.add(crown)
    const band=solid(kit,new T.CylinderGeometry(5.65,5.8,1.1,12),C.hatBand)
    band.position.y=6.6;band.scale.z=.9;wear.add(band)
    part('HatBadge',wear,C.cream,0,8,5,2,2,.4,.3)
    for(const x of [-.7,0,.7])round('HatPawToe',wear,C.hatBand,x,9.2,5,.5,.5,.3)
  }else{
    // Separate back, crown and cheek folds leave a genuine opening for the face.
    round('HoodBack',wear,C.hood,0,1,-3.2,15.6,14.5,7.8)
    round('HoodCrown',wear,C.hood,0,6,-.3,15.4,5.2,10)
    for(const side of [-1,1]){
      round('HoodSide',wear,C.hood,side*6,1,.5,4,12,9)
      part('HoodInnerRim',wear,C.hoodShade,side*5.5,.1,5,.9,7.4,.7,.2)
      round('HoodCheekFold',wear,C.hood,side*4.9,-3.5,3.2,4.2,3.2,3.2)
      part('HoodStitch',wear,C.jacketLight,side*6.9,1.5,2.7,.45,5.5,.3,.1)
    }
    part('HoodBrowRim',wear,C.hoodShade,0,4.2,5.1,10.8,1.1,.7,.25)
  }
  return wear
}

export function attachTorso(kit:Kit,chest:T.Object3D,upper:T.Object3D,outfit:CharacterParts['outfit']){
  if(outfit==='gi'){attachGi(kit,chest,upper);return}
  if(outfit==='spacesuit'){attachSpacesuit(kit,chest,upper);return}
  if(outfit==='outrider'){attachOutriderTorso(kit,chest,upper);return}
  const {colors:C,part}=kit
  if(outfit==='tunic'){
    part('TunicTorso',chest,C.jacket,0,0,.2,10.5,12.4,6.2,.8)
    part('TunicCollar',chest,C.cream,0,5,3.4,3.4,1.4,.5,.2)
    part('TunicFrontSeam',chest,C.jacketLight,0,-.3,3.5,.6,9.2,.4,.1)
  }else if(outfit==='coat'){
    part('CoatBack',chest,C.hood,0,-.4,-.6,11.6,13.5,6.9,.8)
    for(const side of [-1,1]){
      part('CoatFrontPanel',chest,C.jacket,side*2.7,-.2,3.6,4.4,13,.9,.35)
      const lapel=part('CoatLapel',chest,C.jacketLight,side*1.7,3.3,4.2,1.8,5.7,.6,.15)
      lapel.rotation.z=side*.22
      part('CoatPocket',chest,C.hoodShade,side*3.2,-3,4.25,2.4,2.5,.4,.15)
    }
    for(const y of [21,18,15])part('CoatButton',upper,C.hat,0,y,4.4,.7,.7,.35,.1)
  }
}

export function attachHem(kit:Kit,hip:T.Object3D,outfit:CharacterParts['outfit'],index:number){
  if(outfit!=='tunic'&&outfit!=='coat')return undefined
  const {colors:C,group,part}=kit,long=outfit==='coat'
  const flap=group('GarmentHem_'+index,hip,0,0,0)
  part('HemFabric',flap,long?C.hood:C.jacket,0,long?-3.1:-1.4,-.35,long?6.2:5.7,long?10.6:6.8,6.1,.6)
  part('HemEdge',flap,C.jacketLight,0,long?-8.1:-4.4,2.8,long?6:5.5,.55,.35,.1)
  return flap
}

export function attachSword(kit:Kit,hand:T.Object3D,torso:T.Object3D){
  const {colors:C,group,part}=kit
  const held=group('HeldSword',hand,0,-.2,1.2);held.rotation.z=-.2
  part('SwordGrip',held,C.leather,0,0,0,1.4,3.2,1.4,.15)
  for(const y of [-1,0,1])part('GripWrap',held,C.hatBand,0,y,.73,1.5,.3,.3,.05)
  part('SwordPommel',held,C.metal,0,-2,0,2.1,1,1.8,.3)
  part('SwordGuard',held,C.hat,0,2,0,6.2,1.1,2.1,.2)
  part('SwordBlade',held,C.metal,0,9.1,0,2,13.3,.8,.15)
  part('BladeFuller',held,C.metalShade,.4,9,.47,.45,11.7,.25,.04)
  part('BladeGlint',held,C.cream,-.55,9,.48,.35,11.8,.25,.04)
  const point=solid(kit,new T.ConeGeometry(1.4,3.6,4),C.metal)
  point.name='SwordPoint';point.position.y=17.4;point.scale.z=.35;held.add(point)
  const stowed=group('StowedSword',torso,-4,18,-6.2);stowed.rotation.z=-.28
  part('SwordSheath',stowed,C.leather,0,0,0,2.8,18.5,2.1,.4)
  part('SheathTrim',stowed,C.hat,0,-8.3,0,2.9,1,2.2,.15)
  part('StowedGuard',stowed,C.hat,0,9.7,0,6.2,1.1,2.2,.2)
  part('StowedGrip',stowed,C.leather,0,12.1,0,1.5,3.7,1.5,.15)
  part('StowedPommel',stowed,C.metal,0,14.5,0,2.1,1,1.8,.3)
  return {held,stowed}
}
