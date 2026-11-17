import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createActorCamera, configureActorRenderer } from '../actor-rig/pixel-stage'
import { PixelFinish } from '../actor-rig/pixel-renderer'
import { appearancePalette, disposeRig, type Rig } from '../actor-rig/rigs'
import { creatorModelFactory, prepareCreatorModel } from '../creator/preview-models'
import { creatorTemplates } from '../creator/state'
import { trainingSword } from '../items/sword-pilot'
import { equippedFactory, prepareItem } from '../items/equipment'
import { AbilitySession, type AbilityEvent, type AbilityTarget } from '../items/runtime'
import type { ActionKey } from '../items/document'
import { movementVector } from '../systems/behavior'
import { STUDIO_LOCOMOTION, approachVelocity, approachFacing } from '../systems/studio-locomotion'
import { audio } from '../systems/audio'
import { gameVoice } from '../runtime/game-voice'
import type { MonsterPresentation, MonsterRepresentation } from './presentation'
import { MonsterEncounter, type BossCue, type BossReport, type BossCombatEvent } from './encounter'
import { ATTACKS, HEADS, VAELRITH, headX, type AttackId, type HeadId } from './vaelrith'
import { needsMonsterFrame } from './frame-budget'
import { RiftfireView } from './fire-view'
import { VisualFeedbackQueue, ActionFeedbackTracker, drawVisualFeedback, type FeedbackPoint } from '../feedback/visual-feedback'
import { HitImpactView } from '../feedback/hit-impact-view'
import { contactSpriteFor } from './contact-feedback'

const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right']
const sector = (x: number, z: number) => directions[(Math.round(Math.atan2(-x, z) / (Math.PI / 4)) + 8) % 8]
export type MonsterSceneReport = BossReport & { playerHeight: number; weaponCooldown: number; ultimateCooldown: number; feedback: string }

/** Disposable local rehearsal using the real creator rig, sword and weapon hit engine. */
export class MonsterScene {
  private leaveVoice=gameVoice.enterScene('arena');
  readonly encounter: MonsterEncounter
  private renderer: T.WebGLRenderer
  private scene = new T.Scene()
  private camera = createActorCamera()
  private orbit: OrbitControls
  private canvas = document.createElement('canvas')
  private raw = document.createElement('canvas')
  private rawContext: CanvasRenderingContext2D
  private output: CanvasRenderingContext2D
  private finish: PixelFinish | null
  private player: Rig
  private boss: MonsterPresentation
  private fire: RiftfireView
  private impacts: HitImpactView
  private height: number
  private sword = trainingSword()
  private weapon = new AbilitySession()
  private events = new AbortController()
  private sounds = new AbortController()
  private observer: ResizeObserver
  private keys = new Set<string>()
  private velocity = { x: 0, y: 0 }
  private touchMove = { x: 0, z: 0 }
  private soundStops: { stop: () => void; until: number }[] = []
  private position = { x: 0, y: 0 }
  private direction = 'up'
  private yaw = Math.PI
  private stride = 0
  private telegraph: T.InstancedMesh
  private throatRings: T.Mesh[] = []
  private projectiles: T.Mesh[] = []
  private raf = 0
  private previous = 0
  private rendered = 0
  private published = 0
  private disposed = false
  private visible = true
  private dirty = true
  private muted = false
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  private width = 480
  private frameHeight = 360
  private pixelOutput: ImageData | null = null
  private poseTime = 0
  private feedback = new VisualFeedbackQueue()
  private feedbackPoint = new T.Vector3()
  private castReceipts = new ActionFeedbackTracker()
  static async create(host: HTMLElement, report: (r: MonsterSceneReport) => void, error: (message: string) => void, signal?: AbortSignal, representation: MonsterRepresentation = 'volume-3d') {
    const item = trainingSword()
    await Promise.all([prepareCreatorModel('amber'), prepareItem(item)])
    signal?.throwIfAborted()
    // Load just one presentation. A 2D comparison never allocates the 3D boss.
    let boss: MonsterPresentation
    if (representation === 'layered-2d') boss = await (await import('./layered-view')).LayeredVaelrith.create()
    else {
      const { VaelrithRig } = await import('./rig')
      boss = representation === 'full-3d' ? VaelrithRig.createFull3D() : await VaelrithRig.create()
    }
    let player: Rig | undefined
    let fire: RiftfireView | undefined
    let impacts: HitImpactView | undefined
    try {
      signal?.throwIfAborted()
      fire = await RiftfireView.create()
      impacts = await HitImpactView.create()
      signal?.throwIfAborted()
      const appearance = creatorTemplates.find(p => p.id === 'amber-outrider')!.appearance
      player = equippedFactory(creatorModelFactory('amber'), item)(appearance)
      return new MonsterScene(host, boss, player, fire, impacts, report, error, representation)
    } catch (failure) { impacts?.dispose(); fire?.dispose(); boss.dispose(); if (player) disposeRig(player); throw failure }
  }
  private constructor(private host: HTMLElement, boss: MonsterPresentation, player: Rig, fire: RiftfireView, impacts: HitImpactView, private publish: (r: MonsterSceneReport) => void, private fail: (message: string) => void, private representation: MonsterRepresentation) {
    this.player = player; this.boss = boss; this.fire = fire; this.impacts = impacts
    this.scene.add(impacts.root)
    player.pose('idle', 0)
    // Body only: a sword, hat effect or attachment cannot redefine player height.
    const box = new T.Box3()
    player.root.updateMatrixWorld(true)
    player.root.traverse(node => {
      if (node instanceof T.Mesh && !node.name.startsWith('Equipped_') && !node.userData.itemPartId) {
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox()
        if (node.geometry.boundingBox) box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld))
      }
    })
    this.height = Math.max(1, box.max.y - Math.min(0, box.min.y))
    this.boss.root.scale.setScalar(this.height) // The actual player root stays at its original scale.
    this.fire.root.scale.setScalar(this.height); this.scene.add(this.fire.root)
    this.position.y = this.height * 6; this.scene.add(boss.root, player.root)
    this.encounter = new MonsterEncounter(cue => this.playCue(cue), Math.random, event => this.onCombatEvent(event))
    this.weapon.equip(this.sword)
    const full3d = representation === 'full-3d'
    if (full3d) { this.width = 640; this.frameHeight = 480 }
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: full3d, preserveDrawingBuffer: true, powerPreference: 'low-power' })
    configureActorRenderer(this.renderer); this.renderer.setSize(this.width, this.frameHeight, false)
    if (full3d) {
      this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05
      this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap
    }
    this.canvas.width = this.width; this.canvas.height = this.frameHeight
    this.raw.width = full3d ? 1 : this.width; this.raw.height = full3d ? 1 : this.frameHeight
    this.rawContext = this.raw.getContext('2d', { willReadFrequently: true })!
    this.output = this.canvas.getContext('2d')!
    this.finish = full3d ? null : new PixelFinish([...appearancePalette(creatorTemplates.find(p => p.id === 'amber-outrider')!.appearance), '#211329', '#35253d', '#4b355c', '#68477b', '#9261a0', '#c892c2', '#62dccd', '#f45eff', '#efb8f7', '#ead9c9', '#bfa06b', '#6b6260', '#443e43', '#a69a85', '#d59c45', '#db573f', '#fff5a5', '#ffdd54', '#ffab2e', '#f05b1d', '#b52c25', '#8633a9'])
    if (!full3d) this.pixelOutput = new ImageData(this.width, this.frameHeight)
    this.canvas.className = 'block shrink-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring' + (full3d ? '' : ' [image-rendering:pixelated]')
    // Override the game's global pixel-canvas rule only for this native 3D view.
    this.canvas.style.imageRendering = full3d ? 'auto' : 'pixelated'
    this.canvas.tabIndex = 0
    this.canvas.setAttribute('aria-label', `Vaelrith ${representation === 'layered-2d' ? '2D' : '3D'} encounter. WASD move, Shift run, J sword strike, K ultimate, Escape pause. ${representation !== 'layered-2d' ? 'Drag to orbit.' : 'Fixed illustration camera.'} Click Start encounter first.`)
    host.append(this.canvas)
    this.camera.near = .1; this.camera.far = this.height * 80
    const halfWidth = this.height * 10
    this.camera.left = -halfWidth; this.camera.right = halfWidth
    this.camera.top = halfWidth * this.frameHeight / this.width; this.camera.bottom = -this.camera.top
    this.camera.updateProjectionMatrix()
    this.camera.position.set(this.height * .5, this.height * 9, this.height * 21)
    this.orbit = new OrbitControls(this.camera, this.canvas); this.orbit.target.set(0, this.height * 3.3, this.height * 2)
    this.orbit.enablePan = false; this.orbit.minZoom = .75; this.orbit.maxZoom = 2
    this.orbit.maxPolarAngle = Math.PI * .47; this.orbit.minPolarAngle = Math.PI * .16
    this.orbit.minAzimuthAngle = -.85; this.orbit.maxAzimuthAngle = .85
    this.orbit.enableRotate = representation !== 'layered-2d'
    this.orbit.addEventListener('change', () => { this.dirty = true }); this.orbit.update(); this.orbit.saveState()
    this.boss.setCamera?.(this.camera)
    this.scene.add(new T.AmbientLight('#e7d9f0', 1.5))
    const light = new T.DirectionalLight('#fff0d0', 2); light.position.set(-400, 700, 500); this.scene.add(light)
    if (full3d) {
      light.position.set(-8 * this.height, 12 * this.height, 9 * this.height)
      light.target.position.set(0, 3 * this.height, 2 * this.height); this.scene.add(light.target)
      light.castShadow = true; light.shadow.mapSize.set(512, 512)
      const extent = 10 * this.height
      Object.assign(light.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: .1, far: 50 * this.height })
      light.shadow.camera.updateProjectionMatrix(); light.shadow.bias = -.00015; light.shadow.normalBias = .005 * this.height
      const fill = new T.HemisphereLight('#c4b1e4', '#2d2537', .65); this.scene.add(fill)
    }
    const floor = new T.Mesh(new T.PlaneGeometry(this.height * 17, this.height * 11), new T.MeshLambertMaterial({ color: '#69605e', toneMapped: false }))
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.07 * this.height, 4 * this.height); floor.receiveShadow = full3d; this.scene.add(floor)
    const grid = new T.GridHelper(this.height * 17, 34, '#8c7f79', '#746b68'); grid.position.set(0, -.06 * this.height, 4 * this.height); this.scene.add(grid)
    this.telegraph = new T.InstancedMesh(new T.PlaneGeometry(.29 * this.height, .29 * this.height), new T.MeshBasicMaterial({ color: '#e8a847', transparent: true, opacity: .66, depthWrite: false, toneMapped: false }), 1600)
    this.telegraph.count = 0; this.scene.add(this.telegraph)
    this.telegraph.frustumCulled = false
    for (let i = 0; i < 8; i++) {
      const projectile = new T.Mesh(new T.OctahedronGeometry(this.height * .16), new T.MeshBasicMaterial({ color: '#91ead9', toneMapped: false }))
      projectile.visible = false; this.scene.add(projectile); this.projectiles.push(projectile)
    }
    for (const id of HEADS) {
      const marker = new T.Mesh(new T.RingGeometry(this.height * .25, this.height * .31, 16), new T.MeshBasicMaterial({ color: '#62dccd', side: T.DoubleSide, toneMapped: false }))
      marker.rotation.x = -Math.PI / 2; marker.name = 'reachable-throat-' + id; this.scene.add(marker); this.throatRings.push(marker)
    }
    const shadow = new T.Mesh(new T.CircleGeometry(this.height * .3, 12), new T.MeshBasicMaterial({ color: '#211329', transparent: true, opacity: .35, depthWrite: false }))
    shadow.rotation.x = -Math.PI / 2; shadow.name = 'player-shadow'; this.scene.add(shadow)
    const signal = this.events.signal
    this.canvas.addEventListener('pointerdown', () => { this.canvas.focus(); void audio.unlock() }, { signal })
    this.canvas.addEventListener('keydown', e => {
      const key = e.key.toLowerCase()
      if (!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','j','k','escape'].includes(key)) return
      e.preventDefault(); this.keys.add(key)
      if (e.repeat) return
      if (key === 'escape') this.pause()
      if (key === 'j') this.useWeapon('primary')
      if (key === 'k') this.useWeapon('special')
    }, { signal })
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()), { signal })
    window.addEventListener('blur', () => this.pause(), { signal })
    this.canvas.addEventListener('blur', () => { this.keys.clear(); this.touchMove = { x: 0, z: 0 }; this.velocity = { x: 0, y: 0 } }, { signal })
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); this.previous = 0 }, { signal })
    this.observer = new ResizeObserver(() => this.fit()); this.observer.observe(host); this.fit(); this.tick()
  }
  private fit() {
    const rect = this.host.getBoundingClientRect(); this.visible = rect.width > 1 && rect.height > 1
    // Pixel modes retain integer zoom. Full 3D fits a fixed 640×480 buffer.
    const full3d = this.representation === 'full-3d'
    const width = full3d ? 640 : rect.width < 480 || rect.height < 360 ? 320 : 480
    if (width !== this.width) {
      this.width = width; this.frameHeight = width * .75
      this.renderer.setSize(this.width, this.frameHeight, false)
      this.canvas.width = this.width; this.canvas.height = this.frameHeight
      if (!full3d) { this.raw.width = this.width; this.raw.height = this.frameHeight; this.pixelOutput = new ImageData(this.width, this.frameHeight) }
    }
    const availableZoom = Math.min(rect.width / this.width, rect.height / this.frameHeight)
    const zoom = full3d ? Math.max(.25, Math.min(1.5, availableZoom)) : Math.max(1, Math.floor(availableZoom))
    this.canvas.style.width = this.width * zoom + 'px'; this.canvas.style.height = this.frameHeight * zoom + 'px'; this.dirty = true
  }
  private playCue(cue: BossCue) {
    if (!this.muted) void audio.playSample(VAELRITH.assets + cue + '.wav', .28, false, 0, this.sounds.signal)
  }
  setMuted(muted: boolean) { this.muted = muted; if (muted) { this.stopSounds(); gameVoice.stop('arena') } }
  private stopSounds() { this.sounds.abort(); this.sounds = new AbortController(); this.soundStops.forEach(s => s.stop()); this.soundStops = [] }
  private itemSound(kind: Parameters<typeof audio.itemEffect>[0]) { if (!this.muted && this.soundStops.length < 8) this.soundStops.push({ stop: audio.itemEffect(kind), until: performance.now() + 650 }) }
  start() { void audio.unlock().then(() => { if (!this.disposed) { this.encounter.start(); this.canvas.focus() } }) }
  move(x: number, z: number) { this.touchMove = { x, z } }
  pause() { gameVoice.stop('arena'); if (this.encounter.running) this.encounter.pause(); this.keys.clear(); this.touchMove = { x: 0, z: 0 }; this.velocity = { x: 0, y: 0 }; this.weapon.cancel('leave'); this.castReceipts.clear(); this.feedback.clear(); this.clearEffects(); this.stopSounds(); this.dirty = true; this.report() }
  reset() { this.pause(); this.encounter.reset(); this.weapon.reset(); this.weapon.equip(this.sword); this.position = { x: 0, y: this.height * 6 }; this.direction = 'up'; this.yaw = Math.PI; this.stride = 0; this.poseTime = 0; this.clearEffects(); this.feedback.clear('Encounter reset · full health and cooldowns restored'); this.dirty = true; this.report() }
  view() { this.orbit.reset(); this.dirty = true }
  attack(id: AttackId) { this.encounter.attack(id, { x: this.position.x / this.height, z: this.position.y / this.height }); this.canvas.focus(); this.report() }
  useWeapon(key: ActionKey) {
    if (!this.encounter.running) { this.playerNotice(this.encounter.hp <= 0 || this.encounter.playerHp <= 0 ? 'Reset to retry' : 'Start the encounter first'); return }
    const result = this.weapon.activate(key, { id: 'monster-rehearsal-player', position: { ...this.position }, direction: this.direction, running: this.keys.has('shift') })
    if (result.ok && !result.buffered) {
      this.castReceipts.begin(result.castId)
      if(!this.muted)void gameVoice.speak('amber-outrider','attack','arena');
    } else if (!result.ok) {
      const cooldown = this.weapon.snapshot().cooldowns[key] / 1000
      this.playerNotice(result.reason === 'cooldown' ? `Cooldown ${cooldown.toFixed(1)}s` : result.reason === 'busy' ? 'Finish the current attack' : 'Attack unavailable')
    }
    this.canvas.focus()
  }
  private playerNotice(label: string, kind: 'notice' | 'miss' | 'blocked' = 'notice') {
    this.feedback.add({ kind, target: 'Amber', label, position: { x: this.position.x, y: this.height * 1.3, z: this.position.y } })
    this.dirty = true; this.report()
  }
  private onCombatEvent(event: BossCombatEvent) {
    const h = this.height
    const sprite = contactSpriteFor(event)
    if (event.kind === 'damage' && event.target === 'boss') {
      const head = event.region.split(':')[1] as HeadId
      const point = event.region.startsWith('throat:') ? this.boss.throatPosition(head) : this.boss.sealPosition(head)
      this.feedback.add({ kind: event.weak ? 'weak' : 'armored', target: VAELRITH.name, group: event.region, amount: event.amount, label: event.weak ? 'Weak point ×2' : 'Armored ×0.5', position: { x: point.x, y: point.y + .35 * h, z: point.z } })
      if (sprite) this.impacts.spawn({ ...sprite, position: { x: point.x, y: point.y, z: point.z }, unit: h, reducedMotion: this.reducedMotion.matches })
    } else if (event.kind === 'damage' && event.target === 'player') {
      if(!this.muted&&event.amount>0)void gameVoice.speak('amber-outrider','hurt','arena',2)
      this.feedback.add({ kind: 'player-damage', target: 'Amber', amount: event.amount, label: ATTACKS[event.attack].name, position: { x: this.position.x, y: h * 1.3, z: this.position.y } })
      if (sprite) this.impacts.spawn({ ...sprite, position: { x: this.position.x, y: h * .6, z: this.position.y }, unit: h, reducedMotion: this.reducedMotion.matches })
    } else {
      const label = event.kind === 'phase' ? `Phase: ${event.phase}` : event.kind === 'stagger' ? 'Seal broken · staggered' : event.target === 'boss' ? 'Vaelrith defeated' : 'Player down · reset to retry'
      this.feedback.add({ kind: event.kind, target: 'Encounter', label, position: { x: 0, y: h * 4.5, z: h * 2 } })
    }
    this.dirty = true
  }
  private projectFeedback = (point: FeedbackPoint) => {
    this.feedbackPoint.set(point.x, point.y, point.z).project(this.camera)
    return { x: (this.feedbackPoint.x + 1) * this.width / 2, y: (1 - this.feedbackPoint.y) * this.frameHeight / 2 }
  }
  private targets(): AbilityTarget[] {
    const h = this.height
    const targets: AbilityTarget[] = HEADS.map(id => ({ id: 'seal:' + id, kind: 'training', eligible: this.encounter.hp > 0, rect: { x: (headX[id] - .3) * h, y: .35 * h, width: .6 * h, height: .6 * h } }))
    for (const id of HEADS) {
      const p = this.boss.throatPosition(id)
      targets.push({ id: 'throat:' + id, kind: 'training', eligible: this.encounter.exposed(id) && p.y <= h * 2.1, rect: { x: p.x - .35 * h, y: p.z - .35 * h, width: .7 * h, height: .7 * h } })
    }
    return targets
  }
  private consume(events: AbilityEvent[], before: ReturnType<AbilitySession['snapshot']>) {
    const strikes = new Map<string, AbilityEvent>()
    for (const event of events) {
      if (event.kind === 'sound') this.itemSound(event.art?.sound ?? 'impact')
      if (event.kind === 'blocked') {
        this.castReceipts.blocked(event.castId)
        this.playerNotice('Blocked', 'blocked')
      }
      if (event.kind === 'hit' && event.targetId) {
        const cast = before.cast
        const elapsed = cast ? cast.elapsed + Math.max(0, event.time - before.time) : 0
        const window = cast?.action.hitWindows?.find(w => elapsed >= w.start - 1 && elapsed <= w.end + 1)
        const strike = `${event.castId}:${event.art?.id ?? window?.id ?? 'melee'}`
        const previous = strikes.get(strike)
        if (!previous || event.targetId.startsWith('throat:')) strikes.set(strike, event)
      }
    }
    for (const [id, hit] of strikes) {
      const base = before.cast?.key === 'special' || hit.art ? 600 : 120
      if (this.encounter.hit(id, base, hit.targetId!)) {
        this.castReceipts.hit(hit.castId)
        this.itemSound('impact')
      }
    }
    const current = this.weapon.snapshot()
    for (const _id of this.castReceipts.finish(current)) if (this.encounter.running) this.playerNotice('Miss', 'miss')
  }
  private clearEffects() { this.impacts.clear() }
  private report() { const snapshot = this.weapon.snapshot(); this.publish({ ...this.encounter.report(), playerHeight: Math.round(this.height * 10) / 10, weaponCooldown: snapshot.cooldowns.primary, ultimateCooldown: snapshot.cooldowns.special, feedback: this.feedback.latest }) }
  private tick = (now = performance.now()) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.tick)
    if (document.hidden || !this.visible) { this.previous = 0; return }
    const deathAnimating = this.encounter.hp <= 0 && this.encounter.deathElapsed < 1200
    const effectsPending = this.impacts.pending || this.feedback.pending
    const animating = this.encounter.running || deathAnimating || effectsPending
    if (!needsMonsterFrame(this.dirty, this.encounter.running, deathAnimating, effectsPending, now - this.rendered)) {
      if (!animating) this.previous = 0
      return
    }
    const dt = this.previous ? Math.min(50, now - this.previous) : 0; this.previous = now
    if (this.encounter.running || deathAnimating) this.poseTime += dt
    this.feedback.advance(dt)
    this.impacts.update(dt)
    try {
      const running = this.encounter.running, sprint = this.keys.has('shift')
      const ix = +(this.keys.has('d') || this.keys.has('arrowright')) - +(this.keys.has('a') || this.keys.has('arrowleft')) || this.touchMove.x
      const iz = +(this.keys.has('s') || this.keys.has('arrowdown')) - +(this.keys.has('w') || this.keys.has('arrowup')) || this.touchMove.z
      const before = this.weapon.snapshot(), locked = before.cast?.locked
      const intent = running && !locked ? movementVector(ix, iz, sprint) : { x: 0, y: 0 }
      this.velocity = approachVelocity(this.velocity, intent, dt / 1000)
      this.position.x = T.MathUtils.clamp(this.position.x + this.velocity.x * dt / 1000, -7 * this.height, 7 * this.height)
      this.position.y = T.MathUtils.clamp(this.position.y + this.velocity.y * dt / 1000, 1.45 * this.height, 9.5 * this.height)
      if (running && (ix || iz) && !locked) this.direction = sector(ix, iz)
      this.yaw = approachFacing(this.yaw, -directions.indexOf(before.cast?.actor.direction ?? this.direction) * Math.PI / 4, dt / 1000)
      const moved = Math.hypot(this.velocity.x, this.velocity.y) > 2
      this.stride = (this.stride + Math.hypot(this.velocity.x, this.velocity.y) * dt / 1000 / (sprint ? STUDIO_LOCOMOTION.runCycleDistance : STUDIO_LOCOMOTION.walkCycleDistance)) % 1
      this.encounter.advance(dt, { x: this.position.x / this.height, z: this.position.y / this.height })
      this.boss.pose(this.poseTime, this.encounter, this.reducedMotion.matches)
      if (running) this.consume(this.weapon.advance(dt, {
        targets: this.targets(),
        // The masonry stops projectiles behind the exposed socket crystals.
        solids: [{ x: -8 * this.height, y: -2 * this.height, width: 16 * this.height, height: 2.2 * this.height }],
        actorPosition: { ...this.position },
      }), before)
      if (!this.encounter.running && running) { this.weapon.cancel('leave'); this.castReceipts.clear(); this.stopSounds(); this.touchMove = { x: 0, z: 0 }; this.velocity = { x: 0, y: 0 }; if (this.encounter.hp <= 0) this.playCue('defeat') }
      const cast = this.weapon.snapshot().cast
      const projectiles = this.weapon.snapshot().projectiles
      for (let i = 0; i < this.projectiles.length; i++) {
        const art = this.projectiles[i], projectile = projectiles[i]
        art.visible = !!projectile
        if (projectile) { art.position.set(projectile.position.x, .55 * this.height, projectile.position.y); art.rotation.y = now / 220 }
      }
      this.player.pose(cast ? 'item-' + cast.key : moved ? sprint ? 'run' : 'walk' : 'idle', cast ? cast.elapsed / cast.duration : moved ? this.stride : this.poseTime / 2400 % 1, { gait: sprint ? 'run' : 'walk', locomotionPhase: this.stride, secondaryMotion: { phase: this.poseTime / 2400 % 1, locomotion: moved ? 1 : 0 } })
      this.player.root.position.set(this.position.x, 0, this.position.y); this.player.root.rotation.y = this.yaw
      const shadow = this.scene.getObjectByName('player-shadow')!; shadow.position.set(this.position.x, -.04 * this.height, this.position.y)
      for (let i = 0; i < HEADS.length; i++) {
        const point = this.boss.throatPosition(HEADS[i]), ring = this.throatRings[i]
        ring.visible = this.encounter.exposed(HEADS[i]) && point.y <= this.height * 2.1
        ring.position.set(point.x, .02 * this.height, point.z)
      }
      const window = this.encounter.window(); this.telegraph.count = 0
      this.fire.update(this.encounter, this.reducedMotion.matches)
      // Make newly confirmed contact visible this frame without advancing it twice.
      this.impacts.update(0)
      if (this.encounter.cast && this.encounter.cast.id !== 'riftfire-rain' && (window === 'preparation' || window === 'active')) {
        const matrix = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, 0)), scale = new T.Vector3(1, 1, 1), point = new T.Vector3()
        for (let z = 1.4; z <= 9; z += .3) for (let x = -7.2; x <= 7.2; x += .3) if (this.encounter.inDanger({ x, z })) {
          matrix.compose(point.set(x * this.height, .01 * this.height, z * this.height), q, scale)
          this.telegraph.setMatrixAt(this.telegraph.count++, matrix)
        }
        this.telegraph.instanceMatrix.needsUpdate = true
        ;(this.telegraph.material as T.MeshBasicMaterial).color.set(window === 'active' ? '#eb573f' : '#e8a847')
      }
      this.soundStops = this.soundStops.filter(s => { if (s.until > now) return true; s.stop(); return false })
      this.rendered = now; this.dirty = false; this.renderer.render(this.scene, this.camera)
      if (this.finish && this.pixelOutput) {
        this.rawContext.clearRect(0, 0, this.width, this.frameHeight); this.rawContext.drawImage(this.renderer.domElement, 0, 0)
        this.output.putImageData(this.finish.finishInto(this.rawContext.getImageData(0, 0, this.width, this.frameHeight), this.pixelOutput, 1, true), 0, 0)
      } else {
        this.output.clearRect(0, 0, this.width, this.frameHeight)
        this.output.drawImage(this.renderer.domElement, 0, 0)
      }
      drawVisualFeedback(this.output, this.feedback, this.projectFeedback, this.reducedMotion.matches)
      if (now - this.published > 120) { this.published = now; this.report() }
    } catch (failure) { this.pause(); cancelAnimationFrame(this.raf); this.fail(failure instanceof Error ? failure.message : 'The boss renderer stopped. Retry the preview.') }
  }
  dispose() {
    this.leaveVoice();
    if (this.disposed) return
    this.disposed = true; cancelAnimationFrame(this.raf); this.events.abort(); this.sounds.abort(); this.observer.disconnect()
    this.soundStops.forEach(s => s.stop()); this.soundStops = []
    this.weapon.cancel('leave'); this.encounter.cancel(); this.orbit.dispose(); this.clearEffects(); this.impacts.dispose(); this.fire.dispose(); this.boss.dispose(); disposeRig(this.player)
    this.feedback.clear(); this.castReceipts.clear()
    this.scene.traverse(node => { if (node instanceof T.DirectionalLight) node.shadow.dispose() })
    this.scene.traverse(node => { if (node instanceof T.Mesh || node instanceof T.LineSegments) { node.geometry.dispose(); for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose() } })
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.canvas.remove()
  }
}
