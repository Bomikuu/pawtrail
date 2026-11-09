import * as T from 'three'
import {solid,type PartKit} from './part-kit'
import {attachLifeSupport} from './costume-parts'

/** Existing oxygen pack gains temporary outboard thrusters and fuel lines. */
export function attachJetpack(kit:PartKit,upper:T.Object3D,needsPack:boolean){
  const {colors:C,group,part,round}=kit,root=group('JetpackEquipment',upper)
  if(needsPack)attachLifeSupport(kit,root)
  for(const side of [-1,1]){
    part('ThrusterArm',root,C.metalShade,side*6.1,18,-6.8,5.4,1.5,2,.25)
    round('ThrusterHousing',root,C.metal,side*7.8,17.8,-6.8,4.8,5.5,4.8)
    const bell=solid(kit,new T.CylinderGeometry(1.7,2.6,2.7,8),C.metalShade)
    bell.name='JetNozzle_'+side;bell.position.set(side*7.8,14.4,-6.8);root.add(bell)
    const core=solid(kit,new T.CylinderGeometry(1.7,1.9,.5,8),C.gold)
    core.name='HotNozzleCore_'+side;core.position.set(side*7.8,13,-6.8);root.add(core)
    part('ThrusterWarningStripe',root,C.orange,side*7.8,17.7,-9.3,3.4,.8,.4,.08)
    part('FuelLine',root,C.hatBand,side*5.5,19.2,-7.8,.7,6.5,.7,.15)
  }
  return root
}
