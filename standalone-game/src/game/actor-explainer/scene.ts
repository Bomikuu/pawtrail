import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {disposeRig,appearancePalette,type Rig} from '../actor-rig/rigs'
import {defaultAppearance,type ActorAppearance} from '../actor-rig/appearance'
import {ACTOR_CAMERA,createActorCamera,configureActorRenderer,CREATOR_FRAME} from '../actor-rig/pixel-stage'
import {PixelFinish} from '../actor-rig/pixel-renderer'
import {prepareCreatorModel,creatorModelFactory} from '../creator/preview-models'
import {actorPreviews} from '../runtime/actor-previews'
import {lessonPhase,type ExplainerState,type ExplainerView} from './lesson'

type Binding={mesh:T.Mesh;original:T.Material|T.Material[]}
type Actor={rig:Rig;scene:T.Scene;canvas:HTMLCanvasElement;context:CanvasRenderingContext2D;host:HTMLElement;visible:boolean;bindings:Binding[];finish:PixelFinish;bones:T.Group;line:T.LineSegments;points:T.Mesh[];joints:T.Object3D[];links:number[][];wire:T.MeshBasicMaterial;clay:T.MeshLambertMaterial;highlight:T.MeshLambertMaterial;highlightWire:T.MeshBasicMaterial}
const jointNames=['Head','ChestBreath','SpineBend','ShoulderLeft','ElbowLeft','WristLeft','ShoulderRight','ElbowRight','WristRight','HipLeft','KneeLeft','AnkleLeft','HipRight','KneeRight','AnkleRight']
const links=[[0,1],[1,2],[1,3],[3,4],[4,5],[1,6],[6,7],[7,8],[2,9],[9,10],[10,11],[2,12],[12,13],[13,14]]
function isPart(mesh:T.Mesh,part:ExplainerState['focus']){
  if(part==='none')return false
  for(let node:T.Object3D|null=mesh;node;node=node.parent){
    const name=node.name.toLowerCase()
    if(part==='ribbon'&&name.includes('ribbon')||part==='hair'&&(name.includes('hair')||name.includes('fringe')||name.includes('lock'))||part==='cape'&&name.includes('cape'))return true
  }
  return false
}
/** Amber-only teaching viewport. Uses her real model; never modifies saved actors. */
export class ActorExplainerScene{
  private renderer!:T.WebGLRenderer
  private camera=createActorCamera()
  private controls!:OrbitControls
  private actors:Actor[]=[]
  private readback=document.createElement('canvas')
  private readContext!:CanvasRenderingContext2D
  private observer!:ResizeObserver
  private raf=0
  private disposed=false
  private state:ExplainerState={progress:0,zoom:1,joints:false,focus:'none',move:true,jumpHeight:12,danceEnergy:1}
  private events=new AbortController()
  private lost=false
  static async create(host:HTMLElement,onError:(message:string)=>void,onZoom:(zoom:number)=>void){
    await prepareCreatorModel('amber')
    return new ActorExplainerScene(host,onError,onZoom)
  }
  private constructor(host:HTMLElement,private onError:(message:string)=>void,private onZoom:(zoom:number)=>void){
    try{
      this.renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true,premultipliedAlpha:false,powerPreference:'low-power'})
      configureActorRenderer(this.renderer);this.renderer.setSize(CREATOR_FRAME.width,CREATOR_FRAME.height,false)
      this.controls=new OrbitControls(this.camera,host)
      this.controls.target.set(...ACTOR_CAMERA.target);this.controls.enableDamping=true;this.controls.dampingFactor=.15
      this.controls.enablePan=false;this.controls.enableZoom=false;this.controls.rotateSpeed=.7
      this.controls.minPolarAngle=.18;this.controls.maxPolarAngle=Math.PI*.85
      this.controls.addEventListener('change',()=>this.requestDraw())
      this.view('quarter')
      host.addEventListener('wheel',event=>{
        event.preventDefault()
        const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?host.clientHeight:1)
        const zoom=T.MathUtils.clamp(this.state.zoom*Math.exp(-T.MathUtils.clamp(delta,-100,100)*.003),.7,1.45)
        this.state={...this.state,zoom};this.onZoom(zoom);this.requestDraw()
      },{passive:false,signal:this.events.signal})
      host.addEventListener('keydown',event=>{
        const angles:Record<string,[number,number]>={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]}
        const turn=angles[event.key]
        if(!turn)return
        event.preventDefault()
        const offset=this.camera.position.clone().sub(this.controls.target),spherical=new T.Spherical().setFromVector3(offset)
        spherical.theta+=turn[0];spherical.phi=T.MathUtils.clamp(spherical.phi+turn[1],this.controls.minPolarAngle,this.controls.maxPolarAngle)
        this.camera.position.copy(this.controls.target).add(new T.Vector3().setFromSpherical(spherical));this.controls.update();this.requestDraw()
      },{signal:this.events.signal})
      this.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();this.lost=true;onError('The 3D preview was interrupted. Retry to reopen it.')},{signal:this.events.signal})
      this.readback.width=CREATOR_FRAME.width;this.readback.height=CREATOR_FRAME.height
      const context=this.readback.getContext('2d',{willReadFrequently:true})
      if(!context)throw new Error('Canvas rendering is unavailable in this browser.')
      this.readContext=context
      const base=defaultAppearance(),row=actorPreviews.find(item=>item.id==='amber-outrider')
      if(!row)throw new Error('Amber’s appearance could not be found.')
      const amber={...base,parts:{...base.parts,...row.parts},colors:{...base.colors,...row.colors},accessories:{...base.accessories,...row.accessories},face:{...base.face,...row.face}} as ActorAppearance
      this.actors.push(this.makeActor(host,creatorModelFactory('amber')!(amber),amber))
      this.observer=new ResizeObserver(()=>{this.resize();this.requestDraw()})
      this.observer.observe(host)
      this.resize()
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.requestDraw()},{signal:this.events.signal})
      this.requestDraw()
    }catch(error){this.dispose();throw error}
  }
  private makeActor(host:HTMLElement,rig:Rig,appearance:ActorAppearance):Actor{
    const canvas=document.createElement('canvas');canvas.width=CREATOR_FRAME.width;canvas.height=CREATOR_FRAME.height
    canvas.style.imageRendering='pixelated';canvas.setAttribute('aria-hidden','true');host.append(canvas)
    const context=canvas.getContext('2d')
    if(!context){canvas.remove();disposeRig(rig);throw new Error('The character canvas could not open.')}
    const bindings:Binding[]=[]
    rig.root.traverse(node=>{if(node instanceof T.Mesh)bindings.push({mesh:node,original:node.material})})
    const bones=new T.Group(),lineGeometry=new T.BufferGeometry()
    lineGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(links.length*6),3))
    const line=new T.LineSegments(lineGeometry,new T.LineBasicMaterial({color:'#287467',depthTest:false}));line.renderOrder=100;bones.add(line)
    const sphere=new T.SphereGeometry(.65,8,6),jointMaterial=new T.MeshBasicMaterial({color:'#175a50',depthTest:false})
    const points=jointNames.map(()=>{const point=new T.Mesh(sphere,jointMaterial);point.renderOrder=101;bones.add(point);return point})
    const scene=new T.Scene(),key=new T.DirectionalLight('#fff9ee',1.1);key.position.set(-30,60,45)
    scene.add(rig.root,bones,new T.AmbientLight('#ffffff',.75),key)
    return {rig,scene,canvas,context,host,visible:true,bindings,finish:new PixelFinish(appearancePalette(appearance)),bones,line,points,joints:jointNames.map(name=>rig.root.getObjectByName(name)!),links,wire:new T.MeshBasicMaterial({color:'#417f75',wireframe:true,side:T.DoubleSide}),clay:new T.MeshLambertMaterial({color:'#bbc3bb',side:T.DoubleSide}),highlight:new T.MeshLambertMaterial({color:'#dd8a41',side:T.DoubleSide}),highlightWire:new T.MeshBasicMaterial({color:'#b75b24',wireframe:true,side:T.DoubleSide})}
  }
  private resize(){
    for(const actor of this.actors){
      const width=actor.host.clientWidth,height=actor.host.clientHeight;actor.visible=width>0&&height>0
      if(!actor.visible)continue
      const style=getComputedStyle(actor.host),availableHeight=height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)
      const scale=Math.max(1,Math.floor(Math.min(width/CREATOR_FRAME.width,availableHeight/CREATOR_FRAME.height)))
      actor.canvas.style.width=CREATOR_FRAME.width*scale+'px';actor.canvas.style.height=CREATOR_FRAME.height*scale+'px'
    }
  }
  setState(state:ExplainerState){this.state=state;this.requestDraw()}
  view(view:ExplainerView){
    const angle={front:0,quarter:Math.PI/4,side:Math.PI/2}[view]
    this.camera.position.set(Math.sin(angle)*90,56,Math.cos(angle)*90)
    this.controls.target.set(...ACTOR_CAMERA.target);this.controls.update();this.requestDraw()
  }
  texture(surface:string):HTMLCanvasElement|undefined{
    for(const binding of this.actors[0]?.bindings??[])for(const material of Array.isArray(binding.original)?binding.original:[binding.original]){
      const map=(material as T.MeshBasicMaterial).map
      if(map?.userData.studioSurface===surface&&map.image instanceof HTMLCanvasElement)return map.image
    }
  }
  private requestDraw(){
    if(this.disposed||this.raf||document.hidden||this.lost)return
    this.raf=requestAnimationFrame(()=>{this.raf=0;try{this.draw()}catch(error){this.lost=true;this.onError(error instanceof Error?error.message:'The preview could not render. Retry to reopen it.')}})
  }
  private draw(){
    const state=this.state,stage=lessonPhase(state.progress),phase=(state.progress-stage*100)/100,t=phase*Math.PI*2
    this.camera.zoom=(stage===6?.7:.85)*state.zoom;this.camera.updateProjectionMatrix()
    this.controls.update()
    for(const actor of this.actors){
      if(!actor.visible)continue
      const {rig}=actor,action=stage===5?'walk':stage===7?'dance':'idle'
      // Earlier layers are intentionally still: the animation phase reveals motion.
      rig.pose(action,stage<4?0:stage===5?(phase*2)%1:phase,{secondaryMotion:{phase:stage<4?0:phase,locomotion:stage===5?1:0}})
      rig.root.position.set(0,0,0)
      rig.root.rotation.y=0
      let lift=0
      if(stage===5&&state.move){rig.root.position.x=Math.sin(t)*7;rig.root.position.z=Math.cos(t)*3;rig.root.rotation.y=Math.atan2(Math.cos(t)*7,-Math.sin(t)*3)}
      if(stage===6){
        const flight=T.MathUtils.clamp((phase-.18)/.64,0,1),air=phase>.18&&phase<.82?Math.sin(flight*Math.PI):0
        const crouch=phase<=.18?Math.sin(phase/.18*Math.PI/2):phase>=.82?Math.sin((phase-.82)/.18*Math.PI):0
        lift=air*state.jumpHeight;rig.root.position.y=lift-crouch*.7
        for(const side of ['Left','Right']){
          const hip=rig.root.getObjectByName('Hip'+side),knee=rig.root.getObjectByName('Knee'+side),shoulder=rig.root.getObjectByName('Shoulder'+side),elbow=rig.root.getObjectByName('Elbow'+side)
          if(hip)hip.rotation.x-=crouch*.3+air*.12
          if(knee)knee.rotation.x+=crouch*.7+air*.35
          if(shoulder)shoulder.rotation.x-=air*.85+crouch*.2
          if(elbow)elbow.rotation.x-=air*.5
        }
      }
      if(stage===7){for(const name of ['RescuerStance','SpineBend','ShoulderLeft','ShoulderRight','HipLeft','HipRight']){const node=rig.root.getObjectByName(name);if(node){node.rotation.x*=state.danceEnergy;node.rotation.y*=state.danceEnergy;node.rotation.z*=state.danceEnergy}}}
      for(const binding of actor.bindings){
        binding.mesh.material=isPart(binding.mesh,state.focus)?stage===1?actor.highlightWire:actor.highlight:stage===1?actor.wire:stage===2?actor.clay:binding.original
      }
      // Compute real world-space joints before hiding geometry in the rig phase.
      rig.root.updateMatrixWorld(true)
      const positions=actor.joints.map(node=>node?.getWorldPosition(new T.Vector3())??new T.Vector3())
      const attribute=actor.line.geometry.getAttribute('position') as T.BufferAttribute
      actor.links.forEach(([a,b],i)=>{const start=positions[a],end=positions[b];attribute.setXYZ(i*2,start.x,start.y,start.z);attribute.setXYZ(i*2+1,end.x,end.y,end.z)})
      attribute.needsUpdate=true;actor.line.geometry.computeBoundingSphere()
      actor.points.forEach((point,i)=>point.position.copy(positions[i]));actor.bones.visible=stage===0||state.joints
      rig.root.visible=stage!==0
      this.renderer.render(actor.scene,this.camera)
      const width=CREATOR_FRAME.width,height=CREATOR_FRAME.height,c=actor.context
      this.readContext.clearRect(0,0,width,height);this.readContext.drawImage(this.renderer.domElement,0,0)
      if(stage>=3&&!state.joints&&state.focus==='none')this.readContext.putImageData(actor.finish.finish(this.readContext.getImageData(0,0,width,height),2),0,0)
      c.clearRect(0,0,width,height);this.ground(c,rig.root.position.x,rig.root.position.z,lift,stage)
      c.drawImage(this.readback,0,0)
    }
  }
  private ground(c:CanvasRenderingContext2D,x:number,z:number,lift:number,stage:number){
    const project=(x:number,z:number)=>{const v=new T.Vector3(x,-1,z).project(this.camera);return [(v.x+1)*CREATOR_FRAME.width/2,(1-v.y)*CREATOR_FRAME.height/2]}
    c.strokeStyle='#c7d2bf';c.lineWidth=.5
    for(let i=-24;i<=24;i+=8){const a=project(i,-24),b=project(i,24),e=project(-24,i),f=project(24,i);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(e[0],e[1]);c.lineTo(f[0],f[1]);c.stroke()}
    if(stage===0)return
    const [sx,sy]=project(x,z),scale=1-lift/40
    c.fillStyle=`rgba(50,65,45,${Math.max(.08,.24-lift*.008)})`;c.beginPath();c.ellipse(sx,sy,12*scale*this.state.zoom,4*scale*this.state.zoom,0,0,Math.PI*2);c.fill()
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.raf);this.events.abort();this.observer?.disconnect();this.controls?.dispose()
    for(const actor of this.actors){
      actor.bindings.forEach(binding=>{binding.mesh.material=binding.original});disposeRig(actor.rig)
      actor.line.geometry.dispose();(actor.line.material as T.Material).dispose()
      actor.points[0]?.geometry.dispose();(actor.points[0]?.material as T.Material|undefined)?.dispose()
      actor.wire.dispose();actor.clay.dispose();actor.highlight.dispose();actor.highlightWire.dispose();actor.canvas.remove()
    }
    this.actors=[];this.renderer?.dispose();this.renderer?.forceContextLoss()
  }
}
