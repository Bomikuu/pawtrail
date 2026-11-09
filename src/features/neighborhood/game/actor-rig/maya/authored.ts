import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { acquirePortraitStage, PORTRAIT_SIZE, PORTRAIT_FRAMES } from '../portrait-stage'
import type { ActorAppearance } from '../appearance'
import { gameAppearance } from '../game-appearances'
import { defaultPortraitView, portraitYaw, type PortraitView } from '../portrait-state'
import { reference, referenceCamera, projectLandmark, initialCalibration, type Calibration, type LandmarkPositions } from './reference'

const directory='/pawtrail-game/game-assets/maya-reference-v5/'
type Rect=[number,number,number,number]
type Atlas={url:string;faceMaterial:string;regions:{id:'eyes'|'brows'|'mouth';target:Rect;frames:Record<string,Rect>}[]}
export type MayaManifest={version:1;status:string;modelUrl:string|null;requiredNodes:string[];referenceConfigUrl?:string;calibration?:Calibration;expressionAtlas:Atlas|null;semanticMasks:{material:string;url:string}[];modules?:{slot:'hair'|'clothing'|'headwear';choice:string;modelUrl:string;target:string}[];viewCorrectives?:{morph:string;yaw:number;width:number}[];note?:string}
export async function loadMayaManifest():Promise<MayaManifest>{
  const response=await fetch(directory+'manifest.json',{cache:'no-store'})
  if(!response.ok)throw new Error('Maya asset manifest could not load.')
  const manifest=await response.json()
  if(manifest.version!==1||!Array.isArray(manifest.requiredNodes)||!Array.isArray(manifest.semanticMasks)||manifest.modelUrl!==null&&typeof manifest.modelUrl!=='string')throw new Error('Unsupported Maya asset manifest.')
  if(!manifest.calibration&&manifest.referenceConfigUrl){
    const r=await fetch(localURL(manifest.referenceConfigUrl),{cache:'no-store'});if(!r.ok)throw new Error('Saved Maya reference camera could not load.')
    const data=await r.json();manifest.calibration={...data.camera,yaw:data.pose.yaw,headTilt:data.pose.headTilt}
  }
  if(manifest.calibration){const c=manifest.calibration;if(![c.height,c.near,c.far,c.yaw,c.headTilt].every(Number.isFinite)||![c.position,c.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))||c.height<=0||c.near<=0||c.far<=c.near)throw new Error('Invalid saved Maya calibration.')}
  return manifest
}
function localURL(value:string){if(!value.startsWith(directory))throw new Error('Maya assets must use the local versioned asset directory.');return value}
async function image(url:string){const result=new Image();result.src=localURL(url);await result.decode();return result}
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))
/** Red-channel role IDs: 1 skin, 2 hair, 3 vest, 4 shirt, 5/6 image-left/right iris. */
function recolor(canvas:HTMLCanvasElement,mask:HTMLImageElement|undefined,a:ActorAppearance){
  if(!mask)return
  const p=canvas.getContext('2d')!,copy=document.createElement('canvas');copy.width=canvas.width;copy.height=canvas.height
  const c=copy.getContext('2d')!;c.drawImage(mask,0,0,copy.width,copy.height)
  const d=p.getImageData(0,0,canvas.width,canvas.height),m=c.getImageData(0,0,copy.width,copy.height).data
  const base=gameAppearance('maya')!.appearance
  const palettes=[[],[a.colors.skinShadow,a.colors.skin,a.colors.skinLight],[a.colors.hairShade,a.colors.hair,a.colors.hairLight],[a.colors.jacketDark,a.colors.jacket,a.colors.jacketLight],[a.colors.shirtDark,a.colors.shirt,a.colors.shirtLight],[a.colors.ink,a.face.rightEye,a.colors.cream],[a.colors.ink,a.face.leftEye,a.colors.cream]]
  const original=[undefined,base.colors.skin,base.colors.hair,base.colors.jacket,base.colors.shirt,base.face.rightEye,base.face.leftEye]
  for(let i=0;i<d.data.length;i+=4){const role=m[i];if(role<1||role>6||m[i+3]<128||palettes[role][1]===original[role])continue
    const colors=palettes[role].map(rgb),value=d.data[i]*.299+d.data[i+1]*.587+d.data[i+2]*.114
    const t=Math.max(0,Math.min(1.999,(value-20)/220*2)),segment=Math.floor(t)
    for(let channel=0;channel<3;channel++)d.data[i+channel]=Math.round(colors[segment][channel]+(colors[segment+1][channel]-colors[segment][channel])*(t-segment))
  }
  p.putImageData(d,0,0)
}

export class AuthoredMayaRenderer {
  readonly assetSource='authored' as const
  private shared=acquirePortraitStage()
  private scene=new T.Scene()
  private camera:T.OrthographicCamera
  private root!:T.Object3D
  private head!:T.Object3D
  private baseHead=new T.Quaternion()
  private atlas?:HTMLImageElement
  private faceCanvas?:HTMLCanvasElement
  private faceBase?:HTMLCanvasElement
  private faceTexture?:T.CanvasTexture
  private faceMask?:HTMLImageElement
  private textures=new Set<T.Texture>()
  private materials=new Set<T.Material>()
  private geometries=new Set<T.BufferGeometry>()
  private frames=new Map<string,ImageData>()
  private neutralMorphs=new Map<T.Mesh,number[]>()
  private disposed=false
  private constructor(private appearance:ActorAppearance,private manifest:MayaManifest,private calibration:Calibration){this.camera=referenceCamera(calibration)}
  static async create(appearance:ActorAppearance,manifest:MayaManifest,calibration?:Calibration){
    if(!manifest.modelUrl)throw new Error('Authored Maya GLB is not installed. The current bust is a prototype.')
    const renderer=new AuthoredMayaRenderer(appearance,manifest,calibration??manifest.calibration??initialCalibration)
    try{await renderer.load();return renderer}catch(error){renderer.dispose();throw error}
  }
  private async load(){
    const gltf=await new GLTFLoader().loadAsync(localURL(this.manifest.modelUrl!))
    this.root=gltf.scene;this.scene.add(this.root)
    this.root.traverse(node=>{if(node instanceof T.Mesh){this.geometries.add(node.geometry);for(const mat of Array.isArray(node.material)?node.material:[node.material]){this.materials.add(mat);for(const value of Object.values(mat))if(value instanceof T.Texture)this.textures.add(value)}}})
    const missing=this.manifest.requiredNodes.filter(name=>!this.root.getObjectByName(name))
    if(missing.length)throw new Error('Maya GLB is missing: '+missing.join(', '))
    if(this.root.getObjectByName('MayaPortraitRoot')?.userData.authoringStatus==='procedural-starter-not-approved')throw new Error('The starter GLB is diagnostic, not an authored Maya asset. Complete and review the artist rebuild before installation.')
    this.head=this.root.getObjectByName('MayaHead')!;this.baseHead.copy(this.head.quaternion)
    for(const module of this.manifest.modules??[]){
      const chosen=module.slot==='clothing'?this.appearance.parts.outfit:module.slot==='headwear'?this.appearance.parts.headwear:this.appearance.parts.hair
      if(chosen!==module.choice)continue
      const target=this.root.getObjectByName(module.target)
      if(!target||target instanceof T.Mesh)throw new Error('Authored module target must be a group: '+module.target)
      const replacement=await new GLTFLoader().loadAsync(localURL(module.modelUrl));target.clear();target.add(replacement.scene)
      replacement.scene.traverse(node=>{if(node instanceof T.Mesh){this.geometries.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material]){this.materials.add(material);for(const value of Object.values(material))if(value instanceof T.Texture)this.textures.add(value)}}})
    }
    if(this.manifest.expressionAtlas)this.atlas=await image(this.manifest.expressionAtlas.url)
    const masks=new Map<string,HTMLImageElement>()
    for(const item of this.manifest.semanticMasks)masks.set(item.material,await image(item.url))
    const replacements=new Map<T.Material,T.MeshBasicMaterial>()
    this.root.traverse(node=>{
      if(!(node instanceof T.Mesh))return
      if(node.morphTargetInfluences)this.neutralMorphs.set(node,[...node.morphTargetInfluences])
      const source=Array.isArray(node.material)?node.material:[node.material]
      const output=source.map(original=>{
        const existing=replacements.get(original);if(existing)return existing
        const input=original as T.MeshBasicMaterial
        const material=new T.MeshBasicMaterial({name:input.name,color:input.map?'#ffffff':input.color,map:input.map,transparent:input.transparent,opacity:input.opacity,alphaTest:input.alphaTest,side:input.side,toneMapped:false})
        this.materials.add(material)
        replacements.set(original,material)
        if(input.map){
          input.map.colorSpace=T.SRGBColorSpace;input.map.magFilter=input.map.minFilter=T.NearestFilter;input.map.generateMipmaps=false;input.map.needsUpdate=true
          const base=document.createElement('canvas'),source=input.map.image as CanvasImageSource & {width:number;height:number}
          base.width=source.width;base.height=source.height;const p=base.getContext('2d')!;p.imageSmoothingEnabled=false;p.drawImage(source,0,0)
          const colored=document.createElement('canvas');colored.width=base.width;colored.height=base.height;colored.getContext('2d')!.drawImage(base,0,0);recolor(colored,masks.get(input.name),this.appearance)
          const texture=new T.CanvasTexture(colored);texture.colorSpace=T.SRGBColorSpace;texture.flipY=input.map.flipY;texture.magFilter=texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;this.textures.add(texture);material.map=texture
          if(input.name===this.manifest.expressionAtlas?.faceMaterial){this.faceBase=base;this.faceCanvas=colored;this.faceTexture=texture;this.faceMask=masks.get(input.name)}
        }
        return material
      })
      node.material=Array.isArray(node.material)?output:output[0]
    })
    if(this.atlas&&!this.faceCanvas)throw new Error('Expression atlas face material was not found in the GLB.')
  }
  private pose(index:number,view:PortraitView){
    const phase=index/PORTRAIT_FRAMES,t=phase*Math.PI*2,expression=view.talking?'talking':view.expression
    const blink=Math.abs(phase-.34)<.025||Math.abs(phase-.82)<.025
    const mouth=expression==='talking'?Math.max(0,Math.sin(index*1.75))*.8:expression==='happy'?.18:0
    this.root.rotation.y=portraitYaw(view.yaw)
    this.head.quaternion.copy(this.baseHead)
    this.head.rotateZ((view.headTilt??this.calibration.headTilt)+(view.steady?0:Math.sin(t+.8)*.015))
    if(!view.steady){this.head.rotateX(Math.sin(t*2)*.018);this.head.rotateY(Math.sin(t)*.035)}
    this.root.traverse(node=>{if(node instanceof T.Mesh&&node.morphTargetDictionary&&node.morphTargetInfluences){for(const [name,slot] of Object.entries(node.morphTargetDictionary)){
      const corrective=this.manifest.viewCorrectives?.find(item=>item.morph===name)
      const amount=corrective?Math.max(0,1-Math.abs(portraitYaw(view.yaw-corrective.yaw))/Math.max(.01,corrective.width)):0
      node.morphTargetInfluences[slot]=corrective?amount*amount*(3-2*amount):name==='jawOpen'?mouth:name==='smileCheeks'?(expression==='smile'||expression==='happy'?1:0):name==='blink_L'||name==='blink_R'?(blink?1:0):(this.neutralMorphs.get(node)?.[slot]??0)
    }}})
    if(this.faceCanvas&&this.faceBase&&this.atlas&&this.manifest.expressionAtlas){
      const p=this.faceCanvas.getContext('2d')!;p.clearRect(0,0,this.faceCanvas.width,this.faceCanvas.height);p.drawImage(this.faceBase,0,0)
      for(const region of this.manifest.expressionAtlas.regions){
        const state=region.id==='eyes'?(blink?'blink':expression==='happy'?'happy':'neutral'):region.id==='mouth'&&expression==='talking'?['talk_closed','talk_A','talk_O','talk_E'][index%4]:expression==='idle'?'neutral':expression
        const rect=region.frames[state]??region.frames.neutral
        if(rect)p.drawImage(this.atlas,...rect,...region.target)
      }
      recolor(this.faceCanvas,this.faceMask,this.appearance);this.faceTexture!.needsUpdate=true
    }
  }
  frame(index:number,view:PortraitView=defaultPortraitView){
    index=((Math.floor(index)%PORTRAIT_FRAMES)+PORTRAIT_FRAMES)%PORTRAIT_FRAMES
    const key=JSON.stringify([index,view.yaw,view.expression,!!view.talking,!!view.steady,view.headTilt])
    this.pose(index,view) // Keep actual node transforms current even on a cached frame.
    const cached=this.frames.get(key);if(cached)return cached
    const {renderer,context}=this.shared;if(renderer.getContext().isContextLost())throw new Error('Maya renderer interrupted.')
    renderer.render(this.scene,this.camera);context.clearRect(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE);context.drawImage(renderer.domElement,0,0)
    const result=context.getImageData(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE)
    // Preserve the artist's colors and selective outlines; no new contour/quantization pass.
    if(this.frames.size>=24)this.frames.delete(this.frames.keys().next().value!)
    this.frames.set(key,result);return result
  }
  getLandmarks():LandmarkPositions{
    this.root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true)
    const result:LandmarkPositions={}
    for(const landmark of reference.landmarks){const node=this.root.getObjectByName(landmark.node);if(node)result[landmark.id]=projectLandmark(node.getWorldPosition(new T.Vector3()),this.camera)}
    return result
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());this.root?.clear();this.frames.clear();this.neutralMorphs.clear();this.shared.release()}
}
