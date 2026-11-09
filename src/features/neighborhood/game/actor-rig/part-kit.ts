import * as T from 'three'

export type PartKit = {
  colors: Record<string,string>
  group: (name:string,parent:T.Object3D,x?:number,y?:number,z?:number)=>T.Group
  part: (name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number,bevel?:number)=>T.Mesh
  round: (name:string,parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>T.Mesh
  paint: (mesh:T.Mesh)=>T.Mesh
  shade: (geometry:T.BufferGeometry)=>T.BufferGeometry
}

export function solid(kit:PartKit,geometry:T.BufferGeometry,color:string){
  return new T.Mesh(kit.shade(geometry),new T.MeshBasicMaterial({color,vertexColors:true,toneMapped:false}))
}

