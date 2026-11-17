import * as T from 'three'
import manifest from '../../../assets/monster-studio/vaelrith-riftbound/layered-2d/manifest.json'
import type { MonsterPresentation } from './presentation'
import type { MonsterEncounter } from './encounter'
import { sampleBossMotion } from './motion'
import { ATTACKS, HEADS, headX, type HeadId } from './vaelrith'

type LayeredNeck = {
  id: HeadId; home: T.Vector3[]; points: T.Vector3[]; tip: T.Vector3
  links: T.Sprite[]; head: T.Group; face: T.Sprite; throat: T.Object3D; seal: T.Sprite
}
const clamp = T.MathUtils.clamp
const v = (x: number, y: number, z: number) => new T.Vector3(x, y, z)

/** Fully illustrated creature: flat parts, fixed roots, no 3D creature geometry. */
export class LayeredVaelrith implements MonsterPresentation {
  readonly root = new T.Group()
  readonly necks: LayeredNeck[] = []
  private maps: T.Texture[] = []
  private materials: T.SpriteMaterial[] = []
  private cameraRight = v(1, 0, 0)
  private cameraUp = v(0, 1, 0)
  private from = v(0, 0, 0)
  private to = v(0, 0, 0)
  private delta = v(0, 0, 0)
  private posedAt: number | null = null
  private disposed = false

  static async create() {
    let atlas: T.Texture
    try { atlas = await new T.TextureLoader().loadAsync(manifest.url) }
    catch (cause) { throw new Error('Vaelrith’s 2D parts could not load. Reload the page and try again.', { cause }) }
    atlas.minFilter = atlas.magFilter = T.NearestFilter
    atlas.generateMipmaps = false; atlas.colorSpace = T.SRGBColorSpace
    try { return new LayeredVaelrith(atlas) } catch (error) { atlas.dispose(); throw error }
  }
  private constructor(private atlas: T.Texture) {
    this.root.name = 'vaelrith-layered-2d'
    for (let index = 0; index < manifest.frames; index++) {
      const map = atlas.clone()
      map.repeat.set(1 / manifest.columns, 1 / manifest.rows)
      map.offset.set(index % manifest.columns / manifest.columns, 1 - (Math.floor(index / manifest.columns) + 1) / manifest.rows)
      map.needsUpdate = true; this.maps.push(map)
    }
    for (const id of HEADS) {
      const side = id === 'left' ? -1 : id === 'right' ? 1 : 0, x = headX[id]
      // Same world-space neck anchors and resting head positions as the 3D rig.
      const home = [v(x, 1.4, -.35), v(x + side * .7, 2.55, -.1), v(x + side * 1.1, 3.9, .12), v(x + side * .85, 5.15, .65), v(x + side * .25, side ? 5.85 : 6.65, 1.05)]
      if (!side) { home[1].y += .3; home[2].y += .6; home[3].y += .7 }
      const socket = this.part(manifest.parts.socket, 2)
      socket.name = `${id}-illustrated-socket`; socket.position.set(x, 1.05, -.5); socket.scale.set(5.2, 2.8, 1)
      const links = Array.from({ length: manifest.neckSegments }, (_, index) => {
        const sprite = this.part(manifest.parts.neck, index === 0 ? 1 : index + 3)
        sprite.name = `${id}-illustrated-neck-${index}`; return sprite
      })
      const head = new T.Group(); head.name = `${id}-illustrated-head`; this.root.add(head)
      const face = this.part(manifest.parts.alert[HEADS.indexOf(id)], 10, head)
      face.scale.setScalar(id === 'center' ? 3.4 : 3.1)
      const throat = new T.Object3D(); throat.name = `${id}-2d-throat-contact`; throat.position.set(0, -.35, .08); head.add(throat)
      const seal = this.part(manifest.parts.seal, 11)
      seal.name = `${id}-2d-seal`; seal.position.set(x, 1.25, .51); seal.scale.setScalar(.72)
      this.necks.push({ id, home, points: home.map(point => point.clone()), tip: home[4].clone(), links, head, face, throat, seal })
    }
  }
  private part(frame: number, order: number, parent: T.Group = this.root) {
    const material = new T.SpriteMaterial({ map: this.maps[frame], transparent: true, alphaTest: .045, depthWrite: false, toneMapped: false })
    this.materials.push(material)
    const sprite = new T.Sprite(material); sprite.renderOrder = order; parent.add(sprite)
    return sprite
  }
  setCamera(camera: T.Camera) {
    const orientation = camera.getWorldQuaternion(new T.Quaternion())
    this.cameraRight.set(1, 0, 0).applyQuaternion(orientation)
    this.cameraUp.set(0, 1, 0).applyQuaternion(orientation)
  }
  private along(points: T.Vector3[], t: number, target: T.Vector3) {
    const scaled = clamp(t, 0, 1) * 4, index = Math.min(3, Math.floor(scaled))
    return target.lerpVectors(points[index], points[index + 1], scaled - index)
  }
  pose(time: number, encounter: MonsterEncounter, reducedMotion: boolean) {
    if (this.disposed) return
    const first = this.posedAt === null || time < this.posedAt
    const dt = first ? 0 : Math.max(0, time - this.posedAt!)
    const blend = first || reducedMotion ? 1 : 1 - Math.exp(-dt / 55)
    this.posedAt = time
    const cast = encounter.cast, attack = cast && ATTACKS[cast.id], window = encounter.window(), defeated = encounter.hp <= 0
    const death = defeated ? clamp(encounter.deathElapsed / 1200, 0, 1) : 0, deathEase = death * death * (3 - 2 * death)
    for (const neck of this.necks) {
      const index = HEADS.indexOf(neck.id), phase = index * .9
      const involved = !!attack && (attack.head === neck.id || attack.head === 'all')
      const motion = sampleBossMotion(involved && cast ? cast.id : null, cast?.elapsed ?? 0)
      const wave = reducedMotion || defeated ? 0 : Math.sin(time * .0018 + phase) * .085
      const lower = defeated ? .94 * deathEase : window === 'stagger' ? .9 : motion.lower
      for (let i = 0; i < 5; i++) neck.points[i].copy(neck.home[i])
      const tip = neck.points[4], home = neck.home[4]
      tip.y = T.MathUtils.lerp(home.y, 1.35, lower) + motion.lift + wave
      tip.z += motion.back + motion.reach * 1.8 + lower * 1.4; tip.x += wave * .65
      const hurt = encounter.hurtHead === neck.id && encounter.clock < encounter.hurtUntil && !defeated
      if (!reducedMotion && hurt) tip.z -= Math.sin(Math.PI * (1 - (encounter.hurtUntil - encounter.clock) / 220)) * .15
      if (involved && cast?.id === 'rift-fang') {
        tip.x = T.MathUtils.lerp(tip.x, cast.aim.x, motion.aimMix)
        tip.y = T.MathUtils.lerp(tip.y, 1.2, motion.aimMix); tip.z = T.MathUtils.lerp(tip.z, cast.aim.z, motion.aimMix)
      }
      if (involved && cast?.id === 'obsidian-sweep') {
        tip.x = T.MathUtils.lerp(tip.x, motion.sweepX, motion.sweepMix)
        tip.y = T.MathUtils.lerp(tip.y, 1.3, motion.sweepMix); tip.z = T.MathUtils.lerp(tip.z, 2.6, motion.sweepMix)
      }
      neck.tip.lerp(tip, blend); tip.copy(neck.tip)
      for (let i = 1; i < 4; i++) {
        const p = i / 4
        neck.points[i].addScaledVector(this.delta.copy(tip).sub(home), p * p)
        if (!reducedMotion && !defeated) neck.points[i].x += Math.sin(time * .0018 + phase - i * .42) * .065 * p * (1 - p)
      }
      // Overlapping illustrated segments follow the projected curve, without gaps
      // when a head lunges in depth. Root/socket anchors never move.
      for (let i = 0; i < neck.links.length; i++) {
        this.along(neck.points, i / neck.links.length, this.from)
        this.along(neck.points, (i + 1) / neck.links.length, this.to)
        const sprite = neck.links[i], delta = this.delta.copy(this.to).sub(this.from)
        const dx = delta.dot(this.cameraRight), dy = delta.dot(this.cameraUp)
        sprite.position.copy(this.from).add(this.to).multiplyScalar(.5)
        sprite.material.rotation = -Math.atan2(dx, dy)
        const taper = 1 - i / neck.links.length * .22
        sprite.scale.set((neck.id === 'center' ? 1.95 : 1.7) * taper, Math.max(1, Math.hypot(dx, dy) + .75), 1)
      }
      neck.head.position.copy(tip)
      neck.face.material.map = this.maps[(hurt || encounter.exposed(neck.id) || defeated ? manifest.parts.hurt : involved && motion.jaw > .48 ? manifest.parts.roar : manifest.parts.alert)[index]]
      neck.face.material.rotation = reducedMotion ? 0 : wave * .3 + (involved ? motion.sweepX / 6 * motion.sweepMix * -.1 : 0)
      const breath = reducedMotion || defeated ? 0 : Math.sin(time * .0018 + phase) * .012
      const size = index === 1 ? 3.4 : 3.1
      neck.face.scale.set(size * (1 + breath), size * (1 - breath), 1)
      neck.seal.visible = !defeated; neck.seal.scale.setScalar(encounter.sealExposed() ? .95 : .72)
    }
    this.root.updateMatrixWorld(true)
  }
  throatPosition(id: HeadId) { return this.necks.find(neck => neck.id === id)!.throat.getWorldPosition(new T.Vector3()) }
  sealPosition(id: HeadId) { return this.necks.find(neck => neck.id === id)!.seal.getWorldPosition(new T.Vector3()) }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.root.removeFromParent()
    this.materials.forEach(material => material.dispose()); this.maps.forEach(map => map.dispose()); this.atlas.dispose()
    this.root.clear(); this.necks.length = 0; this.materials = []; this.maps = []
  }
}
