import * as T from 'three'

/** Thin internal silhouette: softer than the renderer's bold outer pixel contour. */
export function createFaceContour(face:T.BufferGeometry,color:string,width=.45,jaw?:T.Vector3[]){
  const geometry=face.clone();geometry.clearGroups()
  if(!geometry.getAttribute('normal'))geometry.computeVertexNormals()
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal')
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*width,p.getY(i)+n.getY(i)*width,p.getZ(i)+n.getZ(i)*width)
  p.needsUpdate=true
  // An expanded back-face shell remains behind the skin and follows head poses.
  // Opaque depth-tested color avoids an alpha halo or a stroke over facial features.
  const root=new T.Group();root.name='SoftFaceContour'
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color,side:T.BackSide,toneMapped:false}))
  mesh.name='FaceContourShell';root.add(mesh)
  if(jaw){
    // A surface-bound jaw seam remains visible where skin touches the neck;
    // an inverted hull alone can be lost there at native pixel resolution.
    const line=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(jaw,false,'centripetal'),36,width*.4,4,false),new T.MeshBasicMaterial({color,toneMapped:false}))
    line.name='FineJawSeam';root.add(line)
  }
  return root
}
