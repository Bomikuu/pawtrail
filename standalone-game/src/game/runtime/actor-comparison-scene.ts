import {enterAbilities,activateLocalAbility,cancelLocalAbility,activeAbility,movementProfile,isAbility} from '../abilities/state';
import {headingVector} from '../abilities/appearance';
import Phaser from 'phaser'
import native from './native-actors.json'
import { bakedActor, bakedDirection, preloadBakedActors, preloadBakedSheet, type BakedActor } from './baked-actors'
import { actorComparison, faceInspection, type ComparisonAction, type ComparisonDirection } from './actor-comparison-state'
import { ActorEmoteEffects } from './emote-effects'
import { ActorGroundShadow } from './actor-shadow'
import { actorPreviews } from './actor-previews'
import { PixelActor, CREATOR_FRAME, humanClips } from '../actor-rig/pixel-renderer'
import { characterCreator, creatorPreviewCapture } from '../creator/state'
import { appearanceHeadHeight } from '../actor-rig/appearance'
import { allowsMovingAction, usesWalkingLegs, actorEffectAction } from '../actor-rig/action-layers'
import {ActionPlayback} from '../actor-rig/action-playback'
import { PixelCat, CAT_CREATOR_FRAME, catClips } from '../actor-rig/cat-pixel-renderer'
import { catCreator, catPreviewCapture } from '../cat-creator/state'
import { catBodyScale } from '../actor-rig/cat-appearance'

type Kind = 'player' | 'cat'
type Clip = { frames: number[]; fps: number; once: boolean }
type View = { live?:boolean; sprite: Phaser.GameObjects.Sprite; kind: Kind; original: boolean; native: boolean; sheet: BakedActor; label: Phaser.GameObjects.Text; effects?: ActorEmoteEffects; shadow?: ActorGroundShadow }
type NativeAnimation = { sheet: string; fps: number; frames: { x: number; y: number }[] }
const nativeAnimations = native.animations as Record<string, NativeAnimation>
const keys = { player: 'compare:original:rescuer', cat: 'compare:original:orange_tabby' }
const ids = { player: 'rescuer', cat: 'orange_tabby' } as const
const movementKeys = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'])

function cardinal(direction: ComparisonDirection) {
  return direction.includes('down') ? 'down' : direction.includes('up') ? 'up' : direction
}

function originalClip(kind: Kind, action: ComparisonAction, direction: ComparisonDirection): Clip {
  const id = ids[kind]
  const heading = cardinal(direction)
  const name = action === 'idle' ? (kind === 'player' ? 'idle_' + heading : 'idle')
    : action === 'walk' ? 'walk_' + heading
    : action === 'feed' ? (kind === 'player' ? 'feed' : 'eat')
    : action === 'pet' ? (kind === 'player' ? 'pet' : 'petted') : action
  const fallback = kind === 'player' ? 'idle_' + heading : 'idle'
  const animation = nativeAnimations[id + '/' + name] ?? nativeAnimations[id + '/' + fallback]
  const sheet = native.sheets[id]
  return {
    frames: animation.frames.map(f => f.y / sheet.frameHeight * sheet.columns + f.x / sheet.frameWidth),
    fps: animation.fps, once: false,
  }
}

function currentClip(sheet: BakedActor, action: ComparisonAction, direction: ComparisonDirection): Clip {
  const name = sheet.kind === 'cat' ? ({feed:'eat',water:'drink'} as Record<string,string>)[action] ?? action : action
  const animation = sheet.animations[name + '-' + direction] ?? sheet.animations['idle-' + direction]
  return { frames: Array.from({ length: animation.end - animation.start + 1 }, (_, i) => animation.start + i), fps: animation.frameRate, once: animation.repeat === 0 }
}

/** Four explicit appearances. Legacy views deliberately bypass the appearance binding. */
export class ActorComparisonScene extends Phaser.Scene {
  private views: View[] = []
  private ground!: Phaser.GameObjects.TileSprite
  private marks!: Phaser.GameObjects.Graphics
  private pressed = new Set<string>()
  private elapsed = 0
  private strideElapsed = 0
  private presentationClock=0
  private playback=new ActionPlayback()
  private offset = { x: 0, y: 0 }
  private world = { width: 240, height: 150 }
  private lastZoom = 0
  private lastDetail = false
  private lastAction = ''
  private lastRestart = -1
  private clipSignature = ''
  private clips: Clip[] = []
  private live?:PixelActor | PixelCat
  private liveTexture?:Phaser.Textures.CanvasTexture
  private appearanceRevision=-1
  private appearanceChangedAt=0
  private renderSignature=''

  constructor() { super('ActorCompare') }

  preload() {
    actorComparison.patch({ status: 'loading', load: 0, error: '' })
    this.load.on('progress', (load: number) => actorComparison.patch({ load }))
    this.load.on('loaderror', () => actorComparison.patch({ status: 'error', error: 'A comparison asset could not load. Please retry.' }))
    for (const kind of ['player', 'cat'] as const) {
      const id = ids[kind], sheet = native.sheets[id]
      if (!this.textures.exists(keys[kind])) {
        this.load.spritesheet(keys[kind], '/pawtrail-game/game-assets/' + id + '.png', {
          frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight,
        })
      }
    }
    preloadBakedActors(this)
    if (actorComparison.getSnapshot().mode === 'skin') {
      const preview = actorPreviews.find(entry => entry.id === actorComparison.getSnapshot().appearance)
      if (preview) preloadBakedSheet(this, preview.sheet)
    }
    if (!this.textures.exists('compare:grass')) {
      this.load.spritesheet('compare:grass', '/pawtrail-game/game-assets/terrain.png', { frameWidth: 32, frameHeight: 32 })
    }
  }

  create() {
    this.views = []
    this.elapsed = 0
    this.strideElapsed = 0
    this.presentationClock=0;this.playback.reset()
    this.offset = { x: 0, y: 0 }
    this.pressed.clear()
    this.lastAction = ''
    this.lastRestart = -1
    this.lastZoom = 0
    this.clipSignature = ''
    this.clips = []
    if (actorComparison.getSnapshot().status === 'error') return
    this.ground = this.add.tileSprite(0, 0, 1, 1, 'compare:grass', 0).setOrigin(0).setDepth(0)
    this.marks = this.add.graphics().setDepth(1)
    let previewTexture: string | undefined
    const creator=actorComparison.getSnapshot().mode==='creator'
    const cats=actorComparison.getSnapshot().mode==='cat-creator'
    if(creator){const leave=enterAbilities('preview');this.events.once(Phaser.Scenes.Events.SHUTDOWN,leave)}
    if(creator || cats){
      try{
        const draft=cats?catCreator.getSnapshot():characterCreator.getSnapshot()
        this.live=cats?new PixelCat(catCreator.getSnapshot().appearance):new PixelActor(characterCreator.getSnapshot().appearance,CREATOR_FRAME.density)
        const frame=cats?CAT_CREATOR_FRAME:CREATOR_FRAME
        this.appearanceRevision=draft.renderRevision;this.appearanceChangedAt=0;this.renderSignature=''
        this.liveTexture=this.textures.createCanvas('creator:live',frame.width,frame.height)!
        this.liveTexture.setFilter(Phaser.Textures.FilterMode.NEAREST)
        if(cats)catPreviewCapture.set(()=>{(this.live as PixelCat).setAppearance(catCreator.getSnapshot().appearance);return this.live!.portrait()})
        else creatorPreviewCapture.set(()=>{(this.live as PixelActor).setAppearance(characterCreator.getSnapshot().appearance);return this.live!.portrait()})
        const kind=cats?'cat':'player',base=bakedActor(kind,cats?'orange_tabby':'rescuer')!
        for(const original of [true,false]){
          const sheet=original?base:{...base,texture:'creator:live',frameWidth:frame.width,frameHeight:frame.height,anchor:frame.anchor}
          this.textures.get(sheet.texture).setFilter(Phaser.Textures.FilterMode.NEAREST)
          const sprite=this.add.sprite(0,0,sheet.texture).setOrigin(sheet.anchor.x,sheet.anchor.y)
          if(!original)sprite.setScale(1/frame.density).setData('actorPixelDensity',frame.density)
          sprite.vertexRoundMode='fullAuto'
          const label=this.add.text(0,0,original?'Approved base':cats?'Your cat':'Your character',{fontFamily:'Saira Condensed',fontSize:'8px',color:'#38271e',backgroundColor:'#fff2da',padding:{left:3,right:3,top:1,bottom:1}}).setOrigin(.5,0).setDepth(4)
          this.views.push({sprite,kind,original,native:false,live:!original,sheet,label,effects:new ActorEmoteEffects(this,kind)})
        }
      }catch(error){
        this.live?.dispose();this.live=undefined;creatorPreviewCapture.set(undefined);catPreviewCapture.set(undefined)
        if(this.textures.exists('creator:live'))this.textures.remove('creator:live')
        actorComparison.patch({status:'error',error:error instanceof Error?error.message:'The appearance renderer could not open.'});return
      }
    }else if (actorComparison.getSnapshot().mode === 'skin') {
      const preview = actorPreviews.find(entry => entry.id === actorComparison.getSnapshot().appearance)
      if (!preview) { actorComparison.patch({status:'error',error:'No exported appearance is available. Render an appearance with the PawTrail Actors skill first.'}); return }
      const kind = preview.sheet.kind
      previewTexture = preview.sheet.texture
      const base = bakedActor(kind, ids[kind])!
      for (const original of [true, false]) {
        const sheet = original ? base : preview.sheet
        this.textures.get(sheet.texture).setFilter(Phaser.Textures.FilterMode.NEAREST)
        const sprite = this.add.sprite(0,0,sheet.texture).setOrigin(sheet.anchor.x,sheet.anchor.y)
        sprite.vertexRoundMode='fullAuto'
        const label = this.add.text(0,0,original ? 'Approved base' : preview.name, {
          fontFamily:'Saira Condensed',fontSize:'8px',color:'#38271e',backgroundColor:'#fff2da',padding:{left:3,right:3,top:1,bottom:1},
        }).setOrigin(.5,0).setDepth(4)
        this.views.push({sprite,kind,original,native:false,sheet,label,effects:new ActorEmoteEffects(this,kind)})
      }
    } else for (const kind of ['player', 'cat'] as const) {
      const sheet = bakedActor(kind, ids[kind])!
      this.textures.get(keys[kind]).setFilter(Phaser.Textures.FilterMode.NEAREST)
      this.textures.get(sheet.texture).setFilter(Phaser.Textures.FilterMode.NEAREST)
      for (const original of [true, false]) {
        const source = native.sheets[ids[kind]]
        const sprite = this.add.sprite(0, 0, original ? keys[kind] : sheet.texture)
        sprite.setOrigin(original ? source.anchor[0] / source.frameWidth : sheet.anchor.x,
          original ? source.anchor[1] / source.frameHeight : sheet.anchor.y)
        sprite.vertexRoundMode = 'fullAuto'
        const label = this.add.text(0, 0, kind === 'player' ? 'Trail rescuer' : 'Orange tabby', {
          fontFamily: 'Saira Condensed', fontSize: '8px', color: '#38271e',
          backgroundColor: '#fff2da', padding: { left: 3, right: 3, top: 1, bottom: 1 },
        }).setOrigin(.5, 0).setDepth(4)
        this.views.push({ sprite, kind, original, native: original, sheet, label, effects: original ? undefined : new ActorEmoteEffects(this, kind), shadow: original ? new ActorGroundShadow(this, kind) : undefined })
      }
    }
    const canvas = this.game.canvas
    const previousLabel = canvas.getAttribute('aria-label')
    const previousDescription = canvas.getAttribute('aria-describedby')
    canvas.setAttribute('aria-label', 'Character comparison field. Click here, then use arrow keys or W A S D to move both versions together.')
    canvas.setAttribute('aria-describedby', 'actor-comparison-help')
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (document.activeElement !== canvas || !movementKeys.has(key)) return
      event.preventDefault()
      this.pressed.add(key)
    }
    const up = (event: KeyboardEvent) => { this.pressed.delete(event.key.toLowerCase()) }
    const clear = () => {
      this.pressed.clear()
      const input = actorComparison.getSnapshot()
      if (input.inputX || input.inputY) actorComparison.patch({ inputX: 0, inputY: 0 })
    }
    const visible = () => { if (document.hidden) clear() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', visible)
    canvas.addEventListener('blur', clear)
    this.scale.on('resize', this.layout, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const view of this.views) { view.effects?.destroy(); view.shadow?.destroy() }
      if(creator || cats){creatorPreviewCapture.set(undefined);catPreviewCapture.set(undefined);this.live?.dispose();this.live=undefined;for(const view of this.views)if(view.live)view.sprite.destroy();if(this.textures.exists('creator:live'))this.textures.remove('creator:live');this.liveTexture=undefined}
      if (previewTexture) {
        for (const view of this.views) if (!view.native && view.sheet.texture === previewTexture) view.sprite.destroy()
        if (this.textures.exists(previewTexture)) this.textures.remove(previewTexture)
      }
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', visible)
      canvas.removeEventListener('blur', clear)
      if (previousLabel === null) canvas.removeAttribute('aria-label')
      else canvas.setAttribute('aria-label', previousLabel)
      if (previousDescription === null) canvas.removeAttribute('aria-describedby')
      else canvas.setAttribute('aria-describedby', previousDescription)
      this.scale.off('resize', this.layout, this)
      this.pressed.clear()
    })
    actorComparison.patch({ status: 'ready', load: 1 })
    this.layout()
  }

  private layout() {
    if (!this.ground) return
    const options = actorComparison.getSnapshot()
    const preview = options.mode === 'skin' ? actorPreviews.find(entry => entry.id === options.appearance) : undefined
    const editing=options.mode==='creator'||options.mode==='cat-creator'
    const detail=faceInspection(options)
    const minimumWidth = detail?80:options.mode==='cat-creator'?176:editing?144:preview ? (preview.sheet.frameWidth + 8) * 2 : 1
    const zoomLimit = Math.max(1, Math.min(detail?10:4, Math.floor(this.scale.width / minimumWidth), detail?Math.floor(this.scale.height/48):editing?Math.floor(this.scale.height/112):4))
    const zoom = Math.min(options.zoom, zoomLimit)
    if (zoom !== options.zoom || zoomLimit !== options.zoomLimit) actorComparison.patch({zoom,zoomLimit})
    this.lastZoom = zoom
    this.lastDetail = detail
    this.world = { width: Math.floor(this.scale.width / zoom), height: Math.floor(this.scale.height / zoom) }
    this.cameras.main.setZoom(zoom).setRoundPixels(true).centerOn(this.world.width / 2, this.world.height / 2)
    this.ground.setSize(this.world.width + 2, this.world.height + 2)
  }

  update(_time: number, delta: number) {
    if (!this.ground || actorComparison.getSnapshot().status !== 'ready') return
    const options = actorComparison.getSnapshot()
    if (this.lastZoom !== options.zoom || this.lastDetail!==faceInspection(options)) this.layout()
    if (options.restart !== this.lastRestart || options.action !== this.lastAction) {
      this.elapsed = 0
      if(options.mode==='creator'){
        const selected=options.action==='power_run'?'power_up':options.action;
        if(isAbility(selected)){
          if(!activateLocalAbility(selected,characterCreator.getSnapshot().appearance)){actorComparison.patch({action:'idle'});return}
        }else cancelLocalAbility();
      }
      if (options.restart !== this.lastRestart){this.offset = { x: 0, y: 0 };this.strideElapsed=0;this.presentationClock=0;this.playback.reset()}
      this.lastRestart = options.restart
      this.lastAction = options.action
    }
    const ability=options.action==='power_run'?'power_up':options.action;
    if(options.mode==='creator'&&isAbility(ability)&&activeAbility()?.id!==ability){actorComparison.patch({action:'idle'});return}
    const motion=options.mode==='cat-creator'?{speed:options.action==='run'?155:105,running:options.action==='run',dash:false,gentle:false}:movementProfile(characterCreator.getSnapshot().appearance,options.action==='run');
    let x = options.inputX + (this.pressed.has('d') || this.pressed.has('arrowright') ? 1 : 0) - (this.pressed.has('a') || this.pressed.has('arrowleft') ? 1 : 0)
    let y = options.inputY + (this.pressed.has('s') || this.pressed.has('arrowdown') ? 1 : 0) - (this.pressed.has('w') || this.pressed.has('arrowup') ? 1 : 0)
    if(motion.dash&&!x&&!y){const heading=headingVector(options.direction);x=heading.x;y=heading.y}
    const moving = !options.paused && !!(x || y)
    let direction = options.direction
    let traveled=0;
    if (moving) {
      const before={...this.offset};
      const length = Math.max(1, Math.hypot(x, y)), dt = Math.min(delta, 40) / 1000
      const preview = options.mode === 'skin' ? actorPreviews.find(entry => entry.id === options.appearance) : undefined
      const silhouetteHalf = options.mode==='creator'?34:options.mode==='cat-creator'?42:preview ? Math.max(20, preview.sheet.frameWidth/2+2) : 20
      const maxX = Math.max(0, this.world.width / (faceInspection(options)?2:4) - (options.action === 'ride' ? Math.max(44,silhouetteHalf) : silhouetteHalf))
      const baseline = options.mode !== 'legacy' ? .62 : .43
      const bottomRoom = options.mode !== 'legacy' ? .38 : .21
      const maxY = Math.min(12, this.world.height * .06, Math.max(0, this.world.height * baseline - 66),
        options.action === 'ride' ? Math.max(0, this.world.height * bottomRoom - 34) : 12)
      this.offset.x = Phaser.Math.Clamp(this.offset.x + x / length * motion.speed*.25 * dt, -maxX, maxX)
      this.offset.y = Phaser.Math.Clamp(this.offset.y + y / length * motion.speed*.25 * dt, -maxY, maxY)
      traveled=Math.hypot(this.offset.x-before.x,this.offset.y-before.y)*4;
      direction = bakedDirection(Math.atan2(x, y), direction)
      if (direction !== options.direction) actorComparison.patch({ direction })
    }
    const draft=options.mode==='cat-creator'?catCreator.getSnapshot():characterCreator.getSnapshot()
    const liveClips=options.mode==='cat-creator'?catClips:humanClips
    if(this.live&&draft.renderRevision!==this.appearanceRevision&&_time-this.appearanceChangedAt>=100){
      try{if(this.live instanceof PixelCat)this.live.setAppearance(catCreator.getSnapshot().appearance);else this.live.setAppearance(characterCreator.getSnapshot().appearance);this.appearanceRevision=draft.renderRevision;this.appearanceChangedAt=_time;this.renderSignature=''}
      catch(error){actorComparison.patch({status:'error',error:error instanceof Error?error.message:'This appearance could not render.'});return}
    }
    if (!options.paused){this.elapsed += Math.min(delta, 50) / 1000;this.presentationClock+=Math.min(delta,50)}
    const gait:'walk'|'run'=motion.running?'run':'walk';
    if(moving&&traveled>.001)this.strideElapsed+=traveled/(gait==='run'?104:84);
    else if(!options.paused && (options.mode==='creator'||options.mode==='cat-creator') && (moving||['walk','run'].includes(options.action)))this.strideElapsed+=Math.min(delta,50)/1000*liveClips[gait].fps/(liveClips[gait].frames??8);
    const requested=options.action==='power_up'&&moving&&motion.running?'power_run':moving&&!allowsMovingAction(options.action)?motion.running?'run':'walk':options.action
    const presentation=this.playback.resolve(requested,this.presentationClock)
    const action=presentation.action as ComparisonAction
    if(options.presentationAction!==action)actorComparison.patch({presentationAction:action})
    const locomotionFrame=moving&&usesWalkingLegs(action)?Math.floor(this.strideElapsed*(liveClips[gait].frames??12))%(liveClips[gait].frames??12):undefined
    const signature = action + '/' + direction
    if (signature !== this.clipSignature) {
      this.clips = this.views.map(view => view.live ? (()=>{const clip=liveClips[action==='feed'?'eat':action==='water'?'drink':action]??liveClips[action]??liveClips.idle;return {frames:Array.from({length:clip.frames??8},(_,i)=>i),fps:clip.fps,once:clip.repeat===0}})() : view.native ? originalClip(view.kind, action, direction) : currentClip(view.sheet, action, direction))
      this.clipSignature = signature
    }
    const clips = this.clips
    const sharedDuration = Math.max(...this.views.flatMap((view, i) => view.native ? [] : [clips[i].frames.length / clips[i].fps]))
    this.marks.clear()
    const detail=faceInspection(options)
    if(!detail)this.marks.lineStyle(1, 0xf9e4bd, .75).lineBetween(Math.floor(this.world.width / 2), 0, Math.floor(this.world.width / 2), this.world.height)
    this.views.forEach((view, index) => {
      view.sprite.setVisible(!detail||!view.original);view.label.setVisible(!detail||!view.original)
      if(detail&&view.original){view.effects?.hide();return}
      const clip = clips[index]
      const duration = presentation.elapsedMs===undefined&&options.timing === 'synchronized' ? sharedDuration : clip.frames.length / clip.fps
      const elapsed=presentation.elapsedMs===undefined?((options.mode==='creator'||options.mode==='cat-creator')&&['walk','run','power_run','rescue_dash'].includes(action)?this.strideElapsed*duration:this.elapsed):presentation.elapsedMs/1000
      const phase = clip.once ? Math.min(elapsed / duration, .999999) : elapsed / duration % 1
      const frame = clip.frames[Math.min(clip.frames.length - 1, Math.floor(phase * clip.frames.length))]
      const px = Math.round(this.world.width * (detail ? .5 : view.original ? .25 : .75) + this.offset.x)
      const py = Math.round((detail?this.world.height*.5+(options.mode==='cat-creator'?6.5*catBodyScale(catCreator.getSnapshot().appearance.cat.bodySize):27):this.world.height * (options.mode !== 'legacy' ? .62 : view.kind === 'player' ? .43 : .79)) + this.offset.y)
      view.sprite.setPosition(px, py).setDepth(2)
      view.sprite.setData('actorLocalAudio', true)
      if(view.live&&options.mode==='cat-creator')view.sprite.setData('actorBodyScale',catBodyScale(catCreator.getSnapshot().appearance.cat.bodySize))
      view.shadow?.update(view.sprite, action, this.presentationClock, options.paused, direction)
      if(view.live&&this.live&&this.liveTexture){
        const signature=action+':'+direction+':'+frame+':'+(locomotionFrame??'-')+':'+gait
        if(signature!==this.renderSignature){
          try{this.liveTexture.context.putImageData(this.live.frame(options.mode==='cat-creator'?(action==='feed'?'eat':action==='water'?'drink':action):action,direction,frame,locomotionFrame,gait),0,0);this.liveTexture.refresh();this.renderSignature=signature}
          catch(error){actorComparison.patch({status:'error',error:error instanceof Error?error.message:'The character frame could not render.'});return}
        }
      }else view.sprite.setFrame(frame)
      view.effects?.update(view.sprite, view.live&&options.mode!=='cat-creator'?actorEffectAction(characterCreator.getSnapshot().appearance,action):action, this.presentationClock, false, direction, view.live&&options.mode!=='cat-creator'?appearanceHeadHeight(characterCreator.getSnapshot().appearance):view.sheet.headHeight, !view.original && !options.paused)
      if(view.live&&view.label.text!==draft.name)view.label.setText(draft.name||(options.mode==='cat-creator'?'Your cat':'Your character'))
      view.label.setPosition(px, py + 7)
    })
  }
}
