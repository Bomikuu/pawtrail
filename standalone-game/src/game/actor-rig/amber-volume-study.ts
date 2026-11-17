import * as T from 'three'
import type {ActorAppearance} from './appearance'
import {createAmberShoulderStudy} from './amber-study-rig'
import {amberTexture,type AmberSurface} from './amber-study-textures'
import type {Rig} from './rigs'

type Ring=readonly [y:number,halfWidth:number,front:number,back:number]
type Fabric='bodice'|'jacket'|'shorts'|'sleeve'

/** Baked, limited-value surface shading; no smooth/specular lighting added. */
function depthPaint(geometry:T.BufferGeometry,preserve=false){
 geometry.computeVertexNormals()
 const normals=geometry.getAttribute('normal'),old=geometry.getAttribute('color'),colors:number[]=[]
 for(let i=0;i<normals.count;i++){
  const front=normals.getZ(i),left=-normals.getX(i),up=normals.getY(i)
  const shade=up>.7?1.04:front>.55?1:front<-.3?.78:left>.25?.94:.84
  for(let c=0;c<3;c++)colors.push((preserve&&old?old.array[i*3+c]:1)*(preserve&&front>.45?1:shade))
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3))
 geometry.computeBoundingBox();geometry.computeBoundingSphere()
 return geometry
}

/** Rounded/tapered cross-sections replace a flat front outline pushed backward. */
function garment(rings:readonly Ring[]){
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[],frontIndices:number[]=[],sideIndices:number[]=[],segments=16
 const width=Math.max(...rings.map(r=>r[1])),bottom=rings.at(-1)![0],height=rings[0][0]-bottom
 const point=(ring:Ring,angle:number)=>{const c=Math.cos(angle);return[Math.sin(angle)*ring[1],ring[0],c*(c>=0?ring[2]:ring[3])] as const}
 for(let r=0;r<rings.length-1;r++)for(let s=0;s<segments;s++){
  const a=s/segments*Math.PI*2,b=(s+1)/segments*Math.PI*2,front=Math.cos((a+b)/2)>.5
  const vertices=[point(rings[r],a),point(rings[r],b),point(rings[r+1],a),point(rings[r+1],b)],start=positions.length/3
  vertices.forEach(([x,y,z],i)=>{
   positions.push(x,y,z)
   uvs.push(front?(x/width+1)/2:(i%2?s+1:s)/segments,(y-bottom)/height)
  })
  ;(front?frontIndices:sideIndices).push(start,start+2,start+1,start+1,start+2,start+3)
 }
 for(const[ring,top]of [[rings[0],true],[rings.at(-1)!,false]] as const)for(let s=0;s<segments;s++){
  const start=positions.length/3,a=point(ring,s/segments*Math.PI*2),b=point(ring,(s+1)/segments*Math.PI*2)
  for(const p of [[0,ring[0],0],a,b]){positions.push(...p);uvs.push(.5,.5)}
  sideIndices.push(start,top?start+1:start+2,top?start+2:start+1)
 }
 indices.push(...frontIndices,...sideIndices)
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices)
 geometry.addGroup(0,frontIndices.length,0);geometry.addGroup(frontIndices.length,sideIndices.length,1)
 return depthPaint(geometry)
}

/** Tiny native side/rear cloth surfaces, using only the actor's existing palette. */
function sidePaint(fabric:Fabric,colors:ActorAppearance['colors']){
 const C=colors,sets={bodice:[C.cream,C.creamShadow,C.featherLight],jacket:[C.jacket,C.jacketDark,C.jacketLight],shorts:[C.shorts,C.shortsDark,C.shortsLight],sleeve:[C.shoe,C.ink,C.shortsDark]}
 const[base,shade,light]=sets[fabric],canvas=document.createElement('canvas');canvas.width=16;canvas.height=32
 const c=canvas.getContext('2d')!;c.fillStyle=base;c.fillRect(0,0,16,32)
 c.fillStyle=shade;c.fillRect(12,0,4,32);c.fillRect(2,8,1,13);c.fillRect(3,21,1,7);c.fillRect(8,4,1,12);c.fillRect(9,16,1,10)
 c.fillStyle=light;c.fillRect(4,2,2,10);c.fillRect(5,12,1,12);c.fillRect(10,5,1,8)
 c.fillStyle=shade;for(let y=2;y<31;y+=4)c.fillRect(14,y,1,2)
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false
 texture.userData.catCoat=true;texture.userData.studioSurface='amber-volume-'+fabric
 return texture
}

function replaceGeometry(mesh:T.Mesh,geometry:T.BufferGeometry){
 const previous=mesh.geometry;mesh.geometry=geometry
 if(!previous.userData.sharedActorGeometry)previous.dispose()
}

/** A review-only fuller Amber; the live roster and the approved face are untouched. */
export function createAmberVolumeStudy(appearance:ActorAppearance):Rig{
 const rig=createAmberShoulderStudy(appearance),sideMaterials=new Map<Fabric,T.MeshBasicMaterial>(),painted=new Map<T.Material,T.Material>()
 const paintedMaterial=(original:T.Material)=>{
  let mat=painted.get(original)
  if(!mat){const clone=(original as T.MeshBasicMaterial).clone();clone.vertexColors=true;mat=clone;painted.set(original,mat)}
  return mat
 }
 const shadeMesh=(mesh:T.Mesh)=>{
  depthPaint(mesh.geometry,!!mesh.geometry.getAttribute('color'))
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(paintedMaterial):paintedMaterial(mesh.material)
 }
 const roundCloth=(mesh:T.Mesh,rings:readonly Ring[],fabric:Fabric)=>{
  const front=paintedMaterial(Array.isArray(mesh.material)?mesh.material[0]:mesh.material)
  let side=sideMaterials.get(fabric)
  if(!side){side=new T.MeshBasicMaterial({map:sidePaint(fabric,appearance.colors),vertexColors:true,side:T.DoubleSide,toneMapped:false});sideMaterials.set(fabric,side)}
  replaceGeometry(mesh,garment(rings));mesh.material=[front,side]
 }
 const inflateRows=(mesh:T.Mesh,factor:number)=>{
  const geometry=mesh.geometry.clone(),p=geometry.getAttribute('position'),rows=new Map<number,{sum:number;count:number}>()
  for(let i=0;i<p.count;i++){const key=Math.round(p.getY(i)*10000),row=rows.get(key)??{sum:0,count:0};row.sum+=p.getZ(i);row.count++;rows.set(key,row)}
  for(let i=0;i<p.count;i++){const row=rows.get(Math.round(p.getY(i)*10000))!,center=row.sum/row.count;p.setZ(i,center+(p.getZ(i)-center)*factor)}
  p.needsUpdate=true;replaceGeometry(mesh,geometry);shadeMesh(mesh)
 }
 rig.root.traverse(node=>{
  if(!(node instanceof T.Mesh))return
  if(node.name==='FittedBodice')roundCloth(node,[[5,4.9,2.95,3.35],[2,5.6,3.35,3.95],[-1,5.15,3.2,3.7],[-3.8,4.5,2.95,3.4],[-5.8,4.3,2.75,3.2]],'bodice')
  else if(node.name==='ShortsWaist')roundCloth(node,[[1,5.25,3.05,3.5],[0,5.25,3.15,3.55],[-1,5.1,3,3.3]],'shorts')
  else if(node.name==='TailoredShorts')roundCloth(node,[[0,2.5,3.05,3.45],[-2.5,2.6,3.25,3.6],[-5.6,2.5,2.85,3.15]],'shorts')
  else if(node.name==='DarkSleeve')roundCloth(node,[[.4,1.5,1.85,2],[-2,1.7,2,2.15],[-3.9,1.6,1.75,1.9]],'sleeve')
  else if(['OpenRedJacket','CapeCollar','GloveCuff','WhiteGlove'].includes(node.name)){
   const geometry=node.geometry.clone();geometry.scale(1,1,node.name==='OpenRedJacket'?1.2:1.08);replaceGeometry(node,geometry);shadeMesh(node)
  }else if(node.name==='GloveHighlight')node.position.z+=.15
  else if(['LayeredHairCrown','FittedGoggleStrap'].includes(node.name)){
   const geometry=node.geometry.clone(),p=geometry.getAttribute('position')
   for(let i=0;i<p.count;i++)if(p.getZ(i)<-.8)p.setZ(i,-.8+(p.getZ(i)+.8)*1.22)
   p.needsUpdate=true;replaceGeometry(node,geometry);shadeMesh(node)
  }else if(['MainSweptFringe','TaperedTempleBang','SharpCheekLock','PointedSideTail','SeparatedBackLock','FineSilhouetteFlick'].includes(node.name)){
   inflateRows(node,node.name==='MainSweptFringe'?1.28:node.name==='SeparatedBackLock'?1.25:1.2)
  }
 })
 // Keep the original cloth deformation, with clearance behind the fuller back.
 const cape=rig.root.getObjectByName('FlexibleCape');if(cape)cape.position.z-=.8
 const referenced=new Set<T.Material>()
 rig.root.traverse(node=>{if(node instanceof T.Mesh)for(const material of Array.isArray(node.material)?node.material:[node.material])referenced.add(material)})
 for(const original of painted.keys())if(!referenced.has(original))original.dispose()
 rig.root.userData.volumeStudy='amber-depth-v1'
 rig.pose('idle',0)
 return rig
}

export function paintAmberVolumeTextures(canvas:HTMLCanvasElement,appearance:ActorAppearance){
 const c=canvas.getContext('2d')!;c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false
 const fronts:AmberSurface[]=['hair-crown','hair-fringe','anime-face','bodice']
 fronts.forEach((surface,i)=>{const map=amberTexture(surface,appearance.colors);c.drawImage(map.image as HTMLCanvasElement,i*64,0,64,96);map.dispose()})
 ;(['bodice','jacket','shorts','sleeve'] as const).forEach((fabric,i)=>{const map=sidePaint(fabric,appearance.colors);c.drawImage(map.image as HTMLCanvasElement,i*64,96,64,96);map.dispose()})
}
