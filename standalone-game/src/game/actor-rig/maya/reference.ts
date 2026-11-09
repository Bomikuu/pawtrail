import * as T from 'three'
import reference from './reference.json'
export { reference }
export type Calibration = typeof reference.camera & { yaw:number; headTilt:number }
export type LandmarkPositions = Record<string,[number,number]>
export const initialCalibration:Calibration = {...reference.camera,yaw:reference.pose.yaw,headTilt:reference.pose.headTilt}
export function referenceCamera(calibration:Calibration) {
  const h=calibration.height,camera=new T.OrthographicCamera(-h/2,h/2,h/2,-h/2,calibration.near,calibration.far)
  camera.position.fromArray(calibration.position);camera.lookAt(new T.Vector3().fromArray(calibration.target));camera.updateProjectionMatrix();return camera
}
export function projectLandmark(point:T.Vector3,camera:T.Camera):[number,number] {
  const p=point.clone().project(camera);return [(p.x*.5+.5)*192,(-p.y*.5+.5)*192]
}
/** Locate the actual painted feature on the prototype's UV surface, not its target annotation. */
export function pointAtUV(mesh:T.Mesh,u:number,v:number) {
  const uv=mesh.geometry.getAttribute('uv'),position=mesh.geometry.getAttribute('position'),indices=mesh.geometry.index
  if(!uv)return undefined
  const count=indices?.count??position.count
  for(let face=0;face<count;face+=3){
    const ids=[0,1,2].map(i=>indices?indices.getX(face+i):face+i)
    const [a,b,c]=ids.map(i=>new T.Vector2(uv.getX(i),uv.getY(i)))
    const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y)
    if(Math.abs(denominator)<1e-9)continue
    const x=((b.y-c.y)*(u-c.x)+(c.x-b.x)*(v-c.y))/denominator,y=((c.y-a.y)*(u-c.x)+(a.x-c.x)*(v-c.y))/denominator,z=1-x-y
    if(Math.min(x,y,z)<-.0001)continue
    const p=new T.Vector3()
    ids.forEach((id,i)=>p.addScaledVector(new T.Vector3().fromBufferAttribute(position,id),[x,y,z][i]))
    return mesh.localToWorld(p)
  }
}
