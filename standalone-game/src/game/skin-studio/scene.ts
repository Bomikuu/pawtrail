import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createRescuer, disposeRig, appearancePalette } from '../actor-rig/rigs'
import { defaultAppearance, fittedAppearance, type ActorAppearance } from '../actor-rig/appearance'
import { PixelFinish, humanClips } from '../actor-rig/pixel-renderer'
import { ACTOR_CAMERA, CREATOR_FRAME, createActorCamera, configureActorRenderer } from '../actor-rig/pixel-stage'
import { creatorModelFactory, type CreatorPreviewModel } from '../creator/preview-models'
import type { ModelPaintEvent, ModelPaintHit, ModelPaintOptions } from './painting'
import { faceRect, skinParts, describeSurface, type SkinSheet, type SkinPart } from './textures'
import {StudioModelEditor} from './model-editor'
import type {ModelDocument,ModelEditorView,ModelEditorEvent,Triple} from './model-document'
import {attachSilhouetteLayers,silhouetteSheet,drawSilhouetteGuide,type SilhouetteLayer,type PanelLayout} from './silhouette-layers'
import {FloatingSkinViews} from './floating-views'
/** Preview-only UVs: clone shared geometry before assigning the painting atlas. */
function unwrap(mesh: T.Mesh, piece: number) {
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
  geometry.userData = { ...geometry.userData, sharedActorGeometry: false }
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox!, size = bounds.getSize(new T.Vector3())
  const points = geometry.getAttribute('position'), normals = geometry.getAttribute('normal')
  const uv = new Float32Array(points.count * 2)
  for (let index = 0; index < points.count; index += 3) {
    const normal = new T.Vector3()
    for (let v = index; v < Math.min(index + 3, points.count); v++) normal.add(new T.Vector3().fromBufferAttribute(normals, v))
    const a = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)]
    const axis = a[0] >= a[1] && a[0] >= a[2] ? 'x' : a[1] >= a[2] ? 'y' : 'z'
    const face = axis === 'z' ? normal.z > 0 ? 0 : 1 : axis === 'x' ? normal.x > 0 ? 2 : 3 : normal.y > 0 ? 4 : 5
    const rect = faceRect(piece, face)
    for (let v = index; v < Math.min(index + 3, points.count); v++) {
      const x = (points.getX(v) - bounds.min.x) / size.x
      const y = (points.getY(v) - bounds.min.y) / size.y
      const z = (points.getZ(v) - bounds.min.z) / size.z
      const u = face === 0 ? x : face === 1 ? 1 - x : face === 2 ? 1 - z : face === 3 ? z : x
      const down = face < 4 ? 1 - y : face === 4 ? z : 1 - z
      uv[v * 2] = (rect.x + 1 + u * 30) / 256
      uv[v * 2 + 1] = 1 - (rect.y + 1 + down * 30) / 256
    }
  }
  geometry.setAttribute('uv', new T.BufferAttribute(uv, 2))
  mesh.geometry = geometry
}

export class SkinStudioScene {
  private renderer: T.WebGLRenderer
  private scene = new T.Scene()
  private camera = createActorCamera()
  private controls: OrbitControls
  private rig: ReturnType<typeof createRescuer>
  private display = document.createElement('canvas')
  private readback = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private output: CanvasRenderingContext2D
  private finish: PixelFinish
  private palette: string[]
  private paintOptions:ModelPaintOptions={mode:'orbit',tool:'brush',brush:1,readOnly:false}
  private temporaryOrbit=false
  private paintPointer:number|null=null
  private hoverPoint:{x:number;y:number}|null=null
  private lastPointer:{x:number;y:number}|null=null
  private brushOverlay=document.createElementNS('http://www.w3.org/2000/svg','svg')
  private brushRings=[document.createElementNS('http://www.w3.org/2000/svg','ellipse'),document.createElementNS('http://www.w3.org/2000/svg','ellipse')]
  private onPaint?:(event:ModelPaintEvent)=>void
  private maps = new Map<SkinPart, T.CanvasTexture>()
  private canvases: Record<string, HTMLCanvasElement> = {}
  private originals = new Map<string, Uint8ClampedArray>()
  private bindings = new Map<T.Mesh, string[]>()
  private paintBindings: {mesh:T.Mesh; part:string; piece:number; applied:boolean; original:T.Material|T.Material[]}[] = []
  private sourceMaterials = new Set<T.Material>()
  private observer: ResizeObserver
  private visibility: IntersectionObserver
  private events = new AbortController()
  private raf = 0
  private active = true
  private disposed = false
  private dirty = true
  private elapsed = 0
  private previous = 0
  private clip = 'idle'
  private playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private modeling:StudioModelEditor
  private geometryDocument:ModelDocument['geometry']|undefined
  private silhouetteLayers:SilhouetteLayer[]=[]
  private baseVisibility=new Map<T.Mesh,boolean>()
  private baseBodyVisible=true
  private baseHairVisible=true
  private floatingViews?:FloatingSkinViews
  constructor(private host: HTMLElement, textures: Record<SkinPart, HTMLCanvasElement>, appearance: ActorAppearance = defaultAppearance(), model: CreatorPreviewModel = 'shared', onSheets?: (sheets: SkinSheet[], canvases: Record<SkinPart, HTMLCanvasElement>) => void, onPick?: (part:string, x:number, y:number) => void, onPaint?:(event:ModelPaintEvent)=>void, onModelEdit?:(event:ModelEditorEvent)=>void, classicBase=false,panelLayout:PanelLayout='joint-panels-v2',private baseOnly=false) {
    this.onPaint=onPaint
    const factory=creatorModelFactory(model)
    this.rig = factory?factory(fittedAppearance(appearance)):createRescuer({...fittedAppearance(appearance),baseModel:classicBase?'classic':'refined-v2'})
    this.palette = appearancePalette(appearance)
    this.finish = new PixelFinish(this.palette)
    const sheets: SkinSheet[] = model === 'shared' ? skinParts.map(sheet => ({...sheet, meshes:[]})) : []
    this.canvases = model === 'shared' ? {...textures} : {}
    const nativeMaps = new Map<T.Texture, {map:T.CanvasTexture; id:string}>()
    const materialCopies = new Map<T.Material, T.Material>()
    const seenIds = new Set<string>()
    this.renderer = new T.WebGLRenderer({antialias:false, alpha:true, preserveDrawingBuffer:true, premultipliedAlpha:false, powerPreference:'low-power'})
    configureActorRenderer(this.renderer)
    this.renderer.setSize(CREATOR_FRAME.width, CREATOR_FRAME.height, false)
    this.display.width = this.readback.width = CREATOR_FRAME.width
    this.display.height = this.readback.height = CREATOR_FRAME.height
    this.context = this.readback.getContext('2d', {willReadFrequently:true})!
    this.output = this.display.getContext('2d')!
    this.display.className = 'block shrink-0 touch-none [image-rendering:pixelated]'
    this.display.setAttribute('aria-label', 'Character in the actor preview pixel style. Orbit mode: drag to rotate and pinch to zoom. Ctrl or Cmd plus scroll zooms. Paint mode: drag to paint mapped surfaces.')
    this.display.tabIndex=0
    host.append(this.display)
    this.brushOverlay.classList.add('pointer-events-none','absolute','inset-0','size-full','overflow-hidden')
    this.brushOverlay.setAttribute('aria-hidden','true');this.brushOverlay.style.display='none'
    this.brushRings.forEach((ring,index)=>{ring.setAttribute('fill','none');ring.setAttribute('stroke',index?'#ffffff':'#171717');ring.setAttribute('stroke-width',index?'1':'3');ring.setAttribute('vector-effect','non-scaling-stroke');this.brushOverlay.append(ring)})
    host.append(this.brushOverlay)
    this.controls = new OrbitControls(this.camera, this.display)
    this.controls.target.set(...ACTOR_CAMERA.target)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = true
    this.controls.touches.TWO=T.TOUCH.DOLLY_ROTATE
    this.controls.mouseButtons.RIGHT=T.MOUSE.ROTATE
    this.controls.minZoom = .5
    this.controls.maxZoom = 3
    this.controls.minPolarAngle = .12
    this.controls.maxPolarAngle = Math.PI * .85
    this.controls.addEventListener('change', () => {this.dirty = true})
    if (model === 'shared') for (const part of ['shirt','pants','shoes']) this.maps.set(part, this.texture(textures[part]))
    if(model==='shared'&&!classicBase){
      this.silhouetteLayers=attachSilhouetteLayers(this.rig,panelLayout)
      for(const layer of this.silhouetteLayers){this.maps.set(layer.spec.id,layer.map);this.canvases[layer.spec.id]=layer.canvas;this.bindings.set(layer.mesh,[layer.spec.id]);sheets.push(silhouetteSheet(layer))}
      this.floatingViews=new FloatingSkinViews(this.silhouetteLayers)
    }
    this.rig.root.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) this.sourceMaterials.add(material)
      if(object.userData.silhouetteLayer)return
      let ancestor:T.Object3D|null = object
      while (ancestor) {if (/Archive/.test(ancestor.name)) return; ancestor = ancestor.parent}
      if (model !== 'shared') {
        const ids:string[] = []
        const bind = (source:T.Material) => {
          const material = source as T.MeshBasicMaterial, original = material.map
          if (!original?.image) {ids.push(''); return source}
          const surface = String(original.userData.studioSurface ?? object.name ?? 'Material')
          // Amber's earlier head study remains hidden in the refined rig, for disposal only.
          if (model === 'amber' && ['face','face-half','face-closed','hair'].includes(surface) && !object.visible) {ids.push(''); return source}
          let entry = nativeMaps.get(original)
          if (!entry) {
            let id = 'map-' + surface, suffix = 2
            while (seenIds.has(id)) id = 'map-' + surface + '-' + suffix++
            seenIds.add(id)
            const image = original.image as HTMLCanvasElement
            const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
            const context = canvas.getContext('2d')!; context.imageSmoothingEnabled = false
            context.drawImage(image, 0, 0)
            // Clone sampler/transform settings as well as preserving original mesh UVs.
            const map = original.clone() as T.CanvasTexture; map.source = new T.Source(canvas)
            map.userData = {...map.userData, catCoat:false, actorKey:undefined}; map.needsUpdate = true
            entry = {map,id}; nativeMaps.set(original,entry); this.maps.set(id,map); this.canvases[id] = canvas
            sheets.push({id, ...describeSurface(surface), width:canvas.width, height:canvas.height, color:'#f4e3bc', pieces:[], meshes:[]})
          }
          ids.push(entry.id)
          const sheet = sheets.find(sheet => sheet.id === entry.id)!
          if (!sheet.meshes!.includes(object.name)) sheet.meshes!.push(object.name || 'Face frame')
          if (!materialCopies.has(source)) {const copy = material.clone(); copy.map = entry.map; materialCopies.set(source,copy)}
          return materialCopies.get(source)!
        }
        object.material = Array.isArray(object.material) ? object.material.map(bind) : bind(object.material)
        this.bindings.set(object,ids)
        return
      }
      let part:SkinPart|undefined, piece = 0
      if (/^(TealShirt|BrownVest|TunicTorso|CoatBack|CoatFrontPanel)/.test(object.name)) part='shirt'
      else if (object.name.startsWith('JacketSleeve')) {part='shirt';piece=object.parent?.name==='ShoulderLeft'?1:2}
      else if (object.name.startsWith('ContinuousShortsWaist')) part='pants'
      else if (object.name.startsWith('CargoShorts')) {part='pants';piece=object.parent?.name==='HipLeft'?1:2}
      else if (/^Boot_/.test(object.name)) {part='shoes';piece=object.parent?.name==='AnkleLeft'?0:1}
      if (part) {
        unwrap(object,piece)
        this.paintBindings.push({mesh:object,part,piece,applied:false,original:object.material})
        sheets.find(sheet => sheet.id === part)!.meshes!.push(object.name)
        this.bindings.set(object,[part])
      }
    })
    for (const [id, canvas] of Object.entries(this.canvases)) this.originals.set(id, canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)
    onSheets?.(sheets, this.canvases)
    this.scene.add(this.rig.root)
    this.modeling=new StudioModelEditor(this.rig,this.camera,this.display,this.controls,paletteChanged=>{if(paletteChanged)this.rebuildFinish();this.dirty=true},event=>onModelEdit?.(event))
    let orbitPointer:{x:number;y:number}|undefined
    const options={signal:this.events.signal,capture:true}
    this.display.addEventListener('contextmenu',event=>event.preventDefault(),{signal:this.events.signal})
    this.display.addEventListener('wheel',event=>{
      event.stopImmediatePropagation()
      if(!event.ctrlKey&&!event.metaKey)return
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?this.display.clientHeight:1)
      event.preventDefault();this.endPaint();this.zoomBy(Math.exp(-Math.max(-120,Math.min(120,delta))*.006))
      this.hideBrush()
    },{signal:this.events.signal,passive:false,capture:true})
    this.display.addEventListener('pointerdown',event=>{
      if(this.modeling.active){this.display.focus({preventScroll:true});return}
      if(this.paintPointer!==null&&this.paintPointer!==event.pointerId){event.stopImmediatePropagation();return}
      this.display.focus({preventScroll:true});this.hoverPoint={x:event.clientX,y:event.clientY}
      if(event.button===0&&this.paintOptions.mode==='paint'&&!this.temporaryOrbit){
        event.preventDefault();event.stopImmediatePropagation()
        if(this.paintOptions.readOnly)return
        const target=this.pick(event.clientX,event.clientY)
        if(!target)return
        this.paintPointer=event.pointerId;this.lastPointer={x:event.clientX,y:event.clientY}
        this.controls.enabled=false;this.display.setPointerCapture(event.pointerId)
        this.onPaint?.({phase:'start',hits:[target.hit]});this.showBrush(target,event.clientX,event.clientY)
      }else orbitPointer={x:event.clientX,y:event.clientY}
    },options)
    this.display.addEventListener('pointermove',event=>{
      if(this.modeling.active){this.hideBrush();return}
      this.hoverPoint={x:event.clientX,y:event.clientY}
      if(this.paintPointer===event.pointerId){
        event.preventDefault();event.stopImmediatePropagation()
        const previous=this.lastPointer??{x:event.clientX,y:event.clientY}
        const steps=Math.min(256,Math.max(1,Math.ceil(Math.hypot(event.clientX-previous.x,event.clientY-previous.y)/.5)))
        const hits:ModelPaintHit[]=[],seen=new Set<string>()
        // Raycast along the screen stroke; never draw a UV line across a seam.
        for(let i=1;i<=steps;i++){
          const target=this.pick(previous.x+(event.clientX-previous.x)*i/steps,previous.y+(event.clientY-previous.y)*i/steps)
          if(target){const key=target.hit.part+':'+target.hit.x+':'+target.hit.y;if(!seen.has(key)){seen.add(key);hits.push(target.hit)}}
        }
        this.lastPointer={x:event.clientX,y:event.clientY}
        if(hits.length)this.onPaint?.({phase:'move',hits})
      }
      const target=this.pick(event.clientX,event.clientY)
      if(this.paintOptions.mode==='paint'&&!this.temporaryOrbit&&!this.paintOptions.readOnly&&target)this.showBrush(target,event.clientX,event.clientY)
      else this.hideBrush()
    },options)
    this.display.addEventListener('pointerup',event=>{
      if(this.modeling.active)return
      if(this.paintPointer===event.pointerId){event.stopImmediatePropagation();this.endPaint();return}
      if(event.button===0&&orbitPointer&&Math.hypot(event.clientX-orbitPointer.x,event.clientY-orbitPointer.y)<=5){
        const target=this.pick(event.clientX,event.clientY)
        if(target)onPick?.(target.hit.part,target.hit.x,target.hit.y)
      }
      orbitPointer=undefined
    },options)
    this.display.addEventListener('pointercancel',()=>this.endPaint(),options)
    this.display.addEventListener('lostpointercapture',()=>this.endPaint(),options)
    this.display.addEventListener('pointerleave',()=>{this.hoverPoint=null;this.hideBrush()},{signal:this.events.signal})
    window.addEventListener('blur',()=>{this.setTemporaryOrbit(false);this.endPaint();this.hideBrush()},{signal:this.events.signal})
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host)
    this.visibility = new IntersectionObserver(([entry]) => {this.active=entry.isIntersecting;this.resume()});this.visibility.observe(host)
    document.addEventListener('visibilitychange',this.resume)
    this.resize();this.resume()
  }
  private pick(clientX:number,clientY:number){
    const rect=this.display.getBoundingClientRect()
    if(!rect.width||!rect.height||clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return null
    this.camera.updateMatrixWorld(true)
    const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera)
    const hits=ray.intersectObject(this.rig.root,true)
    // A selected blank panel remains paintable outside the body. Other empty
    // panels let rays reach the body instead of swallowing every paint stroke.
    if(this.paintOptions.surface?.startsWith('layer-'))hits.sort((a,b)=>Number(b.object.userData.silhouetteLayer===this.paintOptions.surface)-Number(a.object.userData.silhouetteLayer===this.paintOptions.surface))
    for(const intersection of hits){
      let node:T.Object3D|null=intersection.object,visible=true
      while(node){if(!node.visible||/Archive/.test(node.name))visible=false;node=node.parent}
      if(!visible)continue
      const mesh=intersection.object as T.Mesh,id=this.bindings.get(mesh)?.[intersection.face?.materialIndex??0]
      if(!id||!intersection.uv)return null
      const uv=intersection.uv.clone();this.maps.get(id)!.transformUv(uv)
      const canvas=this.canvases[id]
      const x=Math.min(canvas.width-1,Math.max(0,Math.floor(uv.x*canvas.width))),y=Math.min(canvas.height-1,Math.max(0,Math.floor(uv.y*canvas.height)))
      if(mesh.userData.silhouetteLayer&&id!==this.paintOptions.surface&&canvas.getContext('2d')!.getImageData(x,y,1,1).data[3]<128)continue
      return {hit:{part:id,x,y},intersection,uv}
    }
    return null
  }
  private showBrush(target:NonNullable<ReturnType<SkinStudioScene['pick']>>,clientX:number,clientY:number){
    if(this.paintOptions.tool==='fill'||this.paintOptions.tool==='pick'){this.hideBrush();return}
    const {intersection,hit,uv}=target,mesh=intersection.object as T.Mesh,face=intersection.face
    if(!face)return
    const positions=mesh.geometry.getAttribute('position'),uvs=mesh.geometry.getAttribute('uv'),canvas=this.canvases[hit.part]
    const rect=this.display.getBoundingClientRect(),host=this.host.getBoundingClientRect()
    const vertices=[face.a,face.b,face.c].map(index=>{
      const p=new T.Vector3().fromBufferAttribute(positions,index).applyMatrix4(mesh.matrixWorld).project(this.camera)
      const textureUV=new T.Vector2(uvs.getX(index),uvs.getY(index));this.maps.get(hit.part)!.transformUv(textureUV)
      return {x:p.x*rect.width/2,y:-p.y*rect.height/2,u:textureUV.x*canvas.width,v:textureUV.y*canvas.height}
    })
    const [a,b,c]=vertices,du=b.u-a.u,dv=b.v-a.v,eu=c.u-a.u,ev=c.v-a.v,det=du*ev-eu*dv
    if(Math.abs(det)<1e-6){this.hideBrush();return}
    const j00=((b.x-a.x)*ev-(c.x-a.x)*dv)/det,j10=((b.y-a.y)*ev-(c.y-a.y)*dv)/det
    const j01=((c.x-a.x)*du-(b.x-a.x)*eu)/det,j11=((c.y-a.y)*du-(b.y-a.y)*eu)/det
    const parity=this.paintOptions.brush%2?.5:0,dx=hit.x+parity-uv.x*canvas.width,dy=hit.y+parity-uv.y*canvas.height
    const x=clientX-host.left+j00*dx+j01*dy,y=clientY-host.top+j10*dx+j11*dy
    for(const ring of this.brushRings){ring.setAttribute('rx',String(this.paintOptions.brush/2));ring.setAttribute('ry',String(this.paintOptions.brush/2));ring.setAttribute('transform',`matrix(${j00} ${j10} ${j01} ${j11} ${x} ${y})`)}
    this.brushOverlay.style.display='block';this.display.style.cursor='none'
  }
  private hideBrush(){this.brushOverlay.style.display='none';this.display.style.cursor=this.paintOptions.mode==='paint'&&!this.temporaryOrbit?'crosshair':'grab'}
  private endPaint(){
    if(this.paintPointer===null)return
    const pointer=this.paintPointer;this.paintPointer=null;this.lastPointer=null;this.controls.enabled=true
    if(this.display.hasPointerCapture(pointer))this.display.releasePointerCapture(pointer)
    this.onPaint?.({phase:'end',hits:[]});this.dirty=true
  }
  setPaintOptions(options:ModelPaintOptions){
    this.paintOptions=options;this.hideBrush()
    if(options.mode==='orbit'||options.readOnly)this.endPaint()
    if(this.hoverPoint&&options.mode==='paint'&&!options.readOnly&&!this.temporaryOrbit){const target=this.pick(this.hoverPoint.x,this.hoverPoint.y);if(target)this.showBrush(target,this.hoverPoint.x,this.hoverPoint.y)}
  }
  setTemporaryOrbit(active:boolean){if(active)this.endPaint();this.temporaryOrbit=active;this.modeling.setTemporaryOrbit(active);this.hideBrush()}
  cancelPaint(){this.endPaint();this.hideBrush()}
  private texture(canvas:HTMLCanvasElement) {
    const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=map.minFilter=T.NearestFilter;map.generateMipmaps=false;return map
  }
  private resize() {
    const {width,height}=this.host.getBoundingClientRect()
    const scale=Math.max(1,Math.floor(Math.min(width/CREATOR_FRAME.width,height/CREATOR_FRAME.height)))
    this.display.style.width=CREATOR_FRAME.width*scale+'px';this.display.style.height=CREATOR_FRAME.height*scale+'px'
    this.brushOverlay.setAttribute('viewBox',`0 0 ${width} ${height}`)
    this.hideBrush();this.dirty=true
  }
  private resume = () => {
    cancelAnimationFrame(this.raf);this.previous=0
    if(this.disposed||!this.active||document.hidden)return
    const tick=(now:number)=>{
      if(this.playing&&this.previous&&this.paintPointer===null&&!this.modeling.dragging)this.elapsed+=Math.min(100,now-this.previous)/1000
      this.previous=now;if(this.paintPointer===null&&!this.modeling.dragging)this.controls.update()
      if(this.playing||this.dirty){
        const clip=humanClips[this.clip]??humanClips.idle,count=clip.frames??8
        const duration=count/clip.fps,phase=clip.repeat===0?Math.min(1,this.elapsed/duration):(this.elapsed/duration)%1
        if(!this.modeling.dragging){this.modeling.poseRig(this.modeling.posing?'idle':this.clip,this.modeling.posing?0:Math.floor(phase*32)/32,{secondaryMotion:{phase:this.modeling.posing?0:Math.floor((this.elapsed%2.4)/2.4*32)/32,locomotion:!this.modeling.posing&&['walk','run'].includes(this.clip)?1:0}})}
        this.modeling.applyPose()
        this.floatingViews?.update(this.camera,this.rig.root)
        this.renderer.render(this.scene,this.camera)
        this.context.clearRect(0,0,CREATOR_FRAME.width,CREATOR_FRAME.height);this.context.drawImage(this.renderer.domElement,0,0)
        this.output.putImageData(this.finish.finish(this.context.getImageData(0,0,CREATOR_FRAME.width,CREATOR_FRAME.height),CREATOR_FRAME.density),0,0)
        if(this.modeling.active){this.renderer.render(this.modeling.overlay,this.camera);this.output.drawImage(this.renderer.domElement,0,0)}
        this.dirty=false
      }
      this.raf=requestAnimationFrame(tick)
    };this.raf=requestAnimationFrame(tick)
  }
  update(part:SkinPart) {
    this.maps.get(part)!.needsUpdate=true
    const canvas=this.canvases[part],pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data,baseline=this.originals.get(part)!
    const edited=pixels.some((value,index)=>value!==baseline[index])
    for(const binding of this.paintBindings) if(binding.part===part){
      if(edited&&!binding.applied){
        const original=binding.original as T.MeshBasicMaterial
        binding.mesh.material=new T.MeshBasicMaterial({map:this.maps.get(part),vertexColors:true,side:original.side,toneMapped:false});binding.applied=true
      }else if(!edited&&binding.applied){
        ;(binding.mesh.material as T.Material).dispose();binding.mesh.material=binding.original;binding.applied=false
      }
    }
    this.rebuildFinish()
  }
  setBaseVisibility(body:boolean,hair:boolean){
    if(this.baseOnly)body=true
    this.baseBodyVisible=body;this.baseHairVisible=hair
    this.rig.root.traverse(node=>{
      if(!(node instanceof T.Mesh)||node.userData.silhouetteLayer)return
      for(let p:T.Object3D|null=node;p;p=p.parent)if(/Archive/.test(p.name)||p.userData.studioGeometryId||/^(OfferedFood|HeldWaterBottle|HeldSupplies|CleaningCloth|SleepPillow|SleepBlanket|JetpackEquipment|PowerAura|CarRide|RainCloud)/.test(p.name))return
      if(!this.baseVisibility.has(node))this.baseVisibility.set(node,node.visible)
      node.visible=this.baseVisibility.get(node)!&&body&&(hair||!/hair|fringe|lock|crown|spike/i.test(node.name))
    })
    this.floatingViews?.setEnabled(!body)
    if(this.baseOnly)for(const layer of this.silhouetteLayers)layer.mesh.visible=false
    this.dirty=true
  }
  setBaseHairVisible(visible:boolean){
    this.setBaseVisibility(this.baseBodyVisible,visible)
  }
  drawSilhouetteReference(part:string,context:CanvasRenderingContext2D){
    const layer=this.silhouetteLayers.find(row=>row.spec.id===part);if(!layer)return
    const position=layer.mesh.position.clone(),rotation=layer.mesh.quaternion.clone(),visibility=new Map<T.Mesh,boolean>()
    try{
      // The downloadable body guide stays available when the base is hidden.
      for(const [mesh,visible]of this.baseVisibility){visibility.set(mesh,mesh.visible);mesh.visible=visible&&(this.baseHairVisible||!/hair|fringe|lock|crown|spike/i.test(mesh.name))}
      layer.mesh.position.set(...layer.spec.position);layer.mesh.rotation.set(0,layer.spec.yaw,0)
      drawSilhouetteGuide(layer,context,this.rig)
    }finally{
      layer.mesh.position.copy(position);layer.mesh.quaternion.copy(rotation)
      for(const [mesh,visible]of visibility)mesh.visible=visible
      this.rig.root.updateMatrixWorld(true)
    }
  }
  refreshTextures(){
    for(const map of this.maps.values())map.needsUpdate=true
    this.rebuildFinish()
  }
  private rebuildFinish(){
    // Keep user-painted colors and added geometry colors in the pixel finish.
    const custom=new Set<string>()
    for(const [id,canvas]of Object.entries(this.canvases)){
      const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data,original=this.originals.get(id)!
      for(let i=0;i<data.length&&custom.size<128;i+=4)if(data[i+3]&&[0,1,2].some(channel=>data[i+channel]!==original[i+channel]))custom.add('#'+[0,1,2].map(channel=>data[i+channel].toString(16).padStart(2,'0')).join(''))
    }
    this.finish=new PixelFinish([...this.palette,...custom,...this.modeling.palette]);this.dirty=true
  }
  drawUV(part:string,context:CanvasRenderingContext2D){
    const canvas=this.canvases[part];if(!canvas)return
    context.save();context.strokeStyle='#ffd56b';context.lineWidth=.5;context.globalAlpha=.65;context.beginPath()
    for(const [mesh,ids]of this.bindings){
      if(!ids.includes(part))continue
      const geometry=mesh.geometry,uv=geometry.getAttribute('uv');if(!uv)continue
      const index=geometry.index,count=index?index.count:uv.count
      for(let i=0;i<count;i+=3){
        const group=geometry.groups.find(group=>i>=group.start&&i<group.start+group.count)
        if(ids[group?.materialIndex??0]!==part)continue
        for(let corner=0;corner<4;corner++){
          const vertex=index?index.getX(i+corner%3):i+corner%3
          const point=new T.Vector2(uv.getX(vertex),uv.getY(vertex));this.maps.get(part)?.transformUv(point)
          if(corner===0)context.moveTo(point.x*canvas.width,point.y*canvas.height);else context.lineTo(point.x*canvas.width,point.y*canvas.height)
        }
      }
    }
    context.stroke();context.restore()
  }
  setAnimation(clip:string,playing:boolean){if(this.clip!==clip)this.elapsed=0;this.clip=clip;this.playing=playing;this.dirty=true}
  setModelDocument(document:ModelDocument,view:ModelEditorView){
    this.endPaint();this.hideBrush();this.modeling.set(document,view)
    const previous=this.geometryDocument,paletteChanged=!previous||previous.length!==document.geometry.length||document.geometry.some((part,index)=>part.color!==previous[index]?.color||part.texture!==previous[index]?.texture)
    this.geometryDocument=document.geometry;if(paletteChanged)this.rebuildFinish()
    this.dirty=true
  }
  poseAt(time:number){return this.modeling.poseAt(time)}
  moveVertex(position:Triple){this.modeling.moveVertex(position)}
  selectVertex(point:number){this.modeling.selectVertex(point)}
  cancelModelEdit(){this.modeling.cancelEdit()}
  zoomBy(factor:number){this.endPaint();this.hideBrush();this.camera.zoom=T.MathUtils.clamp(this.camera.zoom*factor,.5,3);this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true}
  resetView(){this.camera.zoom=1;this.camera.position.set(...ACTOR_CAMERA.position);this.controls.target.set(...ACTOR_CAMERA.target);this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true}
  view(view:'front'|'back'|'left'|'right'|'quarter'){
    const angle={front:0,back:Math.PI,left:-Math.PI/2,right:Math.PI/2,quarter:Math.PI/4}[view]
    this.camera.position.set(Math.sin(angle)*90,56,Math.cos(angle)*90);this.controls.target.set(...ACTOR_CAMERA.target);this.controls.update();this.dirty=true
  }
  dispose(){
    this.disposed=true;cancelAnimationFrame(this.raf);this.events.abort();this.observer.disconnect();this.visibility.disconnect();document.removeEventListener('visibilitychange',this.resume)
    this.modeling.dispose();this.controls.dispose();disposeRig(this.rig)
    const originals=new Set<T.Texture>()
    for(const material of this.sourceMaterials){const map=(material as T.MeshBasicMaterial).map;if(map?.userData.catCoat)originals.add(map);material.dispose()}
    for(const map of originals)map.dispose();for(const map of this.maps.values())map.dispose()
    this.renderer.dispose();this.display.remove();this.brushOverlay.remove()
  }
}
