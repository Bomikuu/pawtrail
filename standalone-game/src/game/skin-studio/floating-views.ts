import * as T from 'three'
import type {SilhouetteLayer} from './silhouette-layers'

/** Selecting a view changes visibility only. Joint-local position, rotation
 * and artwork pivot remain fixed as the character or camera moves. */
export class FloatingSkinViews{
 private enabled=false
 private groups:SilhouetteLayer[][]
 private selected=new Map<string,SilhouetteLayer>()
 private cameraPoint=new T.Vector3()
 private bonePoint=new T.Vector3()
 private localDirection=new T.Vector3()
 private inverse=new T.Quaternion()
 constructor(private layers:SilhouetteLayer[]){
  const groups=new Map<string,SilhouetteLayer[]>()
  for(const layer of layers){const rows=groups.get(layer.spec.bone)??[];rows.push(layer);groups.set(layer.spec.bone,rows)}
  this.groups=[...groups.values()]
 }
 setEnabled(enabled:boolean){
  if(this.enabled===enabled)return
  this.enabled=enabled;this.selected.clear()
  for(const {spec,mesh}of this.layers){
   mesh.visible=true
   // Registration changes only when explicitly revealing/hiding the base.
   const position=enabled?(spec.floatingPosition??[0,spec.position[1],0]):spec.position
   mesh.position.set(position[0],position[1],position[2])
   mesh.rotation.set(0,spec.yaw,0)
  }
 }
 update(camera:T.Camera,root:T.Object3D){
  if(!this.enabled)return
  root.updateMatrixWorld(true);camera.getWorldPosition(this.cameraPoint)
  for(const group of this.groups){
   const bone=group[0].mesh.parent;if(!bone)continue
   bone.getWorldPosition(this.bonePoint);bone.getWorldQuaternion(this.inverse).invert()
   this.localDirection.copy(this.cameraPoint).sub(this.bonePoint).normalize().applyQuaternion(this.inverse)
   const score=(layer:SilhouetteLayer)=>Math.sin(layer.spec.yaw)*this.localDirection.x+Math.cos(layer.spec.yaw)*this.localDirection.z
   let best=group[0]
   for(const layer of group)if(score(layer)>score(best))best=layer
   const previous=this.selected.get(bone.name)
   // Dead band prevents rapid front/side switching near a diagonal boundary.
   const chosen=previous&&score(best)<score(previous)+.1?previous:best
   this.selected.set(bone.name,chosen)
   for(const layer of group)layer.mesh.visible=layer===chosen
  }
 }
}
