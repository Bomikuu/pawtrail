import {useEffect,useRef,useState} from 'react'
import {PawPrint,RotateCw} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {structureArt,furnitureArt,type RoomArt} from '@/game/housing/room-art'
import type {FloorPlan} from '@/game/housing/presets'

const images=new Map<string,Promise<HTMLImageElement>>()
function load(file:string){
  if(!images.has(file))images.set(file,new Promise<HTMLImageElement>((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image)
    image.onerror=()=>{images.delete(file);reject(new Error('The room preview could not load.'))};image.src=file
  }))
  return images.get(file)!
}

/** Draw the same coordinates, native art and layer order used by the live house. */
export function RoomPreview({plan,floor,wallpaper,furnished=true,large=false}:{plan:FloorPlan;floor:string;wallpaper:string;furnished?:boolean;large?:boolean}){
  const canvas=useRef<HTMLCanvasElement>(null),[status,setStatus]=useState<'loading'|'ready'|'error'>('loading'),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    let cancelled=false;setStatus('loading')
    const art:RoomArt[]=[...structureArt(plan,wallpaper)]
    if(furnished)for(const piece of plan.items){const image=furnitureArt(piece);if(image)art.push(image)}
    const floorFile=`/assets/game/housing/tilesets/${floor}-housing-v1.png`
    const files=[...new Set([floorFile,...art.flatMap(a=>a.kind==='image'?[a.file]:[])])]
    void Promise.all(files.map(async file=>[file,await load(file)] as const)).then(entries=>{
      if(cancelled||!canvas.current)return
      const context=canvas.current.getContext('2d');if(!context){setStatus('error');return}
      const bitmap=new Map(entries),width=plan.width*32,height=plan.height*32
      context.imageSmoothingEnabled=false;context.clearRect(0,0,width,height)
      context.fillStyle=context.createPattern(bitmap.get(floorFile)!,'repeat')!;context.fillRect(0,0,width,height)
      for(const command of art.sort((a,b)=>a.depth-b.depth)){
        if(command.kind==='rect'){
          context.fillStyle='#'+command.color.toString(16).padStart(6,'0')
          context.fillRect(command.x,command.y,command.width,command.height)
        }else{
          const image=bitmap.get(command.file)!;context.save();context.translate(command.x,command.y)
          context.rotate((command.rotation||0)*Math.PI/180)
          context.drawImage(image,-image.width*command.origin[0],-image.height*command.origin[1]);context.restore()
        }
      }
      setStatus('ready')
    }).catch(()=>{if(!cancelled)setStatus('error')})
    return()=>{cancelled=true}
  },[plan,floor,wallpaper,furnished,attempt])
  return <div className={'relative w-full overflow-hidden bg-[#332219] '+(large?'aspect-[4/3] max-h-[30rem]':'aspect-[3/2]')} aria-busy={status==='loading'}>
    <canvas ref={canvas} width={plan.width*32} height={plan.height*32} role="img" aria-label={`${plan.label}: ${plan.rooms.join(', ')}. ${furnished?'Furnished arrangement':'Empty rooms'}.`} className={'pointer-events-none absolute inset-0 h-full w-full object-contain p-2 [image-rendering:pixelated] '+(status==='ready'?'opacity-100':'opacity-0')}/>
    {status==='loading'&&<span className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-[#edd6b4]" role="status"><PawPrint className="size-4 motion-safe:animate-pulse"/>Preparing room…</span>}
    {status==='error'&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs text-[#edd6b4]" role="status"><span>Room preview unavailable</span>{large&&<Button size="sm" variant="secondary" onClick={()=>setAttempt(n=>n+1)}><RotateCw className="size-3"/>Retry preview</Button>}</div>}
  </div>
}
