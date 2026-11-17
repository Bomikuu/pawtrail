import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { ArrowLeft, Brush, Download, Eraser, Eye, Grid2X2, PaintBucket, Pause, Play, Redo2, RotateCcw, Save, Undo2, Upload, Minus, Plus, Crosshair, MoreHorizontal, Settings2, Info, PanelLeft, Box, Paintbrush, Scan, Search, Keyboard as KeyboardIcon, Orbit, Bone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { downloadFile, drawGuide, drawCheckerboard, makeTexture, readTexture, skinParts as baseSkinParts, faces, faceRect, type SkinSheet, type SurfaceGroup } from '@/game/skin-studio/textures'
import { stampRound, floodFill, brushSizes, type ModelPaintEvent } from '@/game/skin-studio/painting'
import type { SkinStudioScene } from '@/game/skin-studio/scene'
import { creatorTemplates } from '@/game/creator/state'
import { prepareCreatorModel } from '@/game/creator/preview-models'
import { creatorContract, readAppearance, type ActorAppearance } from '@/game/actor-rig/appearance'
import {StudioModelTools} from './studio-model-tools'
import {emptyModelDocument,readModelDocument,posePreset,type ModelDocument,type ModelEditorView,type ModelEditorEvent,type StudioWorkspace,type VertexMeshInfo,type VertexSelection,type Triple} from '@/game/skin-studio/model-document'

const SAVE_KEY = 'pawtrail:texture-studio:v1'
type Tool = 'brush'|'eraser'|'pick'|'fill'
type Surfaces = Record<string,HTMLCanvasElement>
type History = Record<string,{undo:ImageData[];redo:ImageData[]}>
type PendingSkin = {version:number;images:Record<string,HTMLImageElement>}
const swatches = ['#4c8b81','#264f50','#c84a35','#802f36','#754c3c','#e1b258','#f4e3bc','#392d32','#f3f1e5','#644e83','#b86c87','#659844']
const editorZooms=[1,2,3,4,6,8,12]
const tints = [{name:'Warm brown',color:'#754c3c'},{name:'Blonde',color:'#dcb66b'},{name:'Rose pink',color:'#c9789b'},{name:'Violet',color:'#83669f'},{name:'Forest green',color:'#4c8062'},{name:'Crimson',color:'#b64045'},{name:'Midnight',color:'#414458'}]
function copyCanvas(source:HTMLCanvasElement){const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d')!.drawImage(source,0,0);return canvas}
function SheetThumbnail({source,revision}:{source?:HTMLCanvasElement;revision:number}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{const canvas=ref.current;if(!canvas||!source)return;const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=false;drawCheckerboard(context,40,40,5);const scale=Math.min(40/source.width,40/source.height);const w=source.width*scale,h=source.height*scale;context.drawImage(source,(40-w)/2,(40-h)/2,w,h)},[source,revision])
  return <canvas ref={ref} width={40} height={40} aria-hidden="true" className="size-10 shrink-0 rounded-sm [image-rendering:pixelated]" />
}
export default function SkinStudio(){
  const [modelDocument,setModelDocument]=useState<ModelDocument>(emptyModelDocument)
  const modelDocumentRef=useRef(modelDocument);modelDocumentRef.current=modelDocument
  const [modelEditorView,setModelEditorView]=useState<ModelEditorView>({mode:'texture',geometry:null,joint:'ShoulderLeft',transform:'translate',snap:false,time:0,motionPlaying:false,editMode:'object',mesh:null,vertex:null})
  const [vertexMeshes,setVertexMeshes]=useState<VertexMeshInfo[]>([]),[vertexSelection,setVertexSelection]=useState<VertexSelection|null>(null)
  const studioMode=modelEditorView.mode
  const modelHistory=useRef<{undo:ModelDocument[];redo:ModelDocument[]}>({undo:[],redo:[]})
  const [,setModelHistoryRevision]=useState(0)
  const modelEditorEvents=useRef<(event:ModelEditorEvent)=>void>(()=>{})
  const [workspacePane,setWorkspacePane]=useState<'surfaces'|'paint'|'model'>('paint')
  const [inspector,setInspector]=useState<'surface'|'character'|'shortcuts'|null>(null)
  const [modelMode,setModelMode]=useState<'orbit'|'paint'>('orbit')
  const [brushHover,setBrushHover]=useState(false)
  const modelPaintEvents=useRef<(event:ModelPaintEvent)=>void>(()=>{})
  const modelStrokeParts=useRef(new Set<string>())
  const paintSurfaces=useRef<Surfaces>({})
  const zoomAnchor=useRef<{x:number;y:number;clientX:number;clientY:number;zoom:number}|null>(null)
  const [modelView,setModelView]=useState<'front'|'quarter'|'back'|'left'|'right'>('front')
  const [search,setSearch]=useState(''),[fitMode,setFitMode]=useState(true)
  const canvasArea=useRef<HTMLDivElement>(null)
  const [character,setCharacter]=useState('rescuer')
  const [appearance,setAppearance]=useState<ActorAppearance>(()=>structuredClone(creatorTemplates[0].appearance))
  const template=creatorTemplates.find(row=>row.id===character)!
  const [skinParts,setSkinParts]=useState<SkinSheet[]>(baseSkinParts),[surfaces,setSurfaces]=useState<Surfaces|null>(null)
  const [part,setPart]=useState('shirt'),[group,setGroup]=useState<SurfaceGroup|'All'>('All')
  const [tool,setTool]=useState<Tool>('brush'),[color,setColor]=useState('#c84a35'),[hex,setHex]=useState('#c84a35'),[brush,setBrush]=useState(1),[zoom,setZoom]=useState(2)
  const [guides,setGuides]=useState(false),[grid,setGrid]=useState(true),[wireframe,setWireframe]=useState(false),[showOriginal,setShowOriginal]=useState(false)
  const [revision,setRevision]=useState(0),[clip,setClip]=useState('idle'),[playing,setPlaying]=useState(()=>typeof window!=='undefined'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [notice,setNotice]=useState(''),[error,setError]=useState(''),[sceneReady,setSceneReady]=useState(false)
  const [cursor,setCursor]=useState<{x:number;y:number}|null>(null)
  const originals=useRef<Surfaces>({}),pendingPackage=useRef<PendingSkin|null>(null),history=useRef<History>({})
  const partRef=useRef(part);partRef.current=part
  const uvGuides=useRef<Surfaces>({})
  const viewport=useRef<HTMLDivElement>(null),editor=useRef<HTMLCanvasElement>(null),scene=useRef<SkinStudioScene|null>(null)
  const file=useRef<HTMLInputElement>(null),packageFile=useRef<HTMLInputElement>(null),stroke=useRef<{x:number;y:number;pointer:number}|null>(null)
  const rememberModel=()=>{modelHistory.current.undo.push(structuredClone(modelDocumentRef.current));if(modelHistory.current.undo.length>24)modelHistory.current.undo.shift();modelHistory.current.redo=[];setModelHistoryRevision(value=>value+1)}
  const commitModel=(next:ModelDocument,remember=true)=>{if(remember)rememberModel();const ids=new Set(next.geometry.map(part=>'attachment:'+part.id));next={...next,meshEdits:next.meshEdits.filter(edit=>!edit.mesh.startsWith('attachment:')||ids.has(edit.mesh))};modelDocumentRef.current=next;setModelDocument(next);setError('')}
  const undoModel=(redo=false)=>{const from=redo?modelHistory.current.redo:modelHistory.current.undo,to=redo?modelHistory.current.undo:modelHistory.current.redo,next=from.pop();if(!next)return;to.push(structuredClone(modelDocumentRef.current));modelDocumentRef.current=next;setModelDocument(next);setModelEditorView(value=>({...value,motionPlaying:false}));setModelHistoryRevision(value=>value+1)}
  const resetModel=()=>{const next=emptyModelDocument();modelDocumentRef.current=next;setModelDocument(next);modelHistory.current={undo:[],redo:[]};setModelHistoryRevision(value=>value+1);setVertexSelection(null);setModelEditorView(value=>({...value,geometry:null,mesh:null,vertex:null,time:0,motionPlaying:false}))}
  const changeStudioMode=(mode:StudioWorkspace)=>{scene.current?.cancelPaint();setPlaying(false);setModelMode('orbit');setShowOriginal(false);setWorkspacePane(mode==='texture'?'paint':'model');setModelEditorView(value=>({...value,mode,motionPlaying:false}));setNotice(mode==='geometry'?'Add a shape, attach it to a joint, then drag its axes.':mode==='pose'?'Choose T-pose, or select a joint and drag the rotation rings.':'Texture painting workspace')}
  const seekMotion=(time:number)=>{setModelEditorView(value=>({...value,time,motionPlaying:false}));const pose=scene.current?.poseAt(time);if(pose)commitModel({...modelDocumentRef.current,pose},false)}
  modelEditorEvents.current=event=>{
    if(event.type==='vertex-catalog'){setVertexMeshes(event.meshes);setModelEditorView(value=>event.meshes.some(mesh=>mesh.id===value.mesh)?value:{...value,mesh:(event.meshes.find(mesh=>/face|head/i.test(mesh.label))??event.meshes[0])?.id??null,vertex:null});return}
    if(event.type==='select-mesh'){setVertexSelection(null);setModelEditorView(value=>({...value,mesh:event.id,vertex:null}));return}
    if(event.type==='select-vertex'){setVertexSelection(event.selection);const selection=event.selection;setModelEditorView(value=>selection?value.mesh===selection.mesh&&value.vertex===selection.point?value:{...value,mesh:selection.mesh,vertex:selection.point}:value.vertex===null?value:{...value,vertex:null});return}
    if(event.type==='model-error'){setError(event.message);return}
    if(event.type==='start'){rememberModel();return}
    if(event.type==='select-geometry'){setModelEditorView(value=>({...value,geometry:event.id}));return}
    if(event.type==='select-joint'){setModelEditorView(value=>({...value,joint:event.joint,motionPlaying:false}));return}
    const current=modelDocumentRef.current
    if(event.type==='vertices'){commitModel({...current,meshEdits:[...current.meshEdits.filter(edit=>edit.mesh!==event.edit.mesh),...(event.edit.offsets.length?[event.edit]:[])]},false);return}
    if(event.type==='geometry')commitModel({...current,geometry:current.geometry.map(part=>part.id===event.id?{...part,position:event.position,rotation:event.rotation,scale:event.scale}:part)},false)
    else if(event.type==='joint')commitModel({...current,pose:{...current.pose,angles:{...current.pose.angles,[event.joint]:event.rotation}}},false)
  }
  const spec=skinParts.find(row=>row.id===part)??skinParts[0]??baseSkinParts[0]
  const sheet=surfaces?.[part],width=sheet?.width??256,height=sheet?.height??256
  const selectColor=(value:string)=>{setColor(value);setHex(value)}
  const selectPart=(id:string)=>{stroke.current=null;setPart(id);setCursor(null);setShowOriginal(false);setFitMode(true);setWorkspacePane('paint')}
  useEffect(()=>{
    if(!viewport.current)return
    let cancelled=false
    setSceneReady(false);setSurfaces(null);setError('');stroke.current=null;uvGuides.current={};modelStrokeParts.current.clear();setModelView('front')
    const canvases={shirt:makeTexture('shirt'),pants:makeTexture('pants'),shoes:makeTexture('shoes')}
    for(const [id,key]of [['shirt','shirt'],['pants','shorts'],['shoes','shoe']] as const){
      const context=canvases[id].getContext('2d')!,spec=baseSkinParts.find(row=>row.id===id)!
      context.fillStyle=appearance.colors[key];spec.pieces.forEach((_,piece)=>faces.forEach((_,face)=>{const r=faceRect(piece,face);context.fillRect(r.x,r.y,r.w,r.h)}))
    }
    let currentSheets:Surfaces={}
    Promise.all([import('@/game/skin-studio/scene'),prepareCreatorModel(template.previewModel)]).then(([{SkinStudioScene}])=>{
      if(cancelled||!viewport.current)return
      try{
        scene.current=new SkinStudioScene(viewport.current,canvases,appearance,template.previewModel,(sheets,maps)=>{
          currentSheets=maps;paintSurfaces.current=maps;originals.current=Object.fromEntries(Object.entries(maps).map(([key,canvas])=>[key,copyCanvas(canvas)]))
          history.current=Object.fromEntries(sheets.map(row=>[row.id,{undo:[],redo:[]}]))
          setSkinParts(sheets);setSurfaces(maps);setPart(sheets[0]?.id??'shirt');setGroup('All');setSearch('');setCursor(null);setShowOriginal(false);setFitMode(true);setZoom(template.previewModel==='shared'?2:6)
        },(id,x,y)=>{selectPart(id);setGroup('All');setSearch('');setCursor({x,y});setNotice('Selected the painted surface under the pointer.')},event=>modelPaintEvents.current(event),event=>modelEditorEvents.current(event))
        const pending=pendingPackage.current;pendingPackage.current=null
        if(pending){
          for(const [id,image]of Object.entries(pending.images)){
            if(!Object.hasOwn(currentSheets,id)){if(pending.version<3)continue;throw new Error('This package contains a surface not used by the selected character.')}
            const target=currentSheets[id]
            if(pending.version>=3&&(target.width!==image.naturalWidth||target.height!==image.naturalHeight))throw new Error('A saved surface has the wrong native dimensions.')
          }
          for(const [id,image]of Object.entries(pending.images)){
            if(!Object.hasOwn(currentSheets,id))continue
            const target=currentSheets[id],context=target.getContext('2d')!;context.imageSmoothingEnabled=false
            context.clearRect(0,0,target.width,target.height);context.drawImage(image,0,0,target.width,target.height);scene.current.update(id)
          }
        }
        setSceneReady(true);setRevision(value=>value+1)
      }catch(reason){if(!cancelled){scene.current?.dispose();scene.current=null;setSurfaces(null);setError(reason instanceof Error?reason.message:'The character could not load. Select another character to retry.')}}
    }).catch(()=>{if(!cancelled)setError('The model preview could not load. Choose another character or reopen this page.')})
    return()=>{cancelled=true;scene.current?.dispose();scene.current=null}
  },[character,appearance,template.previewModel])
  useEffect(()=>{scene.current?.setAnimation(clip,studioMode==='pose'||studioMode==='geometry'&&modelEditorView.editMode==='vertices'?false:playing)},[clip,playing,sceneReady,studioMode,modelEditorView.editMode])
  useEffect(()=>{if(sceneReady)try{scene.current?.setModelDocument(modelDocument,modelEditorView)}catch(reason){setError(reason instanceof Error?reason.message:'The mesh edits could not be applied.')}},[modelDocument,modelEditorView,sceneReady])
  useEffect(()=>{if(modelEditorView.geometry&&!modelDocument.geometry.some(part=>part.id===modelEditorView.geometry))setModelEditorView(value=>({...value,geometry:null}))},[modelDocument.geometry,modelEditorView.geometry])
  useEffect(()=>{if(modelEditorView.time>modelDocument.duration)setModelEditorView(value=>({...value,time:modelDocument.duration,motionPlaying:false}))},[modelDocument.duration,modelEditorView.time])
  useEffect(()=>{
    if(!modelEditorView.motionPlaying||studioMode!=='pose'||!sceneReady)return
    let raf=0,previous=performance.now()
    const tick=(now:number)=>{if(now-previous>=32){const delta=Math.min(100,now-previous)/1000;previous=now;setModelEditorView(value=>({...value,time:modelDocument.loop?(value.time+delta)%modelDocument.duration:Math.min(modelDocument.duration,value.time+delta)}))}raf=requestAnimationFrame(tick)}
    raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)
  },[modelEditorView.motionPlaying,studioMode,sceneReady,modelDocument.duration,modelDocument.loop])
  useEffect(()=>{if(modelEditorView.motionPlaying&&!modelDocument.loop&&modelEditorView.time>=modelDocument.duration){const pose=scene.current?.poseAt(modelDocument.duration);if(pose)commitModel({...modelDocumentRef.current,pose},false);setModelEditorView(value=>({...value,motionPlaying:false}))}},[modelEditorView.time,modelEditorView.motionPlaying,modelDocument.duration,modelDocument.loop])
  useEffect(()=>{scene.current?.setPaintOptions({mode:modelMode,tool,brush,readOnly:showOriginal})},[modelMode,tool,brush,showOriginal,sceneReady])
  useEffect(()=>{
    const area=canvasArea.current
    if(!area)return
    let accumulated=0
    const wheel=(event:WheelEvent)=>{
      if(!event.ctrlKey&&!event.metaKey)return
      event.preventDefault();event.stopPropagation();stroke.current=null
      accumulated+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?area.clientHeight:1)
      if(Math.abs(accumulated)<25)return
      const index=editorZooms.indexOf(zoom),next=editorZooms[Math.max(0,Math.min(editorZooms.length-1,index+(accumulated<0?1:-1)))]
      accumulated=0
      if(next===zoom)return
      const canvas=editor.current!,rect=canvas.getBoundingClientRect()
      zoomAnchor.current={x:Math.max(0,Math.min(width,(event.clientX-rect.left)/zoom)),y:Math.max(0,Math.min(height,(event.clientY-rect.top)/zoom)),clientX:event.clientX,clientY:event.clientY,zoom:next}
      setFitMode(false);setZoom(next)
    }
    area.addEventListener('wheel',wheel,{passive:false})
    return()=>area.removeEventListener('wheel',wheel)
  },[zoom,width,height])
  useEffect(()=>{
    const release=(event:globalThis.KeyboardEvent)=>{if(event.code==='Space')scene.current?.setTemporaryOrbit(false)}
    const clear=()=>{scene.current?.setTemporaryOrbit(false);scene.current?.cancelPaint();stroke.current=null}
    window.addEventListener('keyup',release);window.addEventListener('blur',clear)
    return()=>{window.removeEventListener('keyup',release);window.removeEventListener('blur',clear)}
  },[])
  useEffect(()=>{
    const area=canvasArea.current
    if(!area||!fitMode||!sceneReady)return
    const fit=()=>{
      const bounds=area.getBoundingClientRect()
      if(bounds.width<1||bounds.height<1)return
      const maximum=Math.min((bounds.width-32)/width,(bounds.height-32)/height)
      setZoom([...editorZooms].reverse().find(value=>value<=maximum)??1)
      area.scrollTo({left:0,top:0})
    }
    const observer=new ResizeObserver(fit);observer.observe(area);fit()
    return()=>observer.disconnect()
  },[fitMode,width,height,sceneReady,workspacePane])
  useEffect(()=>{
    const canvas=editor.current,source=showOriginal?originals.current[part]:sheet
    if(!canvas||!source)return
    canvas.width=source.width*zoom;canvas.height=source.height*zoom
    const context=canvas.getContext('2d')!;context.imageSmoothingEnabled=false
    drawCheckerboard(context,canvas.width,canvas.height,8*zoom);context.drawImage(source,0,0,canvas.width,canvas.height)
    if(grid&&zoom>=4){
      context.strokeStyle='#ffffff20';context.lineWidth=1;context.beginPath()
      for(let x=0;x<=source.width;x++){context.moveTo(x*zoom+.5,0);context.lineTo(x*zoom+.5,canvas.height)}
      for(let y=0;y<=source.height;y++){context.moveTo(0,y*zoom+.5);context.lineTo(canvas.width,y*zoom+.5)}context.stroke()
    }
    context.save();context.scale(zoom,zoom)
    if(guides)drawGuide(context,part)
    if(wireframe){
      if(!uvGuides.current[part]){
        const guide=document.createElement('canvas');guide.width=source.width;guide.height=source.height
        scene.current?.drawUV(part,guide.getContext('2d')!);uvGuides.current[part]=guide
      }
      context.drawImage(uvGuides.current[part],0,0)
    }
    context.restore()
    if(cursor){
      if(brushHover&&!showOriginal&&(tool==='brush'||tool==='eraser')){
        const parity=brush%2?.5:0
        context.beginPath();context.arc((cursor.x+parity)*zoom,(cursor.y+parity)*zoom,brush*zoom/2,0,Math.PI*2)
        context.strokeStyle='#171717';context.lineWidth=3;context.stroke();context.strokeStyle='#ffffff';context.lineWidth=1;context.stroke()
      }else{context.strokeStyle='#ffffff';context.lineWidth=1;context.strokeRect(cursor.x*zoom+.5,cursor.y*zoom+.5,zoom-1,zoom-1)}
    }
    const anchor=zoomAnchor.current
    if(anchor&&anchor.zoom===zoom&&canvasArea.current){
      const rect=canvas.getBoundingClientRect();canvasArea.current.scrollLeft+=rect.left+anchor.x*zoom-anchor.clientX;canvasArea.current.scrollTop+=rect.top+anchor.y*zoom-anchor.clientY;zoomAnchor.current=null
    }
  },[sheet,part,revision,zoom,guides,grid,wireframe,showOriginal,cursor,sceneReady,brushHover,brush,tool])
  const changed=()=>{scene.current?.update(part);setRevision(value=>value+1);setNotice('Unsaved texture changes')}
  const snapshot=()=>{
    if(!sheet)return
    const row=history.current[part];row.undo.push(sheet.getContext('2d')!.getImageData(0,0,width,height));if(row.undo.length>24)row.undo.shift();row.redo=[]
  }
  const undo=(redo=false)=>{
    if(!sheet)return
    const row=history.current[part],from=redo?row.redo:row.undo,to=redo?row.undo:row.redo,image=from.pop();if(!image)return
    const context=sheet.getContext('2d')!;to.push(context.getImageData(0,0,width,height));context.putImageData(image,0,0);setShowOriginal(false);changed()
  }
  const zoomTexture=(direction:number)=>{stroke.current=null;const index=editorZooms.indexOf(zoom);setFitMode(false);setZoom(editorZooms[Math.max(0,Math.min(editorZooms.length-1,index+direction))])}
  const saveLocal=()=>void guarded(()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(skinPackage()));setNotice('Skin saved on this device')})
  const keyDown=(event:KeyboardEvent<HTMLElement>)=>{
    if((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"],[role="combobox"],[role="dialog"],[role="menu"]')||inspector!==null)return
    const key=event.key.toLowerCase(),modifier=event.ctrlKey||event.metaKey
    if(modifier&&key==='z'){event.preventDefault();if(studioMode==='texture')undo(event.shiftKey);else undoModel(event.shiftKey);return}
    if(modifier&&key==='y'){event.preventDefault();if(studioMode==='texture')undo(true);else undoModel(true);return}
    if(modifier&&key==='s'){event.preventDefault();if(sceneReady)saveLocal();return}
    if(key==='='||key==='+'||key==='-'){
      event.preventDefault();const direction=key==='-'?-1:1
      if(viewport.current?.contains(event.target as Node)||workspacePane==='model')scene.current?.zoomBy(direction>0?1.2:1/1.2);else zoomTexture(direction)
      return
    }
    if(modifier||event.altKey)return
    if(event.code==='Space'){if((event.target as HTMLElement).closest('button,[role="button"]'))return;event.preventDefault();scene.current?.setTemporaryOrbit(true);return}
    if(key==='escape'){stroke.current=null;scene.current?.cancelPaint();scene.current?.cancelModelEdit();scene.current?.setTemporaryOrbit(false);return}
    if(studioMode!=='texture'){
      if(studioMode==='geometry'&&modelEditorView.editMode==='vertices'&&viewport.current?.contains(event.target as Node)&&['arrowleft','arrowright'].includes(key)){event.preventDefault();const count=vertexMeshes.find(mesh=>mesh.id===modelEditorView.mesh)?.points??0;if(count)scene.current?.selectVertex(Math.max(0,Math.min(count-1,(modelEditorView.vertex??0)+(key==='arrowleft'?-1:1))));return}
      if(studioMode==='geometry'&&modelEditorView.editMode==='object'&&['w','e','r'].includes(key)){event.preventDefault();setModelEditorView(value=>({...value,transform:key==='w'?'translate':key==='e'?'rotate':'scale'}));return}
      if(studioMode==='pose'&&key==='t'){event.preventDefault();setModelEditorView(value=>({...value,motionPlaying:false}));commitModel({...modelDocumentRef.current,pose:posePreset('t-pose')});return}
      if(studioMode==='geometry'&&modelEditorView.editMode==='object'&&(key==='delete'||key==='backspace')&&modelEditorView.geometry){event.preventDefault();commitModel({...modelDocumentRef.current,geometry:modelDocumentRef.current.geometry.filter(part=>part.id!==modelEditorView.geometry)});return}
      if(key!=='?')return
    }
    const tools:Record<string,Tool>={b:'brush',e:'eraser',i:'pick',g:'fill'}
    if(tools[key]){event.preventDefault();setTool(tools[key]);return}
    if(key==='['||key===']'){event.preventDefault();const index=brushSizes.indexOf(brush);setBrush(brushSizes[Math.max(0,Math.min(brushSizes.length-1,index+(key===']'?1:-1)))]);return}
    if(key==='f'){event.preventDefault();setFitMode(true);return}
    if(key==='p'||key==='v'){event.preventDefault();scene.current?.cancelPaint();setModelMode(key==='p'?'paint':'orbit');if(key==='p')setShowOriginal(false);return}
    if(key==='?'){event.preventDefault();setInspector('shortcuts')}
  }
  const point=(event:PointerEvent<HTMLCanvasElement>)=>{
    const box=event.currentTarget.getBoundingClientRect()
    return{x:Math.max(0,Math.min(width-1,Math.floor((event.clientX-box.left)/box.width*width))),y:Math.max(0,Math.min(height-1,Math.floor((event.clientY-box.top)/box.height*height)))}
  }
  const paint=(x:number,y:number)=>{if(sheet)stampRound(sheet,originals.current[part],x,y,brush,tool==='eraser'?null:color)}
  const fill=(x:number,y:number)=>{if(sheet)floodFill(sheet,x,y,color)}
  modelPaintEvents.current=event=>{
    if(event.phase==='end'){modelStrokeParts.current.clear();return}
    if(event.phase==='start'){modelStrokeParts.current.clear();stroke.current=null}
    if(showOriginal)return
    const last=event.hits.at(-1)
    if(!last)return
    if(tool==='pick'){
      if(event.phase==='start'){
        const pixel=paintSurfaces.current[last.part].getContext('2d')!.getImageData(last.x,last.y,1,1).data
        selectColor('#'+Array.from(pixel.slice(0,3)).map(value=>value.toString(16).padStart(2,'0')).join(''))
      }
    }else{
      if(tool==='fill'&&event.phase!=='start')return
      const touched=new Set<string>()
      for(const hit of event.hits){
        const target=paintSurfaces.current[hit.part];if(!target)continue
        if(!modelStrokeParts.current.has(hit.part)){
          const row=history.current[hit.part];row.undo.push(target.getContext('2d')!.getImageData(0,0,target.width,target.height));if(row.undo.length>24)row.undo.shift();row.redo=[];modelStrokeParts.current.add(hit.part)
        }
        if(tool==='fill')floodFill(target,hit.x,hit.y,color)
        else stampRound(target,originals.current[hit.part],hit.x,hit.y,brush,tool==='eraser'?null:color)
        touched.add(hit.part)
      }
      for(const id of touched)scene.current?.update(id)
      setRevision(value=>value+1);setNotice('Model painted. The same pixels are updated in the texture editor.')
    }
    if(partRef.current!==last.part){setPart(last.part);setGroup('All');setSearch('');setFitMode(true)}
    setCursor({x:last.x,y:last.y})
  }
  const begin=(event:PointerEvent<HTMLCanvasElement>)=>{
    if(!sheet||event.button!==0)return
    event.currentTarget.focus({preventScroll:true})
    const{x,y}=point(event);setCursor({x,y})
    if(tool==='pick'){const pixel=(showOriginal?originals.current[part]:sheet).getContext('2d')!.getImageData(x,y,1,1).data;selectColor('#'+Array.from(pixel.slice(0,3)).map(value=>value.toString(16).padStart(2,'0')).join(''));return}
    if(showOriginal)return
    snapshot();event.currentTarget.setPointerCapture(event.pointerId)
    if(tool==='fill')fill(x,y);else{stroke.current={x,y,pointer:event.pointerId};paint(x,y)}changed()
  }
  const move=(event:PointerEvent<HTMLCanvasElement>)=>{
    const{x,y}=point(event);setCursor({x,y});const previous=stroke.current
    if(!previous||previous.pointer!==event.pointerId||showOriginal)return
    const steps=Math.max(Math.abs(x-previous.x),Math.abs(y-previous.y),1)
    for(let i=1;i<=steps;i++)paint(Math.round(previous.x+(x-previous.x)*i/steps),Math.round(previous.y+(y-previous.y)*i/steps))
    stroke.current={x,y,pointer:event.pointerId};changed()
  }
  const guarded=async(work:()=>void|Promise<void>)=>{try{setError('');await work()}catch(reason){setError(reason instanceof Error?reason.message:'This action could not finish.')}}
  const reset=()=>{if(!sheet)return;snapshot();const context=sheet.getContext('2d')!;context.clearRect(0,0,width,height);context.drawImage(originals.current[part],0,0);setShowOriginal(false);changed()}
  const importImage=async(selected?:File)=>{
    if(!selected||!sheet)return
    const target=sheet,id=part,currentScene=scene.current
    await guarded(async()=>{
      if(!['image/png','image/webp'].includes(selected.type)||selected.size>2_000_000)throw new Error('Choose a PNG or WebP under 2 MB.')
      const url=URL.createObjectURL(selected)
      try{
        const image=await readTexture(url)
        if(scene.current!==currentScene||partRef.current!==id)throw new Error('The selected character changed. Import into its current surface instead.')
        if(image.naturalWidth!==target.width||image.naturalHeight!==target.height)throw new Error(`Use a ${target.width} × ${target.height} image. Download this surface’s original template first.`)
        snapshot();const context=target.getContext('2d')!;context.clearRect(0,0,width,height);context.drawImage(originals.current[id],0,0);context.drawImage(image,0,0);changed()
      }finally{URL.revokeObjectURL(url)}
    })
  }
  const skinPackage=()=>({format:'pawtrail-texture-skin',version:5,base:'rescuer-uv-v1',character,appearance,model:modelDocumentRef.current,textures:Object.fromEntries(skinParts.map(row=>[row.id,surfaces![row.id].toDataURL('image/png')]))})
  const loadPackage=async(text:string)=>{
    if(text.length>12_000_000)throw new Error('Choose a skin package under 12 MB.')
    const data=JSON.parse(text)
    if(!data||data.format!=='pawtrail-texture-skin'||![1,2,3,4,5].includes(data.version)||data.base!=='rescuer-uv-v1')throw new Error('Choose a PawTrail skin package.')
    const selected=creatorTemplates.find(row=>row.id===(data.character??'rescuer')),look=data.version===1?structuredClone(creatorTemplates[0].appearance):readAppearance(data.appearance)
    if(!selected||!look||!data.textures||typeof data.textures!=='object')throw new Error('The character or appearance is invalid.')
    const entries=Object.entries(data.textures);if(!entries.length||entries.length>64)throw new Error('The package has invalid texture sheets.')
    const images=await Promise.all(entries.map(async([id,source])=>{
      if(!/^[a-zA-Z0-9_-]{1,120}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||typeof source!=='string'||!source.startsWith('data:image/png;base64,')||source.length>1_300_000)throw new Error('The package has an invalid texture.')
      return[id,await readTexture(source)]as const
    }))
    const model=readModelDocument(data.version>=4?data.model:undefined)
    await Promise.all(model.geometry.filter(part=>part.texture).map(async part=>{const image=await readTexture(part.texture!);if(image.naturalWidth>128||image.naturalHeight>128)throw new Error('Attachment textures must be at most 128 × 128 pixels.')}))
    resetModel();commitModel(model,false)
    pendingPackage.current={version:data.version,images:Object.fromEntries(images)};setCharacter(selected.id);setAppearance(look);setNotice(data.version<4?'Older package restored. Geometry and motion start empty.':'Skin, geometry and motion loaded into the local studio')
  }
  const tintSheet=(tint:string)=>{
    if(!sheet)return
    snapshot();const context=sheet.getContext('2d')!,source=originals.current[part];context.clearRect(0,0,width,height);context.drawImage(source,0,0)
    const image=context.getImageData(0,0,width,height),rgb=[1,3,5].map(index=>parseInt(tint.slice(index,index+2),16))
    for(let i=0;i<image.data.length;i+=4){const light=(image.data[i]*.2126+image.data[i+1]*.7152+image.data[i+2]*.0722)/160;for(let channel=0;channel<3;channel++)image.data[i+channel]=Math.min(255,Math.round(rgb[channel]*light))}
    context.putImageData(image,0,0);setShowOriginal(false);changed()
  }
  const reference=()=>{
    if(!sheet)return
    const canvas=copyCanvas(originals.current[part]),context=canvas.getContext('2d')!;drawGuide(context,part);scene.current?.drawUV(part,context)
    downloadFile(`pawtrail-${character}-${part}-UV-reference.png`,canvas.toDataURL('image/png'))
  }
  const visibleSheets=skinParts.filter(row=>(group==='All'||(row.group??'Clothing')===group)&&[row.label,row.group,...(row.meshes??[])].join(' ').toLowerCase().includes(search.toLowerCase().trim()))
  const changeZoom=(value:string)=>{setFitMode(false);setZoom(Number(value))}
  const openDetails=(value:'surface'|'character'|'shortcuts')=>{stroke.current=null;setInspector(value)}
  return <PlayShell>
    <PlayHeader location="Character studio" details="Local workspace" balance={null} scope="local">
      <Button variant="outline" size="sm" onClick={()=>{window.history.pushState(null,'',window.location.pathname+'?preview=actors');window.dispatchEvent(new PopStateEvent('popstate'))}}><ArrowLeft className="size-4"/><span className="hidden sm:inline">Character creator</span></Button>
    </PlayHeader>
    <main onKeyDown={keyDown} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-3"><h1 className="hidden shrink-0 font-heading text-xl font-semibold sm:block">Character studio</h1><Select value={character} onValueChange={value=>{pendingPackage.current=null;resetModel();const row=creatorTemplates.find(item=>item.id===value)!;setCharacter(value);setAppearance(structuredClone(row.appearance));setNotice('Character preset loaded. Unsaved edits replaced.')}}><SelectTrigger aria-label="Character preset" className="h-8 w-full min-w-0 max-w-64"><SelectValue/></SelectTrigger><SelectContent>{creatorTemplates.map(row=><SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="flex shrink-0 items-center gap-2"><Button variant="ghost" size="icon" className="size-8" aria-label="Keyboard shortcuts (?)" onClick={()=>openDetails('shortcuts')}><KeyboardIcon className="size-4"/></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Files<MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="pawtrail-game"><DropdownMenuItem disabled={!sceneReady} onSelect={()=>packageFile.current?.click()}><Upload className="size-4"/>Load skin package</DropdownMenuItem><DropdownMenuItem disabled={!sceneReady} onSelect={()=>void guarded(()=>{const saved=localStorage.getItem(SAVE_KEY);if(!saved)throw new Error('No skin saved on this device yet.');return loadPackage(saved)})}>Load saved skin</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem disabled={!sceneReady} onSelect={()=>downloadFile(`pawtrail-${character}-skin.json`,new Blob([JSON.stringify(skinPackage())],{type:'application/json'}))}><Download className="size-4"/>Export skin package</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button size="sm" disabled={!sceneReady} onClick={saveLocal}><Save className="size-4"/><span className="hidden sm:inline">Save locally</span><span className="sm:hidden">Save</span></Button></div>
      </header>
      {error&&<p role="alert" className="shrink-0 border-b border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <nav aria-label="Studio workspace" className="flex shrink-0 flex-wrap items-center gap-1 border-b px-3 py-1.5">{([{id:'texture',label:'Paint textures',Icon:Brush},{id:'geometry',label:'Geometry',Icon:Box},{id:'pose',label:'Pose & motion',Icon:Bone}]as const).map(({id,label,Icon})=><Button key={id} size="sm" variant={studioMode===id?'secondary':'ghost'} aria-pressed={studioMode===id} onClick={()=>changeStudioMode(id)}><Icon className="size-4"/>{label}</Button>)}<span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Local geometry · Shared rig · Custom motion</span></nav>
      <nav aria-label="Editor panels" className={`${studioMode==='texture'?'flex':'hidden'} shrink-0 gap-1 border-b px-2 py-1.5 lg:hidden`}>{([{id:'surfaces',label:'Surfaces',Icon:PanelLeft},{id:'paint',label:'Paint',Icon:Paintbrush},{id:'model',label:'Model',Icon:Box}]as const).map(({id,label,Icon})=><Button key={id} size="sm" variant={workspacePane===id?'secondary':'ghost'} aria-pressed={workspacePane===id} aria-controls={'skin-'+id} onClick={()=>setWorkspacePane(id)} className="flex-1"><Icon className="size-4"/>{label}</Button>)}</nav>
      <div className={`grid min-h-0 flex-1 overflow-hidden ${studioMode==='texture'?'grid-cols-1 lg:grid-cols-[208px_minmax(0,1fr)_256px] 2xl:grid-cols-[232px_minmax(0,1fr)_304px]':'grid-cols-1 grid-rows-[minmax(200px,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_360px]'}`}>
        <aside id="skin-surfaces" aria-label="Painted surfaces" className={`${studioMode!=='texture'?'hidden':`${workspacePane==='surfaces'?'flex':'hidden'} lg:flex lg:border-r`} min-h-0 flex-col overflow-hidden bg-muted/20`}>
          <div className="shrink-0 space-y-2 border-b p-3"><div className="flex items-center justify-between"><h2 className="font-heading text-lg font-semibold">Surfaces</h2><span className="text-xs tabular-nums text-muted-foreground">{visibleSheets.length}/{skinParts.length}</span></div><Select value={group} onValueChange={value=>setGroup(value as typeof group)}><SelectTrigger className="h-8 w-full" aria-label="Filter surfaces"><SelectValue/></SelectTrigger><SelectContent>{(['All','Face','Hair','Clothing','Accessories']as const).map(value=><SelectItem key={value} value={value}>{value==='All'?'All surfaces':value}</SelectItem>)}</SelectContent></Select><div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground"/><Input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Find a surface…" aria-label="Find a surface" className="h-8 pl-8"/></div></div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
            {visibleSheets.map(row=><Button key={row.id} variant={part===row.id?'secondary':'ghost'} disabled={!sceneReady} aria-pressed={part===row.id} onClick={()=>selectPart(row.id)} className="h-auto w-full justify-start gap-2 px-2 py-2 text-left"><SheetThumbnail source={surfaces?.[row.id]} revision={revision}/><span className="min-w-0 flex-1"><span className="block truncate capitalize">{row.label}</span><span className="block text-xs font-normal tabular-nums text-muted-foreground">{surfaces?.[row.id]?.width??row.width??256} × {surfaces?.[row.id]?.height??row.height??256}</span></span>{part===row.id&&<Crosshair className="size-3.5 shrink-0"/>}</Button>)}
            {!visibleSheets.length&&<div className="space-y-2 p-2 text-sm text-muted-foreground"><p>No matching surfaces.</p><Button variant="outline" size="sm" onClick={()=>{setSearch('');setGroup('All')}}>Show all surfaces</Button></div>}
          </div>
          <div className="shrink-0 space-y-2 border-t p-3"><h3 className="text-xs font-medium">Palette</h3><div className="flex flex-wrap gap-1">{swatches.map(value=><Button key={value} size="icon" variant="outline" title={value} aria-label={'Paint '+value} className="size-7 p-1" onClick={()=>selectColor(value)}><span className="size-full rounded-sm" style={{backgroundColor:value}}/></Button>)}</div><Select key={part+character+revision} onValueChange={tintSheet} disabled={!sceneReady}><SelectTrigger className="h-8 w-full" aria-label="Recolor from original"><SelectValue placeholder="Recolor from original…"/></SelectTrigger><SelectContent>{tints.map(row=><SelectItem key={row.color} value={row.color}>{row.name}</SelectItem>)}</SelectContent></Select></div>
        </aside>
        <section id="skin-paint" aria-label="Texture painting" className={`${studioMode!=='texture'?'hidden':`${workspacePane==='paint'?'flex':'hidden'} lg:flex`} min-h-0 min-w-0 flex-col overflow-hidden`}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2"><div className="min-w-0"><h2 className="truncate font-heading text-lg font-semibold capitalize">{spec.label}</h2><p className="text-xs tabular-nums text-muted-foreground">{width} × {height} px</p></div><div className="flex shrink-0 items-center gap-1"><Button size="sm" variant={showOriginal?'secondary':'outline'} aria-pressed={showOriginal} onClick={()=>{stroke.current=null;setShowOriginal(value=>!value)}}><Eye className="size-3.5"/>{showOriginal?'Original':'Compare'}</Button><Button size="icon" variant="ghost" className="size-8" aria-label="Surface details" onClick={()=>openDetails('surface')}><Info className="size-4"/></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Surface actions"><MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="pawtrail-game"><DropdownMenuItem disabled={!sceneReady} onSelect={()=>file.current?.click()}><Upload className="size-4"/>Import texture</DropdownMenuItem><DropdownMenuItem disabled={!sceneReady} onSelect={()=>downloadFile(`pawtrail-${character}-${part}.png`,sheet!.toDataURL('image/png'))}><Download className="size-4"/>Export texture PNG</DropdownMenuItem><DropdownMenuItem disabled={!sceneReady} onSelect={reference}>Download UV reference</DropdownMenuItem><DropdownMenuItem disabled={!sceneReady} onSelect={()=>downloadFile(`pawtrail-${character}-${part}-original.png`,originals.current[part].toDataURL('image/png'))}>Download original template</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem disabled={!sceneReady} onSelect={reset}><RotateCcw className="size-4"/>Reset surface</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b p-2">
            <div className="flex gap-1" aria-label="Painting tools">{([{id:'brush',label:'Brush',Icon:Brush},{id:'eraser',label:'Restore original pixels',Icon:Eraser},{id:'pick',label:'Pick color',Icon:Eye},{id:'fill',label:'Fill area',Icon:PaintBucket}]as const).map(({id,label,Icon})=><Tooltip key={id}><TooltipTrigger asChild><Button variant={tool===id?'secondary':'ghost'} size="icon" className="size-8" aria-label={label} aria-pressed={tool===id} onClick={()=>setTool(id)}><Icon className="size-4"/></Button></TooltipTrigger><TooltipContent className="pawtrail-game">{label}</TooltipContent></Tooltip>)}</div>
            <div className="flex items-center gap-1.5"><Input type="color" value={color} onChange={event=>selectColor(event.target.value)} aria-label="Paint color" className="size-8 w-9 p-1"/><Input value={hex} maxLength={7} spellCheck={false} aria-label="Hex paint color" aria-invalid={!/^#[0-9a-f]{6}$/i.test(hex)} onChange={event=>{setHex(event.target.value);if(/^#[0-9a-f]{6}$/i.test(event.target.value))setColor(event.target.value)}} onBlur={()=>setHex(color)} className="h-8 w-24 font-mono text-xs"/><Select value={String(brush)} onValueChange={value=>setBrush(Number(value))}><SelectTrigger aria-label="Brush size" className="h-8 w-20"><SelectValue/></SelectTrigger><SelectContent>{brushSizes.map(value=><SelectItem key={value} value={String(value)}>{value} px</SelectItem>)}</SelectContent></Select></div>
            <div className="ml-auto flex gap-1"><Button variant="ghost" size="icon" className="size-8" title="Undo (Ctrl / Cmd Z)" aria-label="Undo" disabled={!sceneReady||!history.current[part]?.undo.length} onClick={()=>undo()}><Undo2 className="size-4"/></Button><Button variant="ghost" size="icon" className="size-8" title="Redo (Ctrl / Cmd Shift Z)" aria-label="Redo" disabled={!sceneReady||!history.current[part]?.redo.length} onClick={()=>undo(true)}><Redo2 className="size-4"/></Button></div>
          </div>
          {showOriginal&&<div className="flex shrink-0 items-center justify-between gap-2 border-b bg-secondary px-3 py-1 text-xs"><span>Original reference · read only</span><Button variant="ghost" size="sm" className="h-7" onClick={()=>setShowOriginal(false)}>Back to painting</Button></div>}
          <div ref={canvasArea} className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-[#24262c]">
            <div className="grid min-h-full w-max min-w-full place-items-center p-4"><canvas ref={editor} tabIndex={0} onPointerEnter={()=>setBrushHover(true)} onPointerLeave={()=>setBrushHover(false)} width={512} height={512} onPointerDown={begin} onPointerMove={move} onPointerUp={()=>{stroke.current=null}} onPointerCancel={()=>{stroke.current=null}} onLostPointerCapture={()=>{stroke.current=null}} className={`block max-w-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary [image-rendering:pixelated] ${brushHover&&!showOriginal&&(tool==='brush'||tool==='eraser')?'cursor-none':'cursor-crosshair'}`} aria-label={spec.label+' native texture. Use import/export to edit in an external drawing app.'}/></div>
            {!sceneReady&&<div className="absolute inset-0 grid place-items-center bg-[#24262c] text-sm text-[#e5e0d7]">{error?'Choose another character to load its surfaces.':'Loading texture sheets…'}</div>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-t px-2 py-1.5"><Button variant={grid?'secondary':'ghost'} size="sm" aria-pressed={grid} onClick={()=>setGrid(value=>!value)}><Grid2X2 className="size-3.5"/>Grid</Button><Button variant={wireframe?'secondary':'ghost'} size="sm" aria-pressed={wireframe} onClick={()=>setWireframe(value=>!value)}>UVs</Button>{template.previewModel==='shared'&&<Button variant={guides?'secondary':'ghost'} size="sm" aria-pressed={guides} onClick={()=>setGuides(value=>!value)}>Labels</Button>}<div className="ml-auto flex items-center gap-1"><Button variant={fitMode?'secondary':'ghost'} size="sm" aria-pressed={fitMode} onClick={()=>setFitMode(true)}><Scan className="size-3.5"/>Fit</Button><Select value={String(zoom)} onValueChange={changeZoom}><SelectTrigger className="h-8 w-20" aria-label="Texture zoom"><SelectValue/></SelectTrigger><SelectContent>{editorZooms.map(value=><SelectItem key={value} value={String(value)}>{value}×</SelectItem>)}</SelectContent></Select></div></div>
        </section>
        <aside id="skin-model" aria-label="Live character preview" className={`${studioMode!=='texture'?'flex':`${workspacePane==='model'?'flex':'hidden'} lg:flex lg:border-l`} min-h-0 flex-col overflow-hidden bg-muted/20`}>
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2"><h2 className="font-heading text-lg font-semibold">Live preview</h2><Button size="icon" variant="ghost" className="size-8" aria-label="Character settings and presets" onClick={()=>openDetails('character')}><Settings2 className="size-4"/></Button></div>
          {studioMode==='texture'&&<div className="flex shrink-0 gap-1 border-b p-2"><Button size="sm" className="flex-1" variant={modelMode==='orbit'?'secondary':'ghost'} aria-pressed={modelMode==='orbit'} onClick={()=>{scene.current?.cancelPaint();setModelMode('orbit')}}><Orbit className="size-4"/>Orbit <kbd className="ml-auto text-[10px] text-muted-foreground">V</kbd></Button><Button size="sm" className="flex-1" variant={modelMode==='paint'?'secondary':'ghost'} aria-pressed={modelMode==='paint'} disabled={!sceneReady} onClick={()=>{setModelMode('paint');setShowOriginal(false)}}><Brush className="size-4"/>Paint <kbd className="ml-auto text-[10px] text-muted-foreground">P</kbd></Button></div>}<div ref={viewport} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#dce3ce]">{!sceneReady&&<div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#dce3ce] text-sm text-[#35402b]">{error?'Preview unavailable':'Preparing character…'}</div>}</div>
          <div className="shrink-0 space-y-2 border-t p-2">
            <Select value={modelView} onValueChange={value=>{setModelView(value as typeof modelView);scene.current?.view(value as typeof modelView)}} disabled={!sceneReady}><SelectTrigger className="h-8 w-full" aria-label="Model angle"><SelectValue/></SelectTrigger><SelectContent>{(['front','quarter','back','left','right']as const).map(view=><SelectItem key={view} value={view}>{view==='quarter'?'Three-quarter':view[0].toUpperCase()+view.slice(1)}</SelectItem>)}</SelectContent></Select>
            <div className="flex gap-1"><Select value={clip} onValueChange={setClip} disabled={studioMode==='pose'||studioMode==='geometry'&&modelEditorView.editMode==='vertices'}><SelectTrigger className="h-8 min-w-0 flex-1" aria-label="Animation"><SelectValue/></SelectTrigger><SelectContent>{['idle','walk','run','sit'].map(action=><SelectItem key={action} value={action}>{action[0].toUpperCase()+action.slice(1)}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="outline" className="size-8" disabled={studioMode==='pose'||studioMode==='geometry'&&modelEditorView.editMode==='vertices'} aria-label={playing?'Pause animation':'Play animation'} onClick={()=>setPlaying(value=>!value)}>{playing?<Pause className="size-4"/>:<Play className="size-4"/>}</Button><Button variant="ghost" size="icon" className="size-8" aria-label="Zoom model out" disabled={!sceneReady} onClick={()=>scene.current?.zoomBy(1/1.2)}><Minus className="size-4"/></Button><Button variant="ghost" size="icon" className="size-8" aria-label="Zoom model in" disabled={!sceneReady} onClick={()=>scene.current?.zoomBy(1.2)}><Plus className="size-4"/></Button></div>
            <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{studioMode==='geometry'?modelEditorView.editMode==='vertices'?'Drag points · right-drag to orbit':'Drag gizmo axes · right-drag to orbit':studioMode==='pose'?'Click a joint · drag its rings':modelMode==='paint'?'Drag to paint · right-drag to orbit':'Drag to rotate · click a part to edit'}</p><Button variant="ghost" size="sm" disabled={!sceneReady} onClick={()=>{scene.current?.resetView();setModelView('front')}}>Reset</Button></div>
          </div>
        </aside>
        {studioMode!=='texture'&&<StudioModelTools document={modelDocument} view={modelEditorView} ready={sceneReady} canUndo={modelHistory.current.undo.length>0} canRedo={modelHistory.current.redo.length>0} vertexMeshes={vertexMeshes} vertexSelection={vertexSelection} onMoveVertex={position=>{rememberModel();scene.current?.moveVertex(position)}} onSelectVertex={point=>scene.current?.selectVertex(point)} onChange={commitModel} onRemember={rememberModel} onView={value=>{if(value.editMode){scene.current?.cancelModelEdit();setPlaying(false);setNotice(value.editMode==='vertices'?'Select a mesh, then drag its points. Arrow keys select nearby point indices.':'Select an attachment to move, rotate or scale it.')}if(value.mesh!==undefined){value={...value,vertex:null};setVertexSelection(null)}setModelEditorView(current=>({...current,...value}))}} onSeek={seekMotion} onUndo={undoModel} onError={setError}/>}
      </div>
      <footer className="flex h-7 shrink-0 items-center gap-3 border-t bg-muted/20 px-3 text-xs text-muted-foreground"><span className="min-w-0 flex-1 truncate" role="status">{notice||(studioMode==='texture'?'Select a surface on the left, or click a painted part on the model.':studioMode==='geometry'?'Add geometry and attach it to a joint. W move · E rotate · R scale.':'Pose the joints, then record keyframes to create motion. T applies T-pose.')}</span><span className="hidden shrink-0 tabular-nums sm:inline">{studioMode==='texture'?(history.current[part]?.undo.length??0):modelHistory.current.undo.length}/24 undo</span><span className="shrink-0 tabular-nums">{cursor?`X ${cursor.x} · Y ${cursor.y}`:`${width} × ${height} px`}</span></footer>
      <Input ref={file} type="file" accept="image/png,image/webp" className="hidden" aria-label="Import texture image" onChange={event=>{void importImage(event.target.files?.[0]);event.target.value=''}}/>
      <Input ref={packageFile} type="file" accept="application/json,.json" className="hidden" aria-label="Import skin package" onChange={event=>{const selected=event.target.files?.[0];if(selected)void guarded(async()=>{if(selected.size>12_000_000)throw new Error('Choose a skin package under 12 MB.');await loadPackage(await selected.text())});event.target.value=''}}/>
    </main>
    <Sheet open={inspector!==null} onOpenChange={open=>{if(!open)setInspector(null)}}><SheetContent className="pawtrail-game overflow-y-auto"><SheetHeader><SheetTitle>{inspector==='shortcuts'?'Keyboard shortcuts':inspector==='character'?'Character presets':'Surface details'}</SheetTitle><SheetDescription>{inspector==='shortcuts'?'Shortcuts work while the editor or model has focus. Text fields keep their normal typing behavior.':inspector==='character'?'Change model parts and colors. Export first to keep unsaved texture edits.':`${spec.label} · ${width} × ${height} native pixels`}</SheetDescription></SheetHeader><div className="space-y-5 px-4 pb-6">
      {inspector==='shortcuts'?<><dl className="space-y-3">{[['B','Brush'],['E','Restore original pixels'],['I','Pick color'],['G','Fill connected color'],['[ / ]','Smaller / larger brush'],['P / V','Paint model / orbit model'],['Space + drag','Temporarily orbit model'],['Right-drag','Orbit model'],['Ctrl / Cmd + scroll','Zoom under the pointer'],['+ / −','Zoom focused canvas or model'],['F','Fit texture canvas'],['Ctrl / Cmd + Z','Undo selected surface'],['Ctrl / Cmd + Shift Z / Y','Redo selected surface'],['Ctrl / Cmd + S','Save locally'],['Esc','End stroke / release temporary orbit'],['W / E / R','Move / rotate / scale added geometry'],['T','Apply T-pose in Pose & motion'],['← / →','Select vertex points in Vertices mode'],['Delete','Remove selected added geometry'],['?','Show shortcuts']].map(([key,label])=><div key={key} className="flex items-center justify-between gap-3 text-xs"><dt className="text-muted-foreground">{label}</dt><dd className="shrink-0 rounded border bg-muted px-2 py-1 font-mono">{key}</dd></div>)}</dl><p className="text-xs leading-relaxed text-muted-foreground">The 2D editor and model share the same texture canvases and per-surface history. A model stroke crossing several surfaces adds one undo step to each touched sheet. UV seams are sampled separately. Hover circles show the brush footprint; on the model, the circle follows the surface’s UV scale.</p></>:inspector==='character'?<>
        {template.previewModel==='shared'?<><div className="grid grid-cols-2 gap-3">{(['hair','outfit','face','headwear','legs','wings','held']as const).map(slot=><label key={slot} className="text-xs font-medium capitalize">{slot}<Select value={appearance.parts[slot]} onValueChange={value=>{pendingPackage.current=null;commitModel({...modelDocumentRef.current,meshEdits:[]},false);modelHistory.current={undo:[],redo:[]};setModelHistoryRevision(value=>value+1);setAppearance(current=>({...current,parts:{...current.parts,[slot]:value}}));setNotice('Preset changed. Vertex edits and texture sheets reset to their defaults.')}}><SelectTrigger className="mt-1 w-full"><SelectValue/></SelectTrigger><SelectContent>{creatorContract.parts[slot].map(value=><SelectItem key={value} value={value}>{value.replace(/-/g,' ')}</SelectItem>)}</SelectContent></Select></label>)}</div><div className="flex flex-wrap gap-3">{(['hair','skin','shirt','jacket']as const).map(key=><label key={key} className="text-xs capitalize">{key}<Input type="color" className="mt-1 h-8 w-16 p-1" value={appearance.colors[key]} onChange={event=>{const color=event.target.value;setAppearance(current=>({...current,colors:{...current.colors,[key]:color}}))}}/></label>)}<label className="text-xs">Eyes<Input type="color" className="mt-1 h-8 w-16 p-1" value={appearance.face.leftEye} onChange={event=>{const color=event.target.value;setAppearance(current=>({...current,face:{...current.face,leftEye:color,rightEye:color}}))}}/></label></div></>:<p className="text-sm leading-relaxed text-muted-foreground">{template.name} uses its refined model and original painted materials. Its hair, clothing and accessories keep their character-specific shapes. Choose Trail rescuer for interchangeable geometry presets.</p>}
        <p className="text-xs leading-relaxed text-muted-foreground">Choose Paint to draw on mapped surfaces, or Orbit to rotate the character. Right-drag or hold Space to rotate while painting. Ctrl/Cmd + scroll zooms the model. Painting freezes the pose until you release. Solid-color parts are edited through presets, not UV painting.</p>
      </>:<><p className="text-sm leading-relaxed text-muted-foreground">{spec.description??'Each base body piece has front, back, side, top and bottom paint regions. Original garment colors remain until you paint or import a sheet.'}</p><div><h3 className="mb-2 text-sm font-medium">Used by {spec.meshes?.length??0} meshes</h3><p className="text-xs leading-relaxed text-muted-foreground">{spec.meshes?.map(name=>name.replace(/_/g,' ')).join(', ')||'Bindings appear when the model loads.'}</p></div><p className="text-xs leading-relaxed text-muted-foreground">UVs show where the mesh samples this image. Shared sheets update every mesh listed above. Open, half-blink and closed-eye face maps are separate; edit each to keep facial features consistent.</p><p className="text-xs leading-relaxed text-muted-foreground">Import at exactly {width} × {height} pixels. Transparent pixels retain original artwork. Exported textures exclude grids and guides. Saves stay on this device.</p></>}
    </div></SheetContent></Sheet>
  </PlayShell>
}
