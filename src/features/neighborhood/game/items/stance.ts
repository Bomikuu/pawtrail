import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import type {ItemDocument} from './document'

const target=new T.Quaternion(),breath=new T.Quaternion(),rotation=new T.Euler()
/** A weapon owns its upper-body carry; breathing, planted legs and gait remain shared. */
export function applyWeaponStance(rig:Rig,item:ItemDocument,action:string,phase:number){
 const stance=item.stance
 if(!stance||!['idle','walk','run'].includes(action))return
 const moving=action!=='idle',weight=moving?(action==='run'?stance.runWeight:stance.walkWeight):1,t=phase*Math.PI*2
 for(const[joint,angles]of Object.entries(stance.angles)){
  if(!angles)continue
  const node=rig.root.getObjectByName(joint);if(!node)continue
  target.setFromEuler(rotation.set(...angles.map(T.MathUtils.degToRad) as [number,number,number]))
  if(joint==='SpineBend'||joint==='Head'){
   node.quaternion.multiply(new T.Quaternion().slerpQuaternions(new T.Quaternion(),target,weight))
  }else{
   const side=joint.endsWith('Left')?-1:1
   breath.setFromEuler(rotation.set(Math.sin(t-.35)*.009,0,side*Math.sin(t-.5)*.005))
   target.multiply(breath);node.quaternion.slerp(target,weight)
  }
 }
}
