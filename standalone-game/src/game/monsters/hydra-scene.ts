import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createActorCamera, configureActorRenderer } from '../actor-rig/pixel-stage'
import { disposeRig, type Rig } from '../actor-rig/rigs'
import { creatorModelFactory, prepareCreatorModel } from '../creator/preview-models'
import { creatorTemplates } from '../creator/state'
import { equippedFactory, prepareItem } from '../items/equipment'
import { trainingSword } from '../items/sword-pilot'
import { AbilitySession, type AbilityEvent, type AbilityTarget } from '../items/runtime'
import type { ActionKey } from '../items/document'
import { movementVector } from '../systems/behavior'
import { approachVelocity, approachFacing, STUDIO_LOCOMOTION } from '../systems/studio-locomotion'
import { audio } from '../systems/audio'
import { gameVoice } from '../runtime/game-voice'
import { VisualFeedbackQueue, ActionFeedbackTracker, drawVisualFeedback, type FeedbackPoint } from '../feedback/visual-feedback'
import { HitImpactView } from '../feedback/hit-impact-view'
import { loadArenaActor } from './arena-loader'
import { playCharacterPresets,type PlayCharacter } from '../stage-editor/play-character-presets'
import type { ArenaActor, ArenaEncounter, ArenaEvent, ArenaReport, ArenaVariant } from './arena-contract'

const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right']
export type HydraSceneReport = ArenaReport & { feedback: string; weaponCooldown: number; ultimateCooldown: number; cooldowns: Record<string, number>; targetId?: string | null }
export type ArenaSceneOptions={character?:PlayCharacter;initialHp?:number;floor?:boolean;weaponDamage?:{primary:number;special:number};onEvent?:(event:ArenaEvent,scene:HydraScene)=>boolean}
/** Uses the same Amber rig, sword hit engine, movement and confirmed-impact pool as Monster Studio. */
export class HydraScene {
  private leaveVoice=gameVoice.enterScene('arena');
  readonly encounter: ArenaEncounter
  private world = new T.Scene()
  private camera = createActorCamera()
  private renderer: T.WebGLRenderer
  private orbit: OrbitControls
  private canvas = document.createElement('canvas')
  private overlay = document.createElement('canvas')
  private viewport = document.createElement('div')
  private context: CanvasRenderingContext2D
  private impacts: HitImpactView
  private boss: ArenaActor
  private player: Rig
  private unit: number
  private playerPosition = { x: 0, y: 0 }
  private velocity = { x: 0, y: 0 }
  private direction = 'up'
  private yaw = Math.PI
  private stride = 0
  private time = 0
  private keys = new Set<string>()
  private touch = { x: 0, z: 0 }
  private sword = trainingSword()
  private weapon = new AbilitySession()
  private receipts = new ActionFeedbackTracker()
  private feedback = new VisualFeedbackQueue()
  private marker: T.Mesh[] = []
  private swordBolts: T.Mesh[] = []
  private shadow: T.Mesh
  private playerShadow: T.Mesh
  private events = new AbortController()
  private observer: ResizeObserver
  private reduced = matchMedia('(prefers-reduced-motion: reduce)')
  private raf = 0
  private last = 0
  private painted = 0
  private published = 0
  private disposed = false
  private dirty = true
  private muted = false
  private following = false
  private targetId: string | null = null
  private followDelta = new T.Vector3()
  private soundStops: (() => void)[] = []
  static async create(host: HTMLElement, publish: (report: HydraSceneReport) => void, fail: (message: string) => void, signal?: AbortSignal, variant: ArenaVariant = 'hydra', creatureId?: string, options:ArenaSceneOptions={}) {
    const character=options.character??'amber'
    await Promise.all([prepareCreatorModel(character), prepareItem(trainingSword())]); signal?.throwIfAborted()
    let boss: ArenaActor | undefined, impacts: HitImpactView | undefined, player: Rig | undefined
    let receive: (event: ArenaEvent) => void = () => {}
    try {
      boss = await loadArenaActor(variant, event => receive(event), creatureId); impacts = await HitImpactView.create(); signal?.throwIfAborted()
      player = equippedFactory(creatorModelFactory(character), trainingSword())(creatorTemplates.find(t => t.id === playCharacterPresets[character].id)!.appearance)
      const scene = new HydraScene(host, boss, player, impacts, publish, fail, options)
      receive = event => scene.onEvent(event); return scene
    } catch (error) { boss?.dispose(); boss?.hazards?.dispose(); impacts?.dispose(); if (player) disposeRig(player); throw error }
  }
  private constructor(private host: HTMLElement, boss: ArenaActor, player: Rig, impacts: HitImpactView, private publish: (report: HydraSceneReport) => void, private fail: (message: string) => void,private options:ArenaSceneOptions={}) {
    this.boss = boss; this.player = player; this.impacts = impacts
    player.pose('idle', 0); player.root.updateMatrixWorld(true)
    const bounds = new T.Box3()
    player.root.traverse(node => { if (node instanceof T.Mesh && !node.name.startsWith('Equipped_') && !node.userData.itemPartId) { node.geometry.computeBoundingBox(); if (node.geometry.boundingBox) bounds.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld)) } })
    this.unit = Math.max(1, bounds.max.y - Math.min(0, bounds.min.y)); const h = this.unit
    const config = boss.definition.arena
    if (boss.hazards) { boss.hazards.root.scale.setScalar(h); this.world.add(boss.hazards.root) }
    this.encounter = boss.encounter;if(options.initialHp!==undefined)this.encounter.playerHp=Math.max(0,Math.min(100,options.initialHp)); this.weapon.equip(this.sword)
    boss.root.scale.setScalar(h); this.playerPosition.y = h * config.spawnZ
    this.world.add(boss.root, player.root, impacts.root)
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: true, powerPreference: 'low-power' })
    configureActorRenderer(this.renderer); this.renderer.setSize(640, 480, false); this.renderer.setClearColor(config.backdrop, 1)
    // Keep WebGL on its native canvas. Firefox/Mesa can swizzle colors when
    // copying a WebGL framebuffer through Canvas2D; feedback gets its own layer.
    this.canvas = this.renderer.domElement
    this.overlay.width = 640; this.overlay.height = 480; this.context = this.overlay.getContext('2d')!
    this.viewport.className = options.floor?'absolute shrink-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2':'relative shrink-0'
    this.overlay.className = 'pointer-events-none absolute inset-0 [image-rendering:pixelated]'
    this.overlay.setAttribute('aria-hidden', 'true')
    this.canvas.className = 'block shrink-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring [image-rendering:pixelated]'; this.canvas.tabIndex = 0
    this.canvas.setAttribute('aria-label', boss.definition.name + ' boss arena. WASD move, Shift run, J sword, K ultimate, Escape pause. Scroll to zoom.'); this.viewport.append(this.canvas, this.overlay); host.append(this.viewport)
    this.camera.left = -h * config.halfWidth; this.camera.right = h * config.halfWidth; this.camera.top = h * config.halfWidth * .75; this.camera.bottom = -this.camera.top; this.camera.far = h * 70
    const cameraTargetY = config.cameraTargetY ?? 1.1
    this.camera.position.set(h * .2, h * (cameraTargetY + 8.9), h * 18); this.camera.updateProjectionMatrix()
    this.orbit = new OrbitControls(this.camera, this.canvas); this.orbit.target.set(0, h * cameraTargetY, 0); this.orbit.enableRotate = false; this.orbit.enablePan = config.allowPan ?? false; this.orbit.minZoom = .75; this.orbit.maxZoom = config.maxZoom ?? 2
    this.orbit.update(); this.orbit.saveState(); this.orbit.addEventListener('change', () => { this.dirty = true })
    this.world.add(new T.AmbientLight('#ffead0', 2.3))
    const sun = new T.DirectionalLight('#fff1ca', 2); sun.position.set(-h * 6, h * 10, h * 6); this.world.add(sun)
    const floorWidth = (config.boundsX + 1) * 2, floorDepth = (config.boundsZ + 1) * 2
    const floor = new T.Mesh(new T.PlaneGeometry(h * floorWidth, h * floorDepth), new T.MeshBasicMaterial({ color: config.floor })); floor.rotation.x = -Math.PI / 2; floor.position.y = -h * .12; this.world.add(floor)
    const graveyard = boss.definition.id.startsWith('morvane')
    const makeSizedGrid = (step: number) => {
      const points: number[] = []
      for(let x=-floorWidth/2;x<=floorWidth/2+.001;x+=step)points.push(x*h,0,-floorDepth/2*h,x*h,0,floorDepth/2*h)
      for(let z=-floorDepth/2;z<=floorDepth/2+.001;z+=step)points.push(-floorWidth/2*h,0,z*h,floorWidth/2*h,0,z*h)
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3))
      return new T.LineSegments(geometry,new T.LineBasicMaterial({color:config.gridColor??'#9da878',toneMapped:false}))
    }
    const grid = config.gridStep ? makeSizedGrid(config.gridStep) : new T.GridHelper(h * floorWidth, 32, config.gridColor ?? (graveyard ? '#8f8288' : '#9da878'), config.gridColor ?? (graveyard ? '#7e7178' : '#8b9f6b'))
    if(!config.gridStep)grid.scale.z = floorDepth / floorWidth
    grid.position.y = -h * .08
    const gridOpacity = config.gridOpacity ?? (graveyard ? .4 : 1)
    if (gridOpacity < 1) for (const material of Array.isArray(grid.material) ? grid.material : [grid.material]) { material.transparent = true; material.opacity = gridOpacity }
    this.world.add(grid)
    const path = new T.Mesh(new T.PlaneGeometry(h * 3, h * floorDepth), new T.MeshBasicMaterial({ color: config.pathColor ?? (graveyard ? '#968b88' : '#c4b77e') })); path.rotation.x = -Math.PI / 2; path.position.set(0, -h * .06, 0); this.world.add(path)
    for (let i = 0; i < 26; i++) {
      const rock = new T.Mesh(new T.DodecahedronGeometry(h * (.22 + i % 3 * .06), 0), new T.MeshLambertMaterial({ color: i % 3 ? '#776f58' : '#9c9370' }))
      const side = i < 13 ? -1 : 1; rock.position.set(side * (config.boundsX + .7 + i % 2 * .12) * h, 0, (-config.boundsZ - .4 + (i % 13) * (config.boundsZ * 2 + .8) / 12) * h); this.world.add(rock)
    }
    this.shadow = this.groundDisc(config.shadowRadius ?? 1.5, '#233b2c', .32); this.playerShadow = this.groundDisc(.32, '#233b2c', .35)
    for (let i = 0; i < config.markerCapacity; i++) { const m = this.groundDisc(1, '#f8b852', .28); m.visible = false; m.renderOrder = 1; this.marker.push(m) }
    for (let i = 0; i < 20; i++) { const bolt = new T.Mesh(new T.OctahedronGeometry(h * .12), new T.MeshBasicMaterial({ color: '#b5f2ee' })); bolt.visible = false; this.swordBolts.push(bolt); this.world.add(bolt) }
    const signal = this.events.signal
    this.canvas.addEventListener('keydown', event => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key)) event.preventDefault()
      const key = event.key.toLowerCase(); this.keys.add(key)
      if (!event.repeat && key === 'tab' && this.encounter.report().components) {
        event.preventDefault()
        const targets=this.encounter.hitRegions?.().filter(r=>r.eligible!==false)??[]
        const index=targets.findIndex(r=>r.id===this.targetId)
        if(targets.length)this.target(targets[(index+1)%targets.length].id)
      }
      if (!event.repeat && key === 'j') this.useWeapon('primary')
      if (!event.repeat && key === 'k') this.useWeapon('special')
      if (key === 'escape') this.pause()
    }, { signal })
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()), { signal })
    window.addEventListener('blur', () => this.pause(), { signal })
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause() }, { signal })
    this.canvas.addEventListener('blur', () => { this.keys.clear(); this.touch = { x: 0, z: 0 } }, { signal })
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize(); this.report(); this.raf = requestAnimationFrame(this.tick)
  }
  private groundDisc(radius: number, color: string, opacity: number) {
    const mesh = new T.Mesh(new T.CircleGeometry(this.unit * radius, 48), new T.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); mesh.rotation.x = -Math.PI / 2; mesh.position.y = -.025 * this.unit; this.world.add(mesh); return mesh
  }
  private resize() { const rect = this.host.getBoundingClientRect(), zoom = Math.max(1, Math.floor(Math.min(rect.width / 640, rect.height / 480))); for (const canvas of [this.canvas, this.overlay]) { canvas.style.width = 640 * zoom + 'px'; canvas.style.height = 480 * zoom + 'px' } this.dirty = true }
  setMuted(muted: boolean) { this.muted = muted; if (muted) { this.stopSounds(); gameVoice.stop('arena') } }
  private sound(kind: Parameters<typeof audio.itemEffect>[0]) { if (this.muted) return; if (this.soundStops.length >= 6) this.soundStops.shift()?.(); this.soundStops.push(audio.itemEffect(kind)) }
  private stopSounds() { this.soundStops.forEach(stop => stop()); this.soundStops = [] }
  start() {
    if (this.disposed) return
    // Input becomes active immediately; audio permission cannot delay movement.
    this.encounter.start(); this.canvas.focus(); this.dirty = true; this.report()
    void audio.unlock().catch(() => { if (!this.disposed) { this.notice('Sound unavailable · the encounter remains playable'); this.report() } })
  }
  pause() { gameVoice.stop('arena'); this.encounter.pause(); this.keys.clear(); this.touch = { x: 0, z: 0 }; this.velocity = { x: 0, y: 0 }; this.weapon.cancel('leave'); this.receipts.clear(); this.impacts.clear(); this.feedback.clear(); this.stopSounds(); this.dirty = true; this.report() }
  reset() { this.pause(); this.encounter.reset(); this.weapon.reset(); this.weapon.equip(this.sword); this.targetId=null; this.playerPosition = { x: 0, y: this.unit * this.boss.definition.arena.spawnZ }; this.direction = 'up'; this.yaw = Math.PI; this.stride = this.time = 0; this.feedback.clear('Reset · normal phase, full health and cooldowns.'); this.dirty = true; this.report() }
  view() { this.following = false; this.orbit.enablePan = this.boss.definition.arena.allowPan ?? false; this.orbit.reset(); this.dirty = true }
  followPlayer(enabled: boolean) {
    if (!enabled) { this.view(); return }
    this.following = true; this.orbit.enablePan = false
    this.orbit.target.set(this.playerPosition.x, this.unit * 1.1, this.playerPosition.y)
    this.camera.position.copy(this.orbit.target).add(this.followDelta.set(this.unit * .2, this.unit * 8.9, this.unit * 18))
    this.camera.zoom = Math.min(3, this.orbit.maxZoom); this.camera.updateProjectionMatrix(); this.orbit.update()
    this.notice('Following Amber · wheel to zoom; fit the colossus to return.'); this.dirty = true; this.report()
  }
  move(x: number, z: number) { this.touch = { x, z } }
  enrage() { this.encounter.rehearseEnrage(); this.dirty = true; this.report() }
  attack(id: string) { if (!this.encounter.attack(id, this.playerPoint())) this.notice('Attack unavailable · start, finish the current move or wait for its cooldown.'); this.canvas.focus(); this.report() }
  private playerPoint() { return { x: this.playerPosition.x / this.unit, z: this.playerPosition.y / this.unit } }
  target(id: string) {
    const region=this.encounter.hitRegions?.().find(r=>r.id===id&&r.eligible!==false)
    if(!region){this.notice('Target unavailable · it may already be destroyed.');this.report();return}
    this.targetId=id
    const name=this.encounter.report().components?.find(c=>c.id===id)?.name??'Main body'
    this.notice(name+' targeted · move within sword reach, then press J.');this.report();this.canvas.focus()
  }
  private notice(label: string, miss = false) { this.feedback.add({ kind: miss ? 'miss' : 'notice', target: playCharacterPresets[this.options.character??'amber'].name, label, position: { x: this.playerPosition.x, y: this.unit * 1.3, z: this.playerPosition.y } }); this.dirty = true }
  useWeapon(key: ActionKey) {
    if (!this.encounter.running) { this.notice('Start the encounter first'); this.report(); return }
    const target=this.encounter.hitRegions?.().find(r=>r.id===this.targetId&&r.eligible!==false)
    if(target){const p=this.playerPoint();this.direction=directions[(Math.round(Math.atan2(-(target.x-p.x),target.z-p.z)/(Math.PI/4))+8)%8]}
    const result = this.weapon.activate(key, { id: 'hydra-player', position: { ...this.playerPosition }, direction: this.direction, running: this.keys.has('shift') })
    if (result.ok && !result.buffered) { this.receipts.begin(result.castId); if(!this.muted)void gameVoice.speak(playCharacterPresets[this.options.character??'amber'].id,'attack','arena') }
    else if (!result.ok) this.notice(result.reason === 'cooldown' ? 'Weapon cooling down' : 'Finish the current action')
    this.canvas.focus()
  }
  private onEvent(event: ArenaEvent) {if(this.options.onEvent?.(event,this)===false)return;this.presentEvent(event)}
  presentEvent(event:ArenaEvent){
    const h = this.unit, def = this.boss.definition, boss = event.target === 'boss', position = { x: event.point.x * h, y: (event.kind === 'damage' && event.height !== undefined ? event.height : boss ? 1.6 : .6) * h, z: event.point.z * h }
    if (event.kind === 'damage') {
      if(!this.muted&&!boss&&event.amount>0)void gameVoice.speak(playCharacterPresets[this.options.character??'amber'].id,'hurt','arena',2)
      const label = event.label ?? (boss ? event.weak ? def.weakLabel : def.armorLabel : def.attacks.find(a => a.id === event.attack)?.name ?? 'Boss contact')
      this.feedback.add({ kind: boss ? event.weak ? 'weak' : 'armored' : 'player-damage', target: event.targetName ?? (boss ? def.name : playCharacterPresets[this.options.character??'amber'].name), amount: event.amount, label, position })
      this.impacts.spawn({ kind: event.impact ?? (boss ? event.weak ? 'weak' : 'slash' : event.attack === 'ember-barrage' ? 'fire' : 'weak'), position, unit: h, reducedMotion: this.reduced.matches }); this.sound('impact')
    } else if (event.kind==='blocked'||event.kind==='notice') {
      this.feedback.add({kind:event.kind,target:boss?def.name:playCharacterPresets[this.options.character??'amber'].name,label:event.label,position})
    } else {
      this.feedback.add({ kind: event.kind, target: boss ? def.name : playCharacterPresets[this.options.character??'amber'].name, label: event.kind === 'phase' ? 'ENRAGED · pattern changed' : boss ? def.name + ' defeated' : (this.options.floor?'Down · return to your checkpoint':'Amber down · reset to retry'), position })
      this.sound('impact')
    }
    this.dirty = true
  }
  get inputCanvas(){return this.canvas}
  refreshReport(){this.dirty=true;this.report()}
  focus(){this.canvas.focus({preventScroll:true})}
  zoomView(direction:number){this.camera.zoom=Math.max(this.orbit.minZoom,Math.min(this.orbit.maxZoom,this.camera.zoom+direction*.25));this.camera.updateProjectionMatrix();this.dirty=true}
  hold(value:boolean){this.keys.clear();this.touch={x:0,z:0};this.velocity={x:0,y:0};this.weapon.cancel('hold');this.receipts.clear();this.encounter.running=!value&&this.encounter.hp>0&&this.encounter.playerHp>0;this.dirty=true;this.report()}
  private targets(): AbilityTarget[] {
    const h = this.unit, e = this.encounter, p = e.position, eligible = e.hp > 0 && e.lift < .5 && e.phaseElapsed >= 1800
    return e.hitRegions ? e.hitRegions().map(region => ({ id: region.id, kind: 'training', eligible: eligible && region.eligible !== false, rect: { x: (region.x - region.radius) * h, y: (region.z - region.radius) * h, width: region.radius * 2 * h, height: region.radius * 2 * h } })) : [{ id: this.boss.definition.id, kind: 'training', eligible, rect: { x: (p.x - 1.1) * h, y: (p.z - .9) * h, width: 2.2 * h, height: 1.8 * h } }]
  }
  private consume(events: AbilityEvent[], before: ReturnType<AbilitySession['snapshot']>) {
    for (const event of events) {
      if (event.kind === 'sound') this.sound(event.art?.sound ?? 'impact')
      if (event.kind === 'blocked') { this.receipts.blocked(event.castId); this.notice('Blocked') }
      if (event.kind === 'hit' && (event.targetId === this.boss.definition.id || event.targetId?.startsWith(this.boss.definition.id + ':'))) {
        const id = `${event.castId}:${event.art?.id ?? 'melee'}`
        const outcome=this.encounter.hit(id, before.cast?.key === 'special' || event.art ? this.options.weaponDamage?.special??680 : this.options.weaponDamage?.primary??180, event.targetId)
        if(outcome===true)this.receipts.hit(event.castId)
        else if(outcome==='blocked')this.receipts.blocked(event.castId)
      }
    }
    for (const _id of this.receipts.finish(this.weapon.snapshot())) if (this.encounter.running) this.notice('Miss · move within sword reach', true)
  }
  private report() { const weapon = this.weapon.snapshot(), state = this.encounter.report(); this.publish({ ...state, cooldowns: state.cooldowns ?? Object.fromEntries(this.boss.definition.attacks.map((attack, index) => [attack.id, index === 0 ? state.fireCooldown : state.stompCooldown])), feedback: this.feedback.latest, weaponCooldown: weapon.cooldowns.primary, ultimateCooldown: weapon.cooldowns.special, targetId:this.targetId }) }
  private drawComponents(){
    const components=this.encounter.components?.()
    if(!components)return
    const ctx=this.context,h=this.unit
    ctx.save();ctx.textAlign='center';ctx.font='bold 12px "Saira Condensed", sans-serif';ctx.lineWidth=3
    for(const c of components){
      const p=this.project({x:c.x*h,y:(c.height+1)*h,z:c.z*h}),alive=c.hp>0,selected=this.targetId===c.id
      ctx.fillStyle=alive?'#122438':'#292a35';ctx.fillRect(p.x-33,p.y-11,66,24)
      ctx.fillStyle=alive?'#7ff7fb':'#adabb7';ctx.fillText((selected?'› ':'')+c.name+(alive?'':' ×'),p.x,p.y)
      ctx.fillStyle='#314351';ctx.fillRect(p.x-27,p.y+5,54,3);ctx.fillStyle='#7ff7fb';ctx.fillRect(p.x-27,p.y+5,54*c.hp/c.maxHp,3)
    }
    ctx.restore()
  }
  private drawScaleGuide() {
    const height = this.boss.definition.arena.heightGuide
    if (!height) return
    const h = this.unit, x = -16, z = this.encounter.position.z, ctx = this.context
    const from = this.project({x:x*h,y:0,z:z*h}), to = this.project({x:x*h,y:height*h,z:z*h})
    ctx.save(); ctx.strokeStyle = '#e6d4aa'; ctx.fillStyle = '#f9eccb'; ctx.lineWidth = 1
    ctx.font = '11px "Saira Condensed", sans-serif'; ctx.textBaseline = 'middle'
    ctx.beginPath(); ctx.moveTo(from.x,from.y); ctx.lineTo(to.x,to.y); ctx.stroke()
    for (const value of [0,1,8,16,24,height]) {
      const p = this.project({x:x*h,y:value*h,z:z*h})
      if(p.y<8||p.y>472)continue
      ctx.beginPath();ctx.moveTo(p.x-3,p.y);ctx.lineTo(p.x+5,p.y);ctx.stroke()
      ctx.fillText(value===1?'Amber ×1':value+'×',p.x+9,p.y)
    }
    ctx.restore()
  }
  private project = (p: FeedbackPoint) => { const v = new T.Vector3(p.x, p.y, p.z).project(this.camera); return { x: (v.x + 1) * 320, y: (1 - v.y) * 240 } }
  private tick = (now: number) => {
    if (this.disposed) return; this.raf = requestAnimationFrame(this.tick)
    if (document.hidden) { this.last = 0; return }
    const animate = this.encounter.running || this.encounter.hp <= 0 && this.encounter.deathElapsed < 1200 || this.feedback.pending || this.impacts.pending
    if (!this.dirty && (!animate || now - this.painted < 1000 / 30)) { if (!animate) this.last = 0; return }
    const dt = this.last ? Math.min(50, now - this.last) : 0; this.last = now
    try {
      const h = this.unit, e = this.encounter, running = e.running, sprint = this.keys.has('shift'), before = this.weapon.snapshot()
      const x = +(this.keys.has('d') || this.keys.has('arrowright')) - +(this.keys.has('a') || this.keys.has('arrowleft')) || this.touch.x
      const z = +(this.keys.has('s') || this.keys.has('arrowdown')) - +(this.keys.has('w') || this.keys.has('arrowup')) || this.touch.z
      const intent = running && !before.cast?.locked ? movementVector(x, z, sprint) : { x: 0, y: 0 }
      this.velocity = approachVelocity(this.velocity, intent, dt / 1000)
      const bounds = this.boss.definition.arena
      const next = { x: T.MathUtils.clamp(this.playerPosition.x + this.velocity.x * dt / 1000, -bounds.boundsX * h, bounds.boundsX * h), y: T.MathUtils.clamp(this.playerPosition.y + this.velocity.y * dt / 1000, -bounds.boundsZ * h, bounds.boundsZ * h) }
      if (e.hp > 0 && e.lift < .5) for (const circle of e.bodyCircles?.() ?? [{ ...e.position, radius: bounds.collisionRadius }]) {
        const dx = next.x / h - circle.x, dz = next.y / h - circle.z, d = Math.hypot(dx, dz)
        if (d < circle.radius) { next.x = (circle.x + (d ? dx / d : 1) * circle.radius) * h; next.y = (circle.z + (d ? dz / d : 0) * circle.radius) * h }
      }
      next.x = T.MathUtils.clamp(next.x, -bounds.boundsX * h, bounds.boundsX * h)
      next.y = T.MathUtils.clamp(next.y, -bounds.boundsZ * h, bounds.boundsZ * h)
      this.playerPosition = next
      if (running && (x || z) && !before.cast?.locked) this.direction = directions[(Math.round(Math.atan2(-x, z) / (Math.PI / 4)) + 8) % 8]
      this.yaw = approachFacing(this.yaw, -directions.indexOf(before.cast?.actor.direction ?? this.direction) * Math.PI / 4, dt / 1000)
      const speed = Math.hypot(this.velocity.x, this.velocity.y), moved = speed > 2
      this.stride = (this.stride + speed * dt / 1000 / (sprint ? STUDIO_LOCOMOTION.runCycleDistance : STUDIO_LOCOMOTION.walkCycleDistance)) % 1
      if (running || e.hp <= 0) this.time += dt
      e.advance(dt, this.playerPoint())
      this.boss.pose(this.time, this.reduced.matches); this.boss.root.position.set(e.position.x * h, e.lift * h, e.position.z * h)
      if (running && e.running) this.consume(this.weapon.advance(dt, { targets: this.targets(), solids: [], actorPosition: { ...this.playerPosition } }), before)
      if (running && !e.running) { this.weapon.cancel('leave'); this.receipts.clear(); this.keys.clear(); this.velocity = { x: 0, y: 0 }; this.stopSounds() }
      const snapshot = this.weapon.snapshot(), cast = snapshot.cast
      this.player.pose(cast ? 'item-' + cast.key : moved ? sprint ? 'run' : 'walk' : 'idle', cast ? cast.elapsed / cast.duration : moved ? this.stride : this.time / 2400 % 1, { gait: sprint ? 'run' : 'walk', locomotionPhase: this.stride, secondaryMotion: { phase: this.time / 2400 % 1, locomotion: moved ? 1 : 0 } })
      this.player.root.position.set(this.playerPosition.x, 0, this.playerPosition.y); this.player.root.rotation.y = this.yaw
      if (this.following && running) {
        this.followDelta.set(this.playerPosition.x,h*1.1,this.playerPosition.y).sub(this.orbit.target).multiplyScalar(1-Math.exp(-dt/120))
        this.camera.position.add(this.followDelta); this.orbit.target.add(this.followDelta); this.orbit.update()
      }
      this.shadow.position.set(e.position.x * h, -.03 * h, e.position.z * h); this.shadow.scale.setScalar(1 - e.lift * .1)
      this.playerShadow.position.set(this.playerPosition.x, -.03 * h, this.playerPosition.y)
      const circles = e.circles(), stage = e.window()
      for (let i = 0; i < this.marker.length; i++) {
        const circle = circles[i], mesh = this.marker[i]
        mesh.visible = !!circle && stage !== 'recovery' && circle.visible !== false
        if (circle) { mesh.position.set(circle.x * h, -.015 * h, circle.z * h); mesh.scale.setScalar(circle.radius); const material = mesh.material as T.MeshBasicMaterial; material.color.set((circle.active ?? (stage === 'landing' || stage === 'striking')) ? '#f45a31' : '#ffcb58'); material.opacity = this.reduced.matches ? .4 : .28 + Math.sin(this.time / 120) * .06 }
      }
      this.boss.hazards?.update(this.reduced.matches)
      for (let i = 0; i < this.swordBolts.length; i++) { const bolt = snapshot.projectiles[i], mesh = this.swordBolts[i]; mesh.visible = !!bolt; if (bolt) mesh.position.set(bolt.position.x, h * .55, bolt.position.y) }
      this.feedback.advance(dt); this.impacts.update(dt)
      this.renderer.render(this.world, this.camera); this.context.clearRect(0, 0, 640, 480)
      drawVisualFeedback(this.context, this.feedback, this.project, this.reduced.matches)
      this.drawScaleGuide()
      this.drawComponents()
      this.dirty = false; this.painted = now
      if (now - this.published > 100) { this.published = now; this.report() }
    } catch (error) { this.pause(); cancelAnimationFrame(this.raf); this.fail(error instanceof Error ? error.message : 'Boss renderer stopped. Retry the arena.') }
  }
  dispose() {
    this.leaveVoice();
    if (this.disposed) return; this.disposed = true; cancelAnimationFrame(this.raf); this.events.abort(); this.observer.disconnect(); this.stopSounds(); this.weapon.cancel('leave'); this.encounter.cancel()
    this.orbit.dispose(); this.impacts.dispose(); this.boss.dispose(); this.boss.hazards?.dispose(); disposeRig(this.player); this.receipts.clear(); this.feedback.clear()
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>()
    this.world.traverse(node => { if (node instanceof T.Mesh || node instanceof T.LineSegments) { geometry.add(node.geometry); (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m)) } })
    geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); this.world.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.viewport.remove()
  }
}
