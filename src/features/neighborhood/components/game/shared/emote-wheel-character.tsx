import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as T from 'three'
import {
  bakedActor,
  bakedDirection,
  type BakedActor,
  type BakedDirection,
} from '@/features/neighborhood/game/runtime/baked-actors'
import {customCharacterId} from '@/features/neighborhood/game/actor-rig/appearance'
import {getSavedCharacter,resolveSavedCharacter} from '@/features/neighborhood/game/creator/library'
import { SPEAKER_PORTRAITS } from '@/features/neighborhood/game/characters'

type Gaze = { x: number; y: number }
type CharacterProps = { identity: string; gaze: Gaze; reduced: boolean }

/** Reuse the finished frames and heading rules that render the character in Phaser. */
function NativeWheelCharacter({
  sheet,
  gaze,
  reduced,
}: Omit<CharacterProps, 'identity'> & { sheet: BakedActor }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const target = useRef({ gaze, reduced })
  target.current = { gaze, reduced }
  const invalidate = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  useEffect(() => {
    invalidate.current()
  }, [gaze.x, gaze.y, reduced])
  useEffect(() => {
    const image = new Image()
    let disposed = false,
      frame = 0,
      lastFrame = -1
    let direction: BakedDirection = 'down'
    const epoch = performance.now()
    setReady(false)
    const draw = (time: number) => {
      frame = 0
      if (disposed || document.hidden) return
      const context = canvas.current?.getContext('2d')
      if (!context) return
      const current = target.current
      direction = bakedDirection(
        Math.atan2(current.gaze.x, current.gaze.y),
        direction,
      )
      const animation =
        sheet.animations['idle-' + direction] ?? sheet.animations['idle-down']
      if (!animation) return
      const count = animation.end - animation.start + 1
      const index =
        animation.start +
        (current.reduced
          ? 0
          : Math.floor(((time - epoch) / 1000) * animation.frameRate) % count)
      if (index !== lastFrame) {
        const columns = Math.floor(
          (image.naturalWidth - sheet.margin * 2 + sheet.spacing) /
            (sheet.frameWidth + sheet.spacing),
        )
        if (!columns) return
        context.clearRect(0, 0, sheet.frameWidth, sheet.frameHeight)
        context.imageSmoothingEnabled = false
        context.drawImage(
          image,
          sheet.margin + (index % columns) * (sheet.frameWidth + sheet.spacing),
          sheet.margin +
            Math.floor(index / columns) * (sheet.frameHeight + sheet.spacing),
          sheet.frameWidth,
          sheet.frameHeight,
          0,
          0,
          sheet.frameWidth,
          sheet.frameHeight,
        )
        if (lastFrame < 0) setReady(true)
        lastFrame = index
      }
      if (!current.reduced) frame = requestAnimationFrame(draw)
    }
    const request = () => {
      if (!disposed && !document.hidden && !frame && image.naturalWidth)
        frame = requestAnimationFrame(draw)
    }
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else request()
    }
    invalidate.current = request
    image.onload = request
    image.src = sheet.file
    document.addEventListener('visibilitychange', visibility)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      invalidate.current = () => {}
      image.onload = null
      image.src = ''
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [sheet])
  const dimensions = {
    '--actor-width': `${sheet.frameWidth}px`,
    '--actor-height': `${sheet.frameHeight}px`,
  } as CSSProperties
  return (
    <div
      aria-hidden="true"
      className="relative grid size-full place-items-center overflow-hidden"
    >
      {!ready && (
        <img
          src={sheet.file.replace('spritesheet.png', 'portrait.png')}
          alt=""
          className="absolute h-36 w-auto [image-rendering:pixelated] [@media(min-width:640px)_and_(min-height:640px)]:h-48 [@media(max-height:480px)]:h-24"
        />
      )}
      <canvas
        ref={canvas}
        width={sheet.frameWidth}
        height={sheet.frameHeight}
        style={dimensions}
        className="[--actor-zoom:3] [width:calc(var(--actor-width)*var(--actor-zoom))] [height:calc(var(--actor-height)*var(--actor-zoom))] [image-rendering:pixelated] [@media(min-width:640px)_and_(min-height:640px)]:[--actor-zoom:4] [@media(max-height:480px)]:[--actor-zoom:2]"
      />
    </div>
  )
}

/** Non-baked appearances use the same mesh, camera and preferences as the game. */
function MeshWheelCharacter({ identity, gaze, reduced }: CharacterProps) {
  const host = useRef<HTMLDivElement>(null)
  const target = useRef({ gaze, reduced })
  target.current = { gaze, reduced }
  const invalidate = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  useEffect(() => {
    invalidate.current()
  }, [gaze.x, gaze.y, reduced])
  useEffect(() => {
    const container = host.current
    if (!container) return
    let cancelled = false,
      frame = 0,
      last = 0
    let renderer: T.WebGLRenderer | undefined
    let release: (() => void) | undefined
    setReady(false)
    async function start() {
      try {
        const [
          { createModel, modelStage, pixelRenderer, pose },
          { modelPreferences },
        ] = await Promise.all([
          import('@/features/neighborhood/game/models3d/model'),
          import('@/features/neighborhood/game/models3d/preferences'),
        ])
        if (cancelled) return
        renderer = pixelRenderer()
        renderer.domElement.className =
          'h-30 w-24 [image-rendering:pixelated] [@media(min-width:640px)_and_(min-height:640px)]:h-45 [@media(min-width:640px)_and_(min-height:640px)]:w-36 [@media(max-height:480px)]:h-15 [@media(max-height:480px)]:w-12'
        const stage = modelStage()
        const rig = createModel({
          ...modelPreferences(identity),
          kind: 'player',
          identity,
        })
        release = rig.dispose
        stage.scene.add(rig.root)
        container.appendChild(renderer.domElement)
        const look = { x: 0, y: 0 }
        let presented = false
        const draw = (time: number) => {
          frame = 0
          if (cancelled || document.hidden) return
          const delta = Math.min(0.05, last ? (time - last) / 1000 : 1 / 30)
          if (last && time - last < 30 && !target.current.reduced) {
            frame = requestAnimationFrame(draw)
            return
          }
          last = time
          rig.head.rotation.set(0, 0, 0)
          pose(rig, 'player', 'idle', time, 0, {
            exactYaw: true,
            reducedMotion: target.current.reduced,
          })
          const { gaze: next, reduced: still } = target.current
          look.x = still ? next.x : T.MathUtils.damp(look.x, next.x, 15, delta)
          look.y = still ? next.y : T.MathUtils.damp(look.y, next.y, 15, delta)
          rig.root.rotation.y = look.x * 0.1
          rig.head.rotation.y += look.x * 0.58
          rig.head.rotation.x += look.y * 0.28
          renderer!.render(stage.scene, stage.camera)
          if (!presented) {
            presented = true
            setReady(true)
          }
          if (!still) frame = requestAnimationFrame(draw)
        }
        const request = () => {
          if (!cancelled && !document.hidden && !frame) {
            last = 0
            frame = requestAnimationFrame(draw)
          }
        }
        invalidate.current = request
        request()
      } catch {
        release?.()
        release = undefined
        renderer?.dispose()
        renderer?.forceContextLoss()
        renderer?.domElement.remove()
      }
    }
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame)
        frame = 0
      } else invalidate.current()
    }
    document.addEventListener('visibilitychange', visibility)
    void start()
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      invalidate.current = () => {}
      document.removeEventListener('visibilitychange', visibility)
      release?.()
      renderer?.dispose()
      renderer?.forceContextLoss()
      renderer?.domElement.remove()
    }
  }, [identity])
  return (
    <div
      aria-hidden="true"
      className="relative grid size-full place-items-center overflow-hidden"
    >
      {!ready && SPEAKER_PORTRAITS[identity] && (
        <img
          src={SPEAKER_PORTRAITS[identity]}
          alt=""
          className="absolute h-30 w-auto object-contain [image-rendering:pixelated]"
        />
      )}
      <div ref={host} className="grid size-full place-items-center" />
    </div>
  )
}


function PersonalWheelCharacter({identity,gaze,reduced}:CharacterProps){
  const canvas=useRef<HTMLCanvasElement>(null),target=useRef({gaze,reduced})
  target.current={gaze,reduced}
  const invalidate=useRef<()=>void>(()=>{}),[failed,setFailed]=useState(false)
  useEffect(()=>invalidate.current(),[gaze.x,gaze.y,reduced])
  useEffect(()=>{
    let canceled=false,frame=0,actor:import('@/features/neighborhood/game/actor-rig/pixel-renderer').PixelActor|undefined
    setFailed(false)
    const epoch=performance.now();let heading:BakedDirection='down',last=''
    const draw=(time:number)=>{
      frame=0;if(canceled||document.hidden||!actor)return
      const current=target.current
      heading=bakedDirection(Math.atan2(current.gaze.x,current.gaze.y),heading)
      const index=current.reduced?0:Math.floor((time-epoch)/1000*4)%8,signature=heading+':'+index
      if(signature!==last){try{canvas.current?.getContext('2d')?.putImageData(actor.frame('idle',heading,index),0,0);last=signature}catch{setFailed(true);return}}
      if(!current.reduced)frame=requestAnimationFrame(draw)
    }
    const request=()=>{if(!canceled&&!document.hidden&&!frame)frame=requestAnimationFrame(draw)}
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()}
    invalidate.current=request
    void Promise.all([import('@/features/neighborhood/game/actor-rig/pixel-renderer'),getSavedCharacter(identity)??resolveSavedCharacter(identity)]).then(([{PixelActor},row])=>{
      if(canceled)return;if(!row){setFailed(true);return}
      try{actor=new PixelActor(row.appearance);request()}catch{setFailed(true)}
    }).catch(()=>{if(!canceled)setFailed(true)})
    document.addEventListener('visibilitychange',visibility)
    return()=>{canceled=true;cancelAnimationFrame(frame);actor?.dispose();invalidate.current=()=>{};document.removeEventListener('visibilitychange',visibility)}
  },[identity])
  return <div aria-hidden="true" className="grid size-full place-items-center overflow-hidden">{failed?<span className="font-heading text-sm">Your character</span>:<canvas ref={canvas} width={64} height={80} className="h-40 w-32 [image-rendering:pixelated] [@media(min-width:640px)_and_(min-height:640px)]:h-60 [@media(min-width:640px)_and_(min-height:640px)]:w-48 [@media(max-height:480px)]:h-20 [@media(max-height:480px)]:w-16"/>}</div>
}

export default function EmoteWheelCharacter(props: CharacterProps) {
  if(customCharacterId(props.identity))return <PersonalWheelCharacter {...props}/>
  const sheet = bakedActor('player', props.identity)
  return sheet ? (
    <NativeWheelCharacter
      sheet={sheet}
      gaze={props.gaze}
      reduced={props.reduced}
    />
  ) : (
    <MeshWheelCharacter {...props} />
  )
}
