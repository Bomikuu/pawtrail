import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import {createRescuer,createCat,createEmoteCar,animationClips,palette,actions,appearancePalette,type AppearanceOptions} from './rigs'
import catalogue from '../../actor-appearances/catalog.json'
const directions=['down','down_left','left','up_left','up','up_right','right','down_right']
const output=document.querySelector('#output')!,status=document.querySelector('#status')!
const renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;renderer.setClearColor(0,0)
output.append(renderer.domElement);renderer.domElement.style.cssText='width:256px;height:384px;image-rendering:pixelated;object-fit:contain'
async function base64(buffer:ArrayBuffer){const blob=new Blob([buffer]);return await new Promise<string>((resolve)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.readAsDataURL(blob)})}
async function exportAll(selected?:string[]){
 const frames:object[]=[],models:object[]=[]
 for(const kind of ['rescuer','orange-tabby'] as const){const rig=kind==='rescuer'?createRescuer():createCat(),scene=new T.Scene();scene.add(rig.root)
  const w=32,h=kind==='rescuer'?48:32,target=kind==='rescuer'?21.5:13,camera=new T.OrthographicCamera(-16,16,h/2,-h/2,.1,200);camera.position.set(0,kind==='rescuer'?56:44,kind==='rescuer'?90:68);camera.lookAt(0,target,0);renderer.setSize(w,h,false)
  for(let d=0;d<8;d++)for(const [action,config] of Object.entries(actions[kind])){
   if(selected?.length&&!selected.includes(action))continue
   const count='frames' in config?Number(config.frames):8
   for(let f=0;f<count;f++){
   rig.pose(action,f/(config.repeat===0?count-1:count));rig.root.rotation.y=-d*Math.PI/4;renderer.render(scene,camera)
   frames.push({kind,action,direction:directions[d],frame:f,png:renderer.domElement.toDataURL('image/png').split(',')[1]})
   status.textContent=`Rendering ${kind} · ${action} · ${directions[d]} · ${f+1}/${count}`
   if(f===count-1)await new Promise(requestAnimationFrame)
   }
  }
  rig.root.rotation.y=0;const clips=animationClips(rig),binary=await new GLTFExporter().parseAsync(rig.root,{binary:true,animations:clips}) as ArrayBuffer;models.push({kind,glb:await base64(binary)});scene.remove(rig.root)
 }
 const response=await fetch('/__art/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frames,models,palette,directions,actions})});const data=await response.json();status.textContent=data.message;document.body.dataset.complete='true';return data
}
;(window as any).exportApproval=exportAll
;(window as any).exportAppearanceApproval=async(id:string,selected?:string[])=>{
 const appearance=catalogue.appearances.find(entry=>entry.id===id)
 if(!appearance)throw Error('Unknown appearance: '+id)
 const kind=appearance.kind as 'rescuer'|'orange-tabby'
 const options=appearance as unknown as AppearanceOptions
 const rig=kind==='rescuer'?createRescuer(options):createCat(options),scene=new T.Scene()
 const w=options.frame?.width??32,h=options.frame?.height??(kind==='rescuer'?48:32),target=kind==='rescuer'?21.5:13
 const camera=new T.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,200)
 camera.position.set(0,kind==='rescuer'?56:44,kind==='rescuer'?90:68);camera.lookAt(0,target,0)
 scene.add(rig.root);renderer.setSize(w,h,false)
 const frames:object[]=[]
 for(let d=0;d<8;d++)for(const [action,config] of Object.entries(actions[kind])){
  if(selected?.length&&!selected.includes(action))continue
  const count='frames' in config?Number(config.frames):8
  for(let frame=0;frame<count;frame++){
   rig.pose(action,frame/(config.repeat===0?count-1:count));rig.root.rotation.y=-d*Math.PI/4;renderer.render(scene,camera)
   frames.push({action,direction:directions[d],frame,png:renderer.domElement.toDataURL('image/png').split(',')[1]})
   status.textContent=`Rendering ${appearance.name} · ${action} · ${directions[d]}`
   if(frame===count-1)await new Promise(requestAnimationFrame)
  }
 }
 rig.root.rotation.y=0
 const binary=await new GLTFExporter().parseAsync(rig.root,{binary:true,animations:animationClips(rig)}) as ArrayBuffer
 const response=await fetch('/__art/appearance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,frames,model:await base64(binary),palette:appearancePalette(options)})})
 const result=await response.json();if(!response.ok)throw Error(result.message)
 status.textContent=result.message;return result
}
;(window as any).exportCarApproval=async()=>{
 const car=createEmoteCar(),scene=new T.Scene(),w=80,h=64,count=12
 scene.add(car.root)
 const camera=new T.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,250)
 camera.position.set(0,62,90);camera.lookAt(0,9,0);camera.updateMatrixWorld()
 const ground=new T.Vector3(0,0,0).project(camera)
 const groundPixel={x:Math.round((ground.x+1)*w/2),y:Math.round((1-ground.y)*h/2)}
 const frames:object[]=[];renderer.setSize(w,h,false)
 for(let d=0;d<8;d++)for(let f=0;f<count;f++){
  car.pose(f/count);car.root.rotation.y=-d*Math.PI/4;renderer.render(scene,camera)
  frames.push({direction:directions[d],frame:f,png:renderer.domElement.toDataURL('image/png').split(',')[1]})
  if(f===count-1)await new Promise(requestAnimationFrame)
 }
 const model=await new GLTFExporter().parseAsync(car.root,{binary:true}) as ArrayBuffer
 const response=await fetch('/__art/car',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frames,model:await base64(model),palette,frameWidth:w,frameHeight:h,groundPixel})})
 const data=await response.json();status.textContent=data.message;return data
}
;(window as any).renderApprovalDetail=(kind:'rescuer'|'orange-tabby')=>{
 const scene=new T.Scene(),rig=kind==='rescuer'?createRescuer():createCat(),h=kind==='rescuer'?48:32,target=kind==='rescuer'?21.5:13,camera=new T.OrthographicCamera(-16,16,h/2,-h/2,.1,200)
 scene.add(rig.root);camera.position.set(0,kind==='rescuer'?56:44,kind==='rescuer'?90:68);camera.lookAt(0,target,0);rig.pose('idle',0);renderer.setSize(256,h*8,false);renderer.render(scene,camera);renderer.domElement.style.cssText=`width:256px;height:${h*8}px;image-rendering:pixelated`
}
status.textContent='Ready to render the two source rigs.'
