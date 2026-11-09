import * as T from 'three'
import {solid,type PartKit as Kit} from './part-kit'

export function attachLongHair(kit:Kit,head:T.Object3D){
  const {colors:C,group,round,paint}=kit,roots:T.Group[]=[],tails:T.Group[]=[]
  paint(round('LongHairCrown',head,C.hair,0,3.7,-.6,13.5,6.3,10.1))
  paint(round('LongHairCapBack',head,C.hair,0,1,-2.8,13,10.6,6.8))
  const fringe=paint(round('LongPartedFringe',head,C.hair,-2.6,2.8,3.7,8.3,3.4,3.2));fringe.rotation.z=.22
  paint(round('LongFringeRight',head,C.hair,4,2.2,3.3,3.2,4,2.8))
  const back=group('LongHairBackRoot',head,0,-1.2,-4.8);roots.push(back)
  paint(round('BackHairCurtain',back,C.hair,0,-4.5,0,11.2,11,3.2))
  const backTail=group('LongHairBackTail',back,0,-8.5,0);tails.push(backTail)
  paint(round('BackHairSoftEnds',backTail,C.hair,0,-3.4,.1,10,8.4,2.9))
  for(const side of [-1,1]){
    const lock=group('LongHairSideRoot_'+side,head,side*5.25,-.2,1.8);roots.push(lock)
    paint(round('SideHairCurtain',lock,C.hair,0,-4.7,0,3.6,11.8,3.9))
    const tail=group('LongHairSideTail_'+side,lock,0,-9,0);tails.push(tail)
    paint(round('SideHairSoftEnd',tail,C.hair,side*.25,-2.8,.1,3.3,7.4,3.2))
  }
  return {roots,tails}
}

export function attachGownBodice(kit:Kit,chest:T.Object3D,upper:T.Object3D){
  const {colors:C,part,round}=kit
  round('GownBodice',chest,C.gown,0,.2,.15,9.2,12.7,6)
  part('GownNeckline',chest,C.gownLight,0,5.3,3.1,4.2,1.5,.6,.35)
  part('BodiceFrontFold',chest,C.gownLight,-1.9,.3,3.2,.8,8.7,.5,.2)
  part('BodiceSideFold',chest,C.gownShade,3.7,-.8,2.2,.6,7.8,.5,.15)
  part('GoldWaistSash',upper,C.gold,0,14.4,0,10.3,1.7,6.8,.4)
  round('WaistRose',upper,C.ribbon,0,14.6,3.7,2.3,2.1,.8)
  for(const side of [-1,1]){
    const loop=round('BackSashBow',upper,C.ribbon,side*2.1,14.8,-3.8,4,2.8,1.5);loop.rotation.z=side*.3
    const tail=part('SashRibbonTail',upper,C.ribbon,side*1.1,12,-3.8,1.1,4.6,.5,.2);tail.rotation.z=side*.18
  }
}

/** A continuous bell skirt, attached to the pelvis rather than a trouser leg. */
export function attachGownSkirt(kit:Kit,stance:T.Object3D){
  const {colors:C,group}=kit,root=group('GownSkirt',stance,0,14.1,0)
  const levels=[0,-4.1,-8.4,-12.6],radii=[4.6,6.2,8.1,10]
  for(let panel=0;panel<12;panel++){
    const vertices:number[]=[],indices:number[]=[]
    for(let level=0;level<levels.length;level++)for(let column=0;column<3;column++){
      const angle=(panel+column/2)*Math.PI/6
      const radius=radii[level]+(column===1?.32:0)
      vertices.push(Math.sin(angle)*radius,levels[level],Math.cos(angle)*radius)
    }
    for(let row=0;row<3;row++)for(let col=0;col<2;col++){
      const a=row*3+col,b=a+1,c=a+3,d=a+4
      indices.push(a,c,b,b,c,d)
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals()
    const mesh=solid(kit,geometry,panel%3===0?C.gownLight:panel%3===1?C.gown:C.gownShade)
    mesh.name='GownPleat_'+panel
    root.add(mesh)
  }
  const hem=solid(kit,new T.TorusGeometry(10,.28,4,24),C.gold)
  hem.name='GownGoldHem';hem.rotation.x=Math.PI/2;hem.position.y=-12.5;root.add(hem)
  const inner=solid(kit,new T.CylinderGeometry(4.3,9.5,12.4,12,1),C.gownShade)
  inner.name='GownUnderskirt';inner.position.y=-6.3;root.add(inner)
  return root
}

export type AngelWing={root:T.Group;elbow:T.Group;side:number}
export function attachAngelWings(kit:Kit,torso:T.Object3D){
  const {colors:C,group,round,part}=kit,wings:AngelWing[]=[]
  const feather=(parent:T.Object3D,name:string,x:number,y:number,z:number,length:number,width:number,angle:number)=>{
    const joint=group(name,parent,x,y,z);joint.rotation.z=angle
    round('FeatherVane',joint,C.feather,0,-length/2,0,width,length,1.8)
    part('FeatherShaft',joint,C.featherShade,0,-length/2+.3,.95,.3,length-1.6,.25,.05)
    part('FeatherGlint',joint,C.featherLight,-.45,-length*.43,1,.35,length*.48,.25,.06)
  }
  for(const side of [-1,1]){
    const root=group('AngelWingRoot_'+side,torso,side*4.4,24.5,-4.4)
    round('WingShoulderDown',root,C.featherShade,side*2.2,1,0,5.8,8,3.3)
    const cover=round('WingUpperCurve',root,C.feather,side*5,4.5,0,10.4,6,3.5);cover.rotation.z=side*.35
    const elbow=group('AngelWingElbow_'+side,root,side*7,5,0)
    for(let i=0;i<7;i++)feather(elbow,'PrimaryFeather_'+side+'_'+i,side*(-.5+i*1.6),1.5-i*.6,0,13-i*.55,3.1,side*(.2+i*.11))
    for(let i=0;i<5;i++)feather(root,'CoverFeather_'+side+'_'+i,side*(2+i*1.8),5-i*.2,1.2,7-i*.25,3.3,side*(.2+i*.13))
    wings.push({root,elbow,side})
  }
  return wings
}
