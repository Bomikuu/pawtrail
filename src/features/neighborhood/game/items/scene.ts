import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {createActorCamera,configureActorRenderer} from '../actor-rig/pixel-stage'
import {PixelFinish} from '../actor-rig/pixel-renderer'
import {createRescuer,appearancePalette,disposeRig,type Rig} from '../actor-rig/rigs'
import {creatorModelFactory,prepareCreatorModel} from '../creator/preview-models'
import {creatorTemplates} from '../creator/state'
import {StudioModelEditor} from '../skin-studio/model-editor'
import {emptyModelDocument,type ModelEditorView,type ModelEditorEvent,type ModelDocument,type Triple} from '../skin-studio/model-document'
import {mountItemRoot,prepareItem,itemPalette} from './equipment'
import {applyItemPose,itemRotation} from './motion'
import {attachHoverChain,hoveringChainWeight} from './hover-chain'
import {attachSpectralGuardian} from './spectral-guardian'
import {applyWeaponStance} from './stance'
import {getAction,hasHoverChain,type ItemDocument,type ActionKey} from './document'
export type ItemCharacter='amber'|'yae'
/** One editable actor, original camera/pixel finish; parts live below its wrist, never in its body export. */
export class ItemScene{
 private renderer:T.WebGLRenderer
 private scene=new T.Scene()
 private camera=createActorCamera()
 private orbit:OrbitControls
 private canvas=document.createElement('canvas')
 private output:CanvasRenderingContext2D
 private raw=document.createElement('canvas')
 private rawContext:CanvasRenderingContext2D
 private rig:Rig
 private model:StudioModelEditor
 private equipment:ReturnType<typeof mountItemRoot>
 private hover:ReturnType<typeof attachHoverChain>
 private guardian:ReturnType<typeof attachSpectralGuardian>|null
 private renderWidth=160
 private renderHeight=192
 private ambientTime=0
 private lastAmbientTime=0
 private ambientFrame=-1
 private editablePart:string|null=null
 private finish:PixelFinish
 private observer:ResizeObserver
 private frame=0
 private disposed=false
 private failed=false
 private paletteKey=''
 private dirty=true
 private visible=true
 private selected:ActionKey='primary'
 private time=0
 private mode='geometry'
 private markers:T.Group
 private doc:ItemDocument
 private appearance
 static async create(host:HTMLElement,character:ItemCharacter,item:ItemDocument,publish:(e:ModelEditorEvent)=>void){await Promise.all([prepareCreatorModel(character),prepareItem(item)]);return new ItemScene(host,character,item,publish)}
 private constructor(private host:HTMLElement,character:ItemCharacter,item:ItemDocument,private publish:(e:ModelEditorEvent)=>void){
  this.doc=item;this.appearance=creatorTemplates.find(p=>p.id===(character==='amber'?'amber-outrider':'yae-miko'))!.appearance
  this.rig=(creatorModelFactory(character)??createRescuer)(this.appearance);this.scene.add(this.rig.root);this.equipment=mountItemRoot(this.rig,item);this.hover=attachHoverChain(this.rig);this.guardian=item.guardian?attachSpectralGuardian(this.rig):null
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});configureActorRenderer(this.renderer);this.renderer.autoClear=false;this.renderer.setSize(160,192,false)
  this.raw.width=160;this.raw.height=192;this.rawContext=this.raw.getContext('2d',{willReadFrequently:true})!;this.output=this.canvas.getContext('2d')!;this.canvas.width=160;this.canvas.height=192;this.canvas.className='block h-full w-auto max-w-full touch-none [image-rendering:pixelated]';host.append(this.canvas)
  this.camera.left=-40;this.camera.right=40;this.camera.top=48;this.camera.bottom=-48;this.camera.updateProjectionMatrix()
  this.orbit=new OrbitControls(this.camera,this.canvas);this.orbit.target.set(0,21.5,0);this.orbit.enablePan=false;this.orbit.minZoom=.6;this.orbit.maxZoom=3;this.orbit.mouseButtons={LEFT:T.MOUSE.ROTATE,MIDDLE:T.MOUSE.DOLLY,RIGHT:T.MOUSE.ROTATE};this.orbit.addEventListener('change',()=>{this.dirty=true});this.orbit.update()
  // Gizmo coordinates use the displayed canvas aspect, matching the pixel camera.
  this.model=new StudioModelEditor(this.rig,this.camera,this.canvas,this.orbit,()=>{this.dirty=true;const palette=[...appearancePalette(this.appearance),...itemPalette(this.doc),...(this.model?.palette??[])],key=palette.join('|');if(key!==this.paletteKey){this.paletteKey=key;this.finish=new PixelFinish(palette)}},publish,{partParent:()=>this.equipment.content,includeBaseVertices:false,flowMotion:true,poseMask:()=>getAction(this.doc,this.selected).mask})
  this.finish=new PixelFinish([...appearancePalette(this.appearance),...itemPalette(item)])
  this.markers=new T.Group();for(const [name,color]of [['Grip','#ffbc52'],['Tip','#73efc7']] as const){const marker=new T.Mesh(new T.SphereGeometry(.8,6,4),new T.MeshBasicMaterial({color,depthTest:false}));marker.name=name;this.markers.add(marker)}this.scene.add(this.markers)
  this.observer=new ResizeObserver(()=>this.fit());this.observer.observe(host);this.fit();this.tick()
 }
 private fit(){
  const box=this.host.getBoundingClientRect();this.visible=box.width>1&&box.height>1
  this.renderWidth=this.doc.guardian||this.doc.equipment.paired?224:160;this.renderHeight=this.doc.guardian||this.doc.equipment.paired?256:192
  this.renderer.setSize(this.renderWidth,this.renderHeight,false);this.raw.width=this.canvas.width=this.renderWidth;this.raw.height=this.canvas.height=this.renderHeight
  this.camera.left=-this.renderWidth/4;this.camera.right=this.renderWidth/4;this.camera.top=this.renderHeight/4;this.camera.bottom=-this.renderHeight/4;this.camera.updateProjectionMatrix()
  const zoom=Math.max(1,Math.floor(Math.min(box.width/this.renderWidth,box.height/this.renderHeight)))
  this.canvas.style.width=this.renderWidth*zoom+'px';this.canvas.style.height=this.renderHeight*zoom+'px';this.dirty=true
 }
 set(item:ItemDocument,action:ActionKey,mode:string,time:number,view:ModelEditorView){this.doc=item;this.selected=action;this.mode=mode;this.time=time;this.editablePart=view.editMode==='vertices'?view.mesh?.replace(/^attachment:/,'')??null:view.geometry;this.equipment.update(item,mode!=='actions');const a=getAction(item,action);this.model.set({...emptyModelDocument(),geometry:item.parts.map(p=>({...p,parent:'Head'})),meshEdits:item.meshEdits,duration:a.duration/1000,pose:this.model.poseAt(time/1000),frames:a.frames,loop:false},{...view,mode:mode==='actions'?'pose':mode==='geometry'?'geometry':'texture',time:time/1000});this.dirty=true}
 setModel(model:ModelDocument,view:ModelEditorView){this.model.set(model,view);this.dirty=true}
 moveVertex(position:Triple){this.model.moveVertex(position)}
 selectVertex(point:number){this.model.selectVertex(point)}
 poseAt(time:number){return this.model.poseAt(time)}
 private tick=(now=performance.now())=>{
  if(this.disposed||this.failed)return
  this.frame=requestAnimationFrame(this.tick)
  const delta=this.lastAmbientTime?Math.min(50,now-this.lastAmbientTime):0;this.lastAmbientTime=now
  if(document.hidden||!this.visible)return
  if(hasHoverChain(this.doc)||this.doc.guardian){
   this.ambientTime+=delta
   const frame=Math.floor(this.ambientTime/50)
   if(frame!==this.ambientFrame){this.ambientFrame=frame;this.dirty=true}
  }
  if(!this.dirty)return
  this.dirty=false
  try{const duration=getAction(this.doc,this.selected).duration;this.model.poseRig(this.selected==='running'&&this.mode==='actions'?'run':'idle',this.selected==='running'&&this.mode==='actions'?this.time/duration:0,{referenceStance:true,gait:this.selected==='running'&&this.mode==='actions'?'run':'walk',secondaryMotion:{phase:(this.time/1800)%1,locomotion:this.mode==='actions'?Math.sin(Math.PI*this.time/duration)*.8:0}});this.equipment.motion.rotation.set(0,0,0)
  if(this.mode==='actions'){this.model.applyPose();this.equipment.motion.rotation.set(...itemRotation(getAction(this.doc,this.selected),this.time).map(T.MathUtils.degToRad) as Triple)}else{if(this.mode!=='geometry'){applyItemPose(this.rig,getAction(this.doc,this.selected),this.time);this.equipment.motion.rotation.set(...itemRotation(getAction(this.doc,this.selected),this.time).map(T.MathUtils.degToRad) as Triple)}this.model.applyPose()}
  if(this.mode!=='actions')applyWeaponStance(this.rig,this.doc,'idle',0)
  this.equipment.pairMotion.rotation.set(-this.equipment.motion.rotation.x,-this.equipment.motion.rotation.y,-this.equipment.motion.rotation.z)
  this.equipment.syncPair()
  const move=this.mode==='actions'?getAction(this.doc,this.selected):undefined
  this.hover.update(this.doc,(this.ambientTime%2400)/2400,hoveringChainWeight(move,this.time))
  this.guardian?.update(this.doc,(this.ambientTime%2400)/2400,0,move,this.time,this.mode==='actions'?this.selected:undefined)
  this.rig.root.traverse(node=>{
   const id=node.userData.studioGeometryId
   if(typeof id==='string'&&id.startsWith('deployed-')){
    const part=this.doc.parts.find(p=>p.id===id)
    node.visible=!!part?.visible&&(!hasHoverChain(this.doc)||this.mode==='geometry'&&this.editablePart===id)
   }
  })
  this.rig.root.updateMatrixWorld(true);this.markers.visible=this.mode==='equip';this.equipment.grip.getWorldPosition(this.markers.children[0].position);this.markers.children[1].position.copy(this.equipment.content.localToWorld(new T.Vector3(...this.doc.equipment.tip)))
  this.renderer.clear();this.renderer.render(this.scene,this.camera);this.rawContext.clearRect(0,0,this.renderWidth,this.renderHeight);this.rawContext.drawImage(this.renderer.domElement,0,0);this.output.putImageData(this.finish.finish(this.rawContext.getImageData(0,0,this.renderWidth,this.renderHeight),2,!!this.doc.guardian),0,0)
  // Render editing handles without quantization so drag controls remain legible.
  this.renderer.clear();this.renderer.render(this.model.overlay,this.camera);this.output.drawImage(this.renderer.domElement,0,0)}catch(error){this.failed=true;this.publish({type:'model-error',message:error instanceof Error?error.message:'Item rendering stopped. Retry the viewport.'})}
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.equipment.disposePair();this.model.dispose();this.hover.dispose();this.guardian?.dispose();this.orbit.dispose();disposeRig(this.rig);this.markers.children.forEach(n=>{const m=n as T.Mesh;m.geometry.dispose();(m.material as T.Material).dispose()});this.renderer.dispose();this.renderer.forceContextLoss();this.canvas.remove()}
}
