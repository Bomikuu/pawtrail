import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import type {SkinSheet} from './textures'

export type PanelLayout='legacy-24'|'joint-panels-v2'
export type Panel={id:string;label:string;bone:string;width:number;height:number;pixels:readonly[number,number];position:readonly[number,number,number];yaw:number;pivot?:readonly[number,number];floatingPosition?:readonly[number,number,number]}
const directions=[['front',0],['back',Math.PI],['right',Math.PI/2],['left',-Math.PI/2]]as const
const legacySilhouettePanels:Panel[]=[
 // Match each physical aspect ratio to its canvas: imported art is never
 // stretched just because the side of the body is narrower than the front.
 ...directions.map(([direction,yaw])=>({id:'layer-head-'+direction,label:'Head & hair · '+direction,bone:'Head',width:22.4,height:28,pixels:[128,160]as const,position:[Math.sin(yaw)*6.3,2,Math.cos(yaw)*6.3]as const,yaw})),
 ...directions.map(([direction,yaw])=>({id:'layer-garment-'+direction,label:'Garment · '+direction,bone:'ChestBreath',width:24,height:36,pixels:[128,192]as const,position:[Math.sin(yaw)*5.6,-2,Math.cos(yaw)*5.6]as const,yaw})),
 ...(['Left','Right']as const).flatMap(side=>(['Shoulder','Elbow','Hip','Knee']as const).flatMap(bone=>(['front','back']as const).map(direction=>({id:'layer-'+bone.toLowerCase()+'-'+side.toLowerCase()+'-'+direction,label:({Shoulder:'Upper arm',Elbow:'Forearm',Hip:'Thigh',Knee:'Shin'}[bone])+' '+side.toLowerCase()+' · '+direction,bone:bone+side,width:8,height:12,pixels:[64,96]as const,position:[0,-2.5,direction==='front'?3.5:-3.5]as const,yaw:direction==='front'?0:Math.PI})))),
]
const parts=[
 {bone:'Shoulder',label:'Upper arm',depth:2.1,centerZ:0,pivot:[.5,.25]as const},
 {bone:'Elbow',label:'Forearm',depth:1.65,centerZ:0,pivot:[.5,.25]as const},
 {bone:'Wrist',label:'Hand',depth:1.75,centerZ:.3,pivot:[.5,.5]as const},
 {bone:'Hip',label:'Thigh',depth:2.7,centerZ:0,pivot:[.5,.25]as const},
 {bone:'Knee',label:'Shin',depth:2,centerZ:0,pivot:[.5,.25]as const},
 {bone:'Ankle',label:'Foot',depth:3.05,centerZ:.95,pivot:[.5,1/3]as const},
]as const
/** All directional drawings share a joint-space origin, with padded margins. */
export const silhouettePanels:Panel[]=[
 ...legacySilhouettePanels.slice(0,8).map(spec=>{const depth=spec.bone==='Head'?.8:.6;return {...spec,pivot:[.5,.5]as const,floatingPosition:[Math.sin(spec.yaw)*depth,spec.position[1],Math.cos(spec.yaw)*depth]as const}}),
 ...(['Left','Right']as const).flatMap(side=>parts.flatMap(part=>directions.map(([direction,yaw])=>({
  id:'layer-'+part.bone.toLowerCase()+'-'+side.toLowerCase()+'-'+direction,
  label:part.label+' '+side.toLowerCase()+' · '+direction,bone:part.bone+side,
  width:8,height:12,pixels:[64,96]as const,pivot:part.pivot,
  position:[Math.sin(yaw)*part.depth,0,part.centerZ+Math.cos(yaw)*part.depth]as const,
  floatingPosition:[Math.sin(yaw)*.04,0,part.centerZ+Math.cos(yaw)*.04]as const,yaw,
 })))),
]
export const getSilhouettePanels=(layout:PanelLayout)=>layout==='legacy-24'?legacySilhouettePanels:silhouettePanels
export type SilhouetteLayer={spec:Panel;mesh:T.Mesh;canvas:HTMLCanvasElement;map:T.CanvasTexture}
/** Full-image transparent cards; no box atlas or projection onto body vertices. */
export function attachSilhouetteLayers(rig:Rig,layout:PanelLayout='joint-panels-v2'):SilhouetteLayer[]{
 return getSilhouettePanels(layout).map(spec=>{
  const bone=rig.root.getObjectByName(spec.bone);if(!bone)throw Error('Missing silhouette joint: '+spec.bone)
  const canvas=document.createElement('canvas');[canvas.width,canvas.height]=spec.pixels
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.minFilter=map.magFilter=T.NearestFilter;map.generateMipmaps=false;map.userData.studioSurface=spec.id
  const [px,py]=spec.pivot??[.5,.5],geometry=new T.PlaneGeometry(spec.width,spec.height,1,1)
  geometry.translate((.5-px)*spec.width,(py-.5)*spec.height,0)
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({map,side:T.FrontSide,alphaTest:.5,toneMapped:false}))
  mesh.name='Silhouette_'+spec.id;mesh.userData.silhouetteLayer=spec.id;mesh.position.set(...spec.position);mesh.rotation.y=spec.yaw;bone.add(mesh)
  return {spec,mesh,canvas,map}
 })
}
export function silhouetteSheet(layer:SilhouetteLayer):SkinSheet{
 const [px,py]=layer.spec.pivot??[.5,.5]
 return {id:layer.spec.id,label:layer.spec.label,color:'#ffffff',pieces:[],width:layer.canvas.width,height:layer.canvas.height,group:'Silhouettes',layout:'silhouette',meshes:[layer.mesh.name],description:`Whole-image artwork follows ${layer.spec.bone}. Its joint pivot is at pixel ${Math.round(px*layer.canvas.width)}, ${Math.round(py*layer.canvas.height)}; align artwork to the drawing reference. Transparent margins can extend beyond the body. Each direction retains the same joint pivot.`}
}
/** Draw a separate reference from actual base geometry, never into the texture. */
export function drawSilhouetteGuide(layer:SilhouetteLayer,context:CanvasRenderingContext2D,rig:Rig){
 rig.root.updateMatrixWorld(true)
 const inverse=layer.mesh.matrixWorld.clone().invert(),p=new T.Vector3(),w=layer.canvas.width,h=layer.canvas.height,[px,py]=layer.spec.pivot??[.5,.5]
 context.save();context.fillStyle='#d5c6a0';context.strokeStyle='#9ac8c0';context.lineWidth=.35;context.globalAlpha=.16
 rig.root.getObjectByName(layer.spec.bone)?.traverse(node=>{
  if(!(node instanceof T.Mesh)||!node.visible||node.userData.silhouetteLayer)return
  for(let parent:T.Object3D|null=node;parent;parent=parent.parent){
   if(!parent.visible||/Archive/.test(parent.name))return
   // Show only this joint's artwork region. Including a bent child forearm in
   // the upper-arm guide would encourage painting across an animation seam.
   if(parent.name===layer.spec.bone)break
   if(/^(Head|ChestBreath|(Shoulder|Elbow|Wrist|Hip|Knee|Ankle)(Left|Right))$/.test(parent.name))return
  }
  const matrix=new T.Matrix4().multiplyMatrices(inverse,node.matrixWorld),geometry=node.geometry,positions=geometry.getAttribute('position'),indices=geometry.index,count=indices?indices.count:positions.count
  for(let i=0;i<count;i+=3){context.beginPath();for(let j=0;j<3;j++){const index=indices?indices.getX(i+j):i+j;p.fromBufferAttribute(positions,index).applyMatrix4(matrix);const x=(p.x/layer.spec.width+px)*w,y=(py-p.y/layer.spec.height)*h;if(j)context.lineTo(x,y);else context.moveTo(x,y)}context.closePath();context.fill()}
 })
 context.globalAlpha=.7;context.strokeStyle='#e6c276';context.setLineDash([2,2]);context.strokeRect(.5,.5,w-1,h-1);context.beginPath();context.moveTo(px*w,0);context.lineTo(px*w,h);context.moveTo(0,py*h);context.lineTo(w,py*h);context.stroke();context.setLineDash([]);context.strokeRect(px*w-2,py*h-2,4,4);context.restore()
}
