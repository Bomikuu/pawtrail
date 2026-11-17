import * as T from 'three'
import type {Rig} from '../actor-rig/rigs'
import type {MeshVertexEdit,ModelEditorEvent,ModelEditorView,Triple,VertexMeshInfo,VertexOffset,VertexSelection} from './model-document'

type PointGroup={indices:number[]}
type Entry={id:string;label:string;meshes:T.Mesh[];original:T.BufferGeometry;working?:T.BufferGeometry;groups:PointGroup[];offsets:Map<number,Triple>;edit?:MeshVertexEdit;sourceVersion:number;dirty:boolean;added:boolean}
const hiddenProps=/^(OfferedFood|HeldWaterBottle|HeldSupplies|CleaningCloth|SleepPillow|SleepBlanket|JetpackEquipment|PowerAura|CarRide|RainCloud)/
function visible(node:T.Object3D){for(let p:T.Object3D|null=node;p;p=p.parent)if(!p.visible||/Archive/.test(p.name)||hiddenProps.test(p.name)||Math.max(p.scale.x,p.scale.y,p.scale.z)<.01)return false;return true}
function meshId(mesh:T.Mesh,root:T.Object3D){
  const parts:string[]=[]
  for(let node:T.Object3D|null=mesh;node&&node!==root;node=node.parent){const name=(node.name||node.type).replace(/[^a-zA-Z0-9_-]/g,'_'),index=node.parent?.children.filter(child=>(child.name||child.type)===(node!.name||node!.type)).indexOf(node)??0;parts.unshift(name+':'+index)}
  return 'mesh:'+parts.join('/')
}
function pointGroups(geometry:T.BufferGeometry){
  const position=geometry.getAttribute('position'),groups=new Map<string,PointGroup>()
  for(let i=0;i<position.count;i++){const key=[position.getX(i),position.getY(i),position.getZ(i)].map(value=>Math.round(value*10000)).join(':');let group=groups.get(key);if(!group){group={indices:[]};groups.set(key,group)}group.indices.push(i)}
  return [...groups.values()]
}

/** Clones only edited meshes. Offsets are reapplied after procedural animation each frame. */
export class StudioVertexEditor{
  readonly anchor=new T.Object3D()
  private entries=new Map<string,Entry>()
  private view:ModelEditorView|null=null
  private documents:MeshVertexEdit[]=[]
  private pointsGeometry=new T.BufferGeometry()
  private points=new T.Points(this.pointsGeometry,new T.PointsMaterial({color:'#279b85',size:2.2,sizeAttenuation:false,depthTest:true}))
  private wire=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:'#3b7064',wireframe:true,transparent:true,opacity:.35,depthTest:true}))
  private depth=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({colorWrite:false,depthWrite:true,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}))
  private selected=new T.Mesh(new T.SphereGeometry(.4,8,6),new T.MeshBasicMaterial({color:'#f39b3e',depthTest:false}))
  private initialWire=this.wire.geometry
  private initialDepth=this.depth.geometry
  private catalogSignature=''
  private selectionSignature=''
  private events=new AbortController()
  private pointer:number|null=null
  private plane=new T.Plane()
  private dragOffset=new T.Vector3()
  private gizmoDragging=false
  private orbitHeld=false
  constructor(private rig:Rig,private camera:T.Camera,private canvas:HTMLCanvasElement,overlay:T.Scene,private publish:(event:ModelEditorEvent)=>void,private invalidate:()=>void,private toggleOrbit:(enabled:boolean)=>void,private onSelection:()=>void,private overGizmo:()=>boolean,includeBase=true){
    this.points.frustumCulled=false;this.points.renderOrder=3;this.wire.renderOrder=2;this.depth.renderOrder=0;this.selected.renderOrder=4
    this.wire.matrixAutoUpdate=this.depth.matrixAutoUpdate=false
    overlay.add(this.anchor,this.depth,this.wire,this.points,this.selected)
    const meshes:T.Mesh[]=[]
    if(includeBase)rig.root.traverse(node=>{if(node instanceof T.Mesh&&!node.userData.studioGeometryId){for(let p:T.Object3D|null=node;p;p=p.parent)if(/Archive/.test(p.name)||hiddenProps.test(p.name))return;meshes.push(node)}})
    const included=new Set<T.Mesh>()
    for(const mesh of meshes){
      if(included.has(mesh)||!visible(mesh)||!mesh.geometry.getAttribute('position'))continue
      const linked=/face/i.test(mesh.name)?meshes.filter(other=>other.parent===mesh.parent&&other.geometry===mesh.geometry&&/face/i.test(other.name)):[mesh]
      linked.forEach(node=>included.add(node))
      this.register(meshId(mesh,rig.root),mesh.name.replace(/_\d+$/,'').replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' '),linked,false)
    }
    this.emitCatalog()
    canvas.addEventListener('pointerdown',event=>{
      if(this.pointer!==null){event.preventDefault();event.stopImmediatePropagation();return}
      if(!this.active||this.orbitHeld||event.button!==0||this.overGizmo())return
      const point=this.hitPoint(event.clientX,event.clientY);if(point===null)return
      event.preventDefault();event.stopImmediatePropagation();canvas.focus({preventScroll:true})
      this.select(point);this.publish({type:'start'});this.pointer=event.pointerId;this.toggleOrbit(false);canvas.setPointerCapture(event.pointerId)
      const normal=camera.getWorldDirection(new T.Vector3());this.plane.setFromNormalAndCoplanarPoint(normal,this.anchor.position)
      const ray=this.ray(event.clientX,event.clientY),hit=ray.ray.intersectPlane(this.plane,new T.Vector3())
      this.dragOffset.copy(this.anchor.position).sub(hit??this.anchor.position)
    },{capture:true,signal:this.events.signal})
    canvas.addEventListener('pointermove',event=>{
      if(this.pointer!==event.pointerId)return
      event.preventDefault();event.stopImmediatePropagation()
      const hit=this.ray(event.clientX,event.clientY).ray.intersectPlane(this.plane,new T.Vector3());if(hit)this.moveWorld(hit.add(this.dragOffset))
    },{capture:true,signal:this.events.signal})
    const end=(event:PointerEvent)=>{if(event.pointerId!==this.pointer)return;event.stopImmediatePropagation();this.pointer=null;this.toggleOrbit(true);if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);this.applyDocuments(this.documents);this.onSelection();this.invalidate()}
    canvas.addEventListener('pointerup',end,{capture:true,signal:this.events.signal});canvas.addEventListener('pointercancel',end,{capture:true,signal:this.events.signal});canvas.addEventListener('lostpointercapture',end,{capture:true,signal:this.events.signal})
    window.addEventListener('blur',()=>this.cancel(),{signal:this.events.signal})
  }
  private register(id:string,label:string,meshes:T.Mesh[],added:boolean){
    const geometry=meshes[0].geometry
    this.entries.set(id,{id,label,meshes,original:geometry,groups:pointGroups(geometry),offsets:new Map(),sourceVersion:-1,dirty:true,added})
  }
  refreshAdded(parts:{id:string;name:string;mesh:T.Mesh}[]){
    const ids=new Set(parts.map(part=>'attachment:'+part.id))
    for(const [id,entry]of this.entries)if(entry.added&&!ids.has(id)){this.restore(entry);this.entries.delete(id)}
    for(const part of parts){const id='attachment:'+part.id,entry=this.entries.get(id);if(!entry)this.register(id,part.name,[part.mesh],true);else entry.label=part.name}
    this.emitCatalog()
  }
  beforeDetach(mesh:T.Mesh){for(const [id,entry]of this.entries)if(entry.meshes.includes(mesh)){this.restore(entry);this.entries.delete(id)}}
  get catalog():VertexMeshInfo[]{return [...this.entries.values()].map(entry=>({id:entry.id,label:entry.label,vertices:entry.original.getAttribute('position').count,points:entry.groups.length,linked:entry.meshes.length,added:entry.added}))}
  private emitCatalog(){const meshes=this.catalog,signature=JSON.stringify(meshes);if(signature!==this.catalogSignature){this.catalogSignature=signature;this.publish({type:'vertex-catalog',meshes})}}
  get active(){return this.view?.mode==='geometry'&&this.view.editMode==='vertices'}
  get dragging(){return this.pointer!==null||this.gizmoDragging}
  get target(){return this.active&&this.view?.vertex!==null&&this.entry?.groups[this.view!.vertex!] ?this.anchor:undefined}
  private get entry(){return this.entries.get(this.view?.mesh??'')}
  private currentMesh(entry:Entry){return entry.meshes.find(visible)??entry.meshes[0]}
  setView(view:ModelEditorView){const changed=this.view?.mesh!==view.mesh||this.view?.vertex!==view.vertex;this.view=view;if(!this.active)this.cancel();if(changed)this.selectionSignature='';this.invalidate()}
  applyDocuments(documents:MeshVertexEdit[]){
    this.documents=documents
    if(this.dragging)return
    for(const edit of documents){const entry=this.entries.get(edit.mesh);if(!entry||edit.vertexCount!==entry.original.getAttribute('position').count)throw new Error('A saved vertex edit does not match this model. Reset vertex edits or reload its original character.')}
    for(const entry of this.entries.values()){
      const edit=documents.find(row=>row.mesh===entry.id)
      if(edit===entry.edit)continue
      entry.edit=edit;entry.offsets=new Map((edit?.offsets??[]).map(([index,x,y,z])=>[index,[x,y,z] as Triple]));entry.dirty=true
      if(!entry.offsets.size)this.restore(entry)
    }
    this.invalidate()
  }
  private ray(x:number,y:number){const rect=this.canvas.getBoundingClientRect(),ray=new T.Raycaster();this.camera.updateMatrixWorld(true);ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),this.camera);return ray}
  private hitPoint(x:number,y:number){
    const entry=this.entry;if(!entry)return null
    const mesh=this.currentMesh(entry),position=(entry.working??entry.original).getAttribute('position'),rect=this.canvas.getBoundingClientRect(),ray=this.ray(x,y),hits=ray.intersectObject(mesh,false)
    let best=10*10,result:number|null=null,depth=Infinity
    entry.groups.forEach((group,index)=>{
      const point=new T.Vector3().fromBufferAttribute(position,group.indices[0]).applyMatrix4(mesh.matrixWorld),projected=point.clone().project(this.camera)
      if(projected.z<-1||projected.z>1)return
      if(hits[0]&&point.clone().sub(ray.ray.origin).dot(ray.ray.direction)>hits[0].distance+1.5)return
      const distance=((projected.x+1)*rect.width/2-(x-rect.left))**2+((1-projected.y)*rect.height/2-(y-rect.top))**2
      if(distance<best-.1||Math.abs(distance-best)<=.1&&projected.z<depth){best=distance;depth=projected.z;result=index}
    });return result
  }
  meshAt(x:number,y:number){const hit=this.ray(x,y).intersectObject(this.rig.root,true).find(hit=>visible(hit.object));if(!hit)return;return [...this.entries.values()].find(entry=>entry.meshes.includes(hit.object as T.Mesh))?.id}
  select(point:number){if(!this.view)return;this.view={...this.view,vertex:point};this.updateFrame();this.emitSelection();this.onSelection();this.invalidate()}
  moveLocal(position:Triple){const entry=this.entry;if(entry)this.moveWorld(this.currentMesh(entry).localToWorld(new T.Vector3().fromArray(position)))}
  moveWorld(world:T.Vector3){
    const entry=this.entry,point=this.view?.vertex;if(!entry||point===null||point===undefined||!entry.groups[point])return
    const newIndices=entry.groups[point].indices.filter(index=>!entry.offsets.has(index)).length
    if(entry.offsets.size+newIndices>8192||this.documents.reduce((count,edit)=>count+edit.offsets.length,0)+newIndices>100_000||!this.documents.some(edit=>edit.mesh===entry.id)&&this.documents.length>=64){this.publish({type:'model-error',message:'This character reached its vertex-edit limit. Reset an edited mesh before editing another.'});return}
    if(this.view?.snap)world=world.clone().set(...world.toArray().map(value=>Math.round(value*2)/2) as Triple)
    const mesh=this.currentMesh(entry),target=mesh.worldToLocal(world.clone()),base=entry.original.getAttribute('position')
    for(const index of entry.groups[point].indices){const offset:[number,number,number]=[target.x-base.getX(index),target.y-base.getY(index),target.z-base.getZ(index)].map(value=>T.MathUtils.clamp(value,-40,40)) as Triple;if(offset.every(value=>Math.abs(value)<.00001))entry.offsets.delete(index);else entry.offsets.set(index,offset)}
    const edit:MeshVertexEdit={mesh:entry.id,vertexCount:base.count,offsets:[...entry.offsets].sort((a,b)=>a[0]-b[0]).map(([index,delta])=>[index,...delta] as VertexOffset)}
    entry.edit=edit;entry.dirty=true;this.applyEntry(entry);this.anchor.position.copy(world);this.publish({type:'vertices',edit});this.updateFrame();this.emitSelection();this.invalidate()
  }
  private applyEntry(entry:Entry){
    if(!entry.offsets.size)return
    const source=entry.original.getAttribute('position')
    if(!entry.working){entry.working=entry.original.clone();entry.working.userData={...entry.working.userData,sharedActorGeometry:false};entry.meshes.forEach(mesh=>mesh.geometry=entry.working!)}
    const sourceVersion=source instanceof T.BufferAttribute?source.version:source.data.version
    if(!entry.dirty&&entry.sourceVersion===sourceVersion)return
    const target=entry.working.getAttribute('position') as T.BufferAttribute
    for(let i=0;i<source.count;i++){const delta=entry.offsets.get(i);target.setXYZ(i,source.getX(i)+(delta?.[0]??0),source.getY(i)+(delta?.[1]??0),source.getZ(i)+(delta?.[2]??0))}
    target.needsUpdate=true;entry.working.computeVertexNormals();entry.working.computeBoundingBox();entry.working.computeBoundingSphere();entry.sourceVersion=sourceVersion;entry.dirty=false
  }
  updateFrame(){
    for(const entry of this.entries.values())this.applyEntry(entry)
    const entry=this.entry,active=!!(this.active&&entry);this.points.visible=this.wire.visible=this.depth.visible=active;this.selected.visible=false
    if(!active||!entry)return
    const mesh=this.currentMesh(entry),geometry=entry.working??entry.original,position=geometry.getAttribute('position')
    this.wire.geometry=this.depth.geometry=geometry;this.wire.matrix.copy(mesh.matrixWorld);this.depth.matrix.copy(mesh.matrixWorld);this.wire.matrixWorldNeedsUpdate=this.depth.matrixWorldNeedsUpdate=true
    let points=this.pointsGeometry.getAttribute('position') as T.BufferAttribute|undefined
    if(!points||points.count!==entry.groups.length){points=new T.BufferAttribute(new Float32Array(entry.groups.length*3),3);this.pointsGeometry.setAttribute('position',points)}
    entry.groups.forEach((group,index)=>{const p=new T.Vector3().fromBufferAttribute(position,group.indices[0]).applyMatrix4(mesh.matrixWorld);points!.setXYZ(index,p.x,p.y,p.z)})
    points.needsUpdate=true
    const vertex=this.view?.vertex
    if(vertex!==null&&vertex!==undefined&&entry.groups[vertex]){this.selected.position.fromBufferAttribute(points,vertex);this.selected.visible=true;if(!this.gizmoDragging){this.anchor.position.copy(this.selected.position);this.anchor.updateMatrixWorld(true)}}
    this.emitSelection()
  }
  private emitSelection(){
    const entry=this.entry,point=this.view?.vertex;let selection:VertexSelection|null=null
    if(this.active&&entry&&point!==null&&point!==undefined&&entry.groups[point]){const group=entry.groups[point],position=(entry.working??entry.original).getAttribute('position');selection={mesh:entry.id,point,indices:group.indices,position:[position.getX(group.indices[0]),position.getY(group.indices[0]),position.getZ(group.indices[0])]}}
    const signature=JSON.stringify(selection)
    if(signature!==this.selectionSignature){this.selectionSignature=signature;this.publish({type:'select-vertex',selection})}
  }
  setGizmoDragging(active:boolean){this.gizmoDragging=active;if(!active)this.applyDocuments(this.documents)}
  withOriginalGeometry(pose:()=>void){
    const edited=[...this.entries.values()].filter(entry=>entry.working)
    for(const entry of edited)entry.meshes.forEach(mesh=>mesh.geometry=entry.original)
    try{pose()}finally{for(const entry of edited)entry.meshes.forEach(mesh=>mesh.geometry=entry.working!)}
  }
  setTemporaryOrbit(active:boolean){this.orbitHeld=active;if(active)this.cancel()}
  cancel(){const pointer=this.pointer;this.pointer=null;if(pointer!==null){if(this.canvas.hasPointerCapture(pointer))this.canvas.releasePointerCapture(pointer);this.toggleOrbit(true)}this.invalidate()}
  private restore(entry:Entry){if(entry.working){entry.meshes.forEach(mesh=>mesh.geometry=entry.original);entry.working.dispose();entry.working=undefined}entry.sourceVersion=-1;entry.dirty=true}
  dispose(){this.events.abort();this.cancel();for(const entry of this.entries.values())this.restore(entry);this.entries.clear();this.pointsGeometry.dispose();(this.points.material as T.Material).dispose();(this.wire.material as T.Material).dispose();(this.depth.material as T.Material).dispose();this.initialWire.dispose();this.initialDepth.dispose();this.selected.geometry.dispose();(this.selected.material as T.Material).dispose()}
}
