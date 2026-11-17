import * as T from 'three'
import type { Rig } from './rigs'

const actionProps=new Set(['OfferedFood','HeldWaterBottle','HeldSupplies','CleaningCloth','SleepPillow','SleepBlanket','JetpackEquipment'])

/** Replace body art while preserving the base rig's posed, visibility-controlled props. */
export function archiveBodyGeometry(rig:Rig,name:string){
  const archive=new T.Group();archive.name=name;archive.visible=false
  const meshes:T.Mesh[]=[]
  rig.root.traverse(node=>{
    if(!(node instanceof T.Mesh))return
    for(let parent:T.Object3D|null=node;parent;parent=parent.parent)if(actionProps.has(parent.name))return
    meshes.push(node)
  })
  meshes.forEach(mesh=>archive.add(mesh));rig.root.add(archive)
}

/** Use each actor's authored face patches, including closed eyes for resting/emotes. */
export function refinedFaceState(action:string,phase:number,locomoting:boolean){
  const resting=['sleep','sad','happy','laugh','sick','tired'].includes(action)
  const blink=!locomoting&&phase>=.76&&phase<.8
  const closed=resting||blink
  const half=!closed&&(['angry','power_up','power_run'].includes(action)||!locomoting&&phase>=.74&&phase<.82)
  return {closed,half}
}

/** Neck/collar artwork follows the existing spine bend without changing its idle fit. */
export function bindTorsoParts(rig:Rig,names:string[]){
  const torso=rig.root.getObjectByName('SpineBend')
  if(!torso)return
  for(const name of names){
    const node=rig.root.getObjectByName(name)
    if(node&&node.parent!==torso){torso.add(node);node.position.y-=14}
  }
}

export const neutralLimbPose=(action:string)=>action==='idle'
