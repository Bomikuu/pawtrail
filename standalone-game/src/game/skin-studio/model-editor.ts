import * as T from 'three'
import {TransformControls} from 'three/addons/controls/TransformControls.js'
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import type {Rig} from '../actor-rig/rigs'
import {studioJoints,emptyModelDocument,type ModelDocument,type ModelEditorView,type ModelEditorEvent,type StudioGeometry,type StudioPose,type Triple} from './model-document'
import {StudioVertexEditor} from './vertex-editor'
import {createStudioGeometry} from './primitives'
import {samplePose} from '../items/motion'

const degrees=(e:T.Euler):Triple=>[e.x,e.y,e.z].map(value=>T.MathUtils.radToDeg(Math.atan2(Math.sin(value),Math.cos(value)))) as Triple
/** Optional studio authoring layer, attached to the existing shared animation hierarchy. */
export class StudioModelEditor{
  readonly overlay=new T.Scene()
  private gizmo:TransformControls
  private parts=new Map<string,{mesh:T.Mesh;signature:string;texture?:string;map?:T.Texture}>()
  private markers=new Map<string,T.Mesh>()
  private document:ModelDocument=emptyModelDocument()
  private view:ModelEditorView={mode:'texture',geometry:null,joint:'ShoulderLeft',transform:'translate',snap:false,time:0,motionPlaying:false,editMode:'object',mesh:null,vertex:null}
  private events=new AbortController()
  private press:{x:number;y:number;pointer:number}|null=null
  private disposed=false
  private temporaryOrbit=false
  private textureColors=new Map<string,string[]>()
  private gizmoDragging=false
  private vertices:StudioVertexEditor
  get dragging(){return this.gizmoDragging||this.vertices.dragging}
  constructor(private rig:Rig,private camera:T.Camera,private canvas:HTMLCanvasElement,private orbit:OrbitControls,private invalidate:(paletteChanged?:boolean)=>void,private publish:(event:ModelEditorEvent)=>void,private options:{partParent?:(part:StudioGeometry)=>T.Object3D;includeBaseVertices?:boolean;poseMask?:()=>readonly string[];flowMotion?:boolean}={}){
    this.gizmo=new TransformControls(camera,canvas);this.gizmo.setSize(.7);this.gizmo.setSpace('local');this.overlay.add(this.gizmo.getHelper())
    this.gizmo.addEventListener('change',()=>invalidate())
    this.gizmo.addEventListener('dragging-changed',event=>{this.gizmoDragging=!!event.value;this.vertices.setGizmoDragging(this.gizmoDragging);this.orbit.enabled=!this.dragging;if(this.gizmoDragging)this.publish({type:'start'});else this.set(this.document,this.view);this.invalidate()})
    this.gizmo.addEventListener('objectChange',()=>{
      const node=this.gizmo.object;if(!node)return
      if(this.vertices.active)this.vertices.moveWorld(node.position)
      else if(this.view.mode==='geometry'&&this.view.geometry)this.publish({type:'geometry',id:this.view.geometry,position:node.position.toArray().map(value=>T.MathUtils.clamp(value,-40,40)) as Triple,rotation:degrees(node.rotation),scale:node.scale.toArray().map(value=>T.MathUtils.clamp(value,.1,30)) as Triple})
      else if(this.view.mode==='pose')this.publish({type:'joint',joint:this.view.joint,rotation:degrees(node.rotation)})
    })
    const sphere=new T.SphereGeometry(.75,8,6)
    for(const [joint]of studioJoints){const marker=new T.Mesh(sphere,new T.MeshBasicMaterial({color:'#248b7a',depthTest:false}));marker.renderOrder=10;this.markers.set(joint,marker);this.overlay.add(marker)}
    this.vertices=new StudioVertexEditor(rig,camera,canvas,this.overlay,publish,()=>invalidate(),enabled=>{this.orbit.enabled=enabled},()=>this.retarget(),()=>!!this.gizmo.axis,options.includeBaseVertices!==false)
    canvas.addEventListener('pointerdown',event=>{if(this.view.mode!=='texture'&&event.button===0)this.press={x:event.clientX,y:event.clientY,pointer:event.pointerId}},{signal:this.events.signal})
    canvas.addEventListener('pointerup',event=>{
      const press=this.press;this.press=null
      if(!press||this.dragging||this.gizmo.axis||event.pointerId!==press.pointer||Math.hypot(event.clientX-press.x,event.clientY-press.y)>5)return
      const box=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((event.clientX-box.left)/box.width*2-1,1-(event.clientY-box.top)/box.height*2),camera)
      if(this.view.mode==='pose'){
        let selected:string|undefined,best=16*16
        for(const [joint,marker]of this.markers){const point=marker.position.clone().project(camera),distance=((point.x+1)*box.width/2-(event.clientX-box.left))**2+((1-point.y)*box.height/2-(event.clientY-box.top))**2;if(distance<best){best=distance;selected=joint}}
        if(selected)this.publish({type:'select-joint',joint:selected as ModelEditorView['joint']})
      }else if(this.view.mode==='geometry'&&this.vertices.active){
        const id=this.vertices.meshAt(event.clientX,event.clientY);if(id)this.publish({type:'select-mesh',id})
      }else if(this.view.mode==='geometry'){
        const hits=ray.intersectObject(rig.root,true).filter(hit=>{for(let p:T.Object3D|null=hit.object;p;p=p.parent)if(!p.visible||/Archive/.test(p.name))return false;return true})
        const id=hits[0]?.object.userData.studioGeometryId
        if(typeof id==='string')this.publish({type:'select-geometry',id})
      }
    },{signal:this.events.signal})
    canvas.addEventListener('pointercancel',()=>{this.press=null},{signal:this.events.signal})
  }
  set(document:ModelDocument,view:ModelEditorView){
    this.document=document;this.view=view
    const ids=new Set(document.geometry.map(part=>part.id))
    for(const [id,entry]of this.parts)if(!ids.has(id)){if(this.gizmo.object===entry.mesh)this.gizmo.detach();this.vertices.beforeDetach(entry.mesh);this.disposePart(entry);this.parts.delete(id);this.textureColors.delete(id)}
    for(const part of document.geometry){
      const signature=part.shape+':'+(part.textureLayout??'single')
      let entry=this.parts.get(part.id)
      if(!entry||entry.signature!==signature){if(entry){this.vertices.beforeDetach(entry.mesh);this.disposePart(entry)}const mesh=new T.Mesh(createStudioGeometry(part.shape,part.textureLayout),new T.MeshBasicMaterial({color:part.color,vertexColors:true,side:T.DoubleSide,alphaTest:.5,toneMapped:false}));mesh.name='StudioGeometry_'+part.id;mesh.userData.studioGeometryId=part.id;entry={mesh,signature};this.parts.set(part.id,entry)}
      const parent=this.options.partParent?.(part)??this.rig.root.getObjectByName(part.parent);if(parent&&entry.mesh.parent!==parent)parent.add(entry.mesh)
      if(!this.dragging){entry.mesh.position.fromArray(part.position);entry.mesh.rotation.set(...part.rotation.map(T.MathUtils.degToRad) as Triple);entry.mesh.scale.fromArray(part.scale)}
      entry.mesh.visible=part.visible
      const material=entry.mesh.material as T.MeshBasicMaterial;material.color.set(part.texture?'#ffffff':part.color)
      if(entry.texture!==part.texture){
        entry.texture=part.texture;entry.map?.dispose();entry.map=undefined;material.map=null;material.needsUpdate=true;this.textureColors.delete(part.id)
        if(part.texture){const image=new Image(),selected=entry,source=part.texture;image.onload=()=>{if(this.disposed||this.parts.get(part.id)!==selected||selected.texture!==source)return;const map=new T.Texture(image);map.colorSpace=T.SRGBColorSpace;map.magFilter=map.minFilter=T.NearestFilter;map.generateMipmaps=false;map.needsUpdate=true;selected.map=map;material.map=map;material.needsUpdate=true;const canvas=window.document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d')!;context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set<string>();for(let i=0;i<pixels.length&&colors.size<128;i+=4)if(pixels[i+3]>=128)colors.add('#'+[0,1,2].map(channel=>pixels[i+channel].toString(16).padStart(2,'0')).join(''));this.textureColors.set(part.id,[...colors]);this.invalidate(true)};image.src=source}
      }
    }
    this.vertices.refreshAdded(document.geometry.map(part=>({id:part.id,name:part.name,mesh:this.parts.get(part.id)!.mesh})))
    this.vertices.setView(view);this.vertices.applyDocuments(document.meshEdits)
    this.retarget();this.overlay.visible=view.mode!=='texture';this.invalidate()
  }
  private retarget(){
    const view=this.view,target=this.vertices.active?this.vertices.target:view.mode==='geometry'?this.parts.get(view.geometry??'')?.mesh:view.mode==='pose'?this.rig.root.getObjectByName(view.joint):undefined
    if(target&&!(view.mode==='pose'&&view.motionPlaying)){if(this.gizmo.object!==target)this.gizmo.attach(target);this.gizmo.setMode(this.vertices.active?'translate':view.mode==='pose'?'rotate':view.transform)}else this.gizmo.detach()
    this.gizmo.setSpace(this.vertices.active?'world':'local');this.gizmo.enabled=view.mode!=='texture'&&!view.motionPlaying&&!this.temporaryOrbit
    this.gizmo.setRotationSnap(view.snap?Math.PI/12:null);this.gizmo.setTranslationSnap(view.snap ? .5 : null);this.gizmo.setScaleSnap(view.snap ? .1 : null)
  }
  get active(){return this.view.mode!=='texture'}
  get posing(){return this.view.mode==='pose'||this.vertices.active}
  get palette(){return [...this.document.geometry.map(part=>part.color),...[...this.textureColors.values()].flat().slice(0,128)]}
  setTemporaryOrbit(active:boolean){this.temporaryOrbit=active;this.vertices.setTemporaryOrbit(active);this.gizmo.enabled=!active&&this.active&&!this.view.motionPlaying;if(active)this.orbit.enabled=true;this.invalidate()}
  private sample(time:number):StudioPose{return samplePose(this.document.frames,time,this.document.pose,this.document.duration,this.document.loop,this.options.flowMotion)}
  applyPose(){
    if(this.view.mode==='pose'&&!this.dragging){const pose=this.view.motionPlaying?this.sample(this.view.time):this.document.pose;for(const [joint]of studioJoints){const node=this.rig.root.getObjectByName(joint);if(node&&(!this.options.poseMask||this.options.poseMask().includes(joint)))node.rotation.set(...(pose.angles[joint]??[0,0,0]).map(T.MathUtils.degToRad) as Triple)}this.rig.root.position.fromArray(pose.root)}
    this.rig.root.updateMatrixWorld(true)
    this.vertices.updateFrame()
    for(const [joint,marker]of this.markers){marker.visible=this.view.mode==='pose'&&!this.view.motionPlaying;this.rig.root.getObjectByName(joint)?.getWorldPosition(marker.position);(marker.material as T.MeshBasicMaterial).color.set(joint===this.view.joint?'#ec9239':'#248b7a')}
  }
  poseAt(time:number){return structuredClone(this.sample(time))}
  poseRig(...args:Parameters<Rig['pose']>){this.vertices.withOriginalGeometry(()=>this.rig.pose(...args))}
  private disposePart(entry:{mesh:T.Mesh;map?:T.Texture}){entry.mesh.removeFromParent();entry.mesh.geometry.dispose();(entry.mesh.material as T.Material).dispose();entry.map?.dispose()}
  moveVertex(position:Triple){this.vertices.moveLocal(position)}
  selectVertex(point:number){this.vertices.select(point)}
  cancelEdit(){this.vertices.cancel();this.gizmo.dragging=false;this.retarget()}
  dispose(){this.disposed=true;this.events.abort();this.gizmo.dispose();this.vertices.dispose();for(const entry of this.parts.values())this.disposePart(entry);this.parts.clear();this.markers.values().next().value?.geometry.dispose();for(const marker of this.markers.values())(marker.material as T.Material).dispose();this.orbit.enabled=true}
}
