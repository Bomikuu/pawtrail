import * as T from 'three'
import manifest from '../../../assets/monster-studio/morvane-ossuary-serpent/manifest.json'
import type { SerpentEncounter } from './serpent-encounter'
import { ARENA_DEFINITIONS } from './arena-definitions'

const DEF = ARENA_DEFINITIONS.serpent
/** Registered skeletal cutouts follow the manifest's articulated world-space segments. */
export class SerpentRig {
  readonly root = new T.Group()
  private maps: T.Texture[] = []
  private frameCount = manifest.columns * manifest.rows
  private materials: T.SpriteMaterial[] = []
  private ribs: T.Sprite[] = []
  private backbone: T.Sprite[] = []
  private legs: T.Sprite[][] = []
  private shadows: T.Mesh[] = []
  private neck: T.Sprite[] = []
  private skull: T.Sprite
  private jaw: T.Sprite
  private arms: T.Sprite[][] = []
  private tail: T.Sprite
  private shadowGeometry = new T.CircleGeometry(.45, 16)
  private shadowMaterial = new T.MeshBasicMaterial({ color: '#1c1822', transparent: true, opacity: .27, depthWrite: false })
  static async create() {
    const atlas = await new T.TextureLoader().loadAsync(DEF.assets + manifest.atlas)
    atlas.minFilter = atlas.magFilter = T.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = T.SRGBColorSpace
    try { return new SerpentRig(atlas) } catch (error) { atlas.dispose(); throw error }
  }
  private constructor(private atlas: T.Texture) {
    this.root.name = DEF.id + '-segmented-cutout-rig'; const p = manifest.parts
    for (let i = 0; i < this.frameCount * 2; i++) {
      const frame = i % this.frameCount, mirrored = i >= this.frameCount, map = atlas.clone()
      map.repeat.set((mirrored ? -1 : 1) / manifest.columns, 1 / manifest.rows); map.offset.set((frame % manifest.columns + (mirrored ? 1 : 0)) / manifest.columns, 1 - (Math.floor(frame / manifest.columns) + 1) / manifest.rows); map.needsUpdate = true; this.maps.push(map)
    }
    for (let i = 0; i < manifest.bodySegments; i++) {
      const rib = this.part(p.ribs, 2, 1.7, 1.35); this.ribs.push(rib)
      this.backbone.push(this.part(p.spine, 1, .55, .8))
      this.legs.push([-1, 1].map(side => { const leg = this.part(p.leg, 1, 1.5, 1.25, side < 0); leg.center.set(.5, .55); return leg }))
      const shadow = new T.Mesh(this.shadowGeometry, this.shadowMaterial); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.025; this.root.add(shadow); this.shadows.push(shadow)
    }
    this.tail = this.part(p.tail, 2, 1.5, 1.6)
    for (let i = 0; i < 5; i++) { const bone = this.part(p.spine, 4, .8, 1.15); bone.position.y = .85 + i * .46; this.neck.push(bone) }
    for (let i = 0; i < 3; i++) { const rib = this.part(p.ribs, 5, 2.1 - i * .18, .85); rib.position.set(0, 1.3 + i * .48, .1); this.neck.push(rib) }
    this.skull = this.part(p.skull, 8, 2.3, 3.1); this.jaw = this.part(p.jaw, 9, 1.5, .9)
    for (let i = 0; i < 2; i++) this.arms.push([this.part(p.arm, 6, .8, 2.8, i === 0), this.part(p.blade, 7, 1.1, 3, i === 0)])
  }
  private part(frame: number, order: number, width: number, height: number, mirrored = false) {
    const material = new T.SpriteMaterial({ map: this.maps[frame + (mirrored ? this.frameCount : 0)], transparent: true, alphaTest: .12, depthWrite: true, toneMapped: false }); material.userData.frame = frame; material.userData.mirrored = mirrored; this.materials.push(material)
    const sprite = new T.Sprite(material); sprite.scale.set(width, height, 1); sprite.renderOrder = order; this.root.add(sprite); return sprite
  }
  private connect(sprite: T.Sprite, from: T.Vector3, to: T.Vector3, width: number) {
    sprite.position.copy(from).add(to).multiplyScalar(.5)
    const dx = to.x - from.x, dy = (to.y - from.y) * .87 - (to.z - from.z) * .49
    sprite.material.rotation = -Math.atan2(dx, dy); sprite.scale.set(width, Math.hypot(dx, dy) * 1.18, 1)
  }
  pose(time: number, encounter: SerpentEncounter, reduced: boolean) {
    const e = encounter, t = time / 1000, offset = e.enraged ? manifest.enragedFrameOffset : 0, death = Math.min(1, e.deathElapsed / 1200)
    const active = e.window() === 'striking', bite = e.cast?.id === 'grave-bite', bend = bite && active ? 1.65 : e.weak ? 1.35 : e.window() === 'warning' && bite ? -.2 : 0
    for (const material of this.materials) { material.map = this.maps[(material.userData.frame as number) + offset + (material.userData.mirrored ? this.frameCount : 0)]; material.opacity = 1 - death * .65 }
    for (let i = 0; i < this.ribs.length; i++) {
      const point = e.segments[i], previous = e.segments[Math.max(0, i - 1)], angle = i ? Math.atan2(previous.x - point.x, previous.z - point.z) : e.facing
      const x = point.x - e.position.x, z = point.z - e.position.z, wave = reduced || !e.moving ? 0 : Math.sin(e.travelled * 5 - i * .75), taper = 1 - i / this.ribs.length * .55
      const rib = this.ribs[i]; rib.position.set(x, (1.1 + (reduced ? 0 : Math.sin(t * 2 - i * .2) * .025) - death * .6) * taper, z); rib.material.rotation = -angle * .35
      this.connect(this.backbone[i], new T.Vector3(x, (1.05 - death * .5) * taper, z), new T.Vector3(previous.x - e.position.x, (1.05 - death * .5) * (1 - Math.max(0, i - 1) / this.ribs.length * .55), previous.z - e.position.z), .55 * taper)
      this.backbone[i].visible = i > 0
      rib.scale.set(1.7 * taper, 1.35 * taper, 1)
      this.shadows[i].position.set(x, -.025, z); this.shadows[i].scale.setScalar(taper)
      for (let side = 0; side < 2; side++) {
        const sign = side ? 1 : -1, leg = this.legs[i][side], stride = wave * sign
        leg.position.set(x + Math.cos(angle) * sign * .65 * taper, (.65 + Math.max(0, stride) * .13 - death * .25) * taper, z - Math.sin(angle) * sign * .65 * taper + stride * .13)
        leg.material.rotation = sign * .14 - angle * .3 + stride * .13; leg.scale.set(1.5 * taper, 1.25 * taper, 1)
      }
    }
    const last = e.segments.at(-1)!, previous = e.segments.at(-2)!, tailAngle = Math.atan2(last.x - previous.x, last.z - previous.z)
    this.tail.position.set(last.x - e.position.x, .4 - death * .2, last.z - e.position.z); this.tail.material.rotation = -tailAngle * .5
    const breathe = reduced ? 0 : Math.sin(t * 2) * .035
    for (let i = 0; i < this.neck.length; i++) { this.neck[i].position.z = bend * .23; this.neck[i].position.x = reduced ? 0 : Math.sin(t * 1.2 + i * .2) * .025; this.neck[i].material.rotation = bend * -.07 }
    this.skull.position.set(0, 4.05 + breathe - bend - death * 2, .12 + bend * .45); this.skull.material.rotation = death * -.45 + (reduced ? 0 : Math.sin(t * 1.2) * .025)
    this.jaw.position.set(-.4, 2.3 + breathe - bend - death * 1.2, .3 + bend * .45); this.jaw.material.rotation = (active || e.window() === 'enraging' ? -.2 : -.06) + (reduced ? 0 : Math.sin(t * 1.7) * .025)
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1, sway = reduced ? 0 : Math.sin(t * 1.5 + i * Math.PI) * .07
      const shoulder = new T.Vector3(side * .35, 2.75 - death * 1.2, .05)
      const elbow = new T.Vector3(side * (2.5 + sway), 2.7 - bend * .4 - death, .4)
      const tip = new T.Vector3(side * (3.3 + sway), .12 + (active ? .2 : 0), 3.0 + bend * .35)
      this.connect(this.arms[i][0], shoulder, elbow, .85); this.connect(this.arms[i][1], elbow, tip, 1.05)
    }
    if (e.clock < e.hurtUntil && !reduced) this.skull.position.x += Math.sin(time / 20) * .04
  }
  dispose() { this.root.removeFromParent(); this.materials.forEach(m => m.dispose()); this.maps.forEach(m => m.dispose()); this.atlas.dispose(); this.shadowGeometry.dispose(); this.shadowMaterial.dispose(); this.root.clear() }
}
