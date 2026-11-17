import * as T from 'three'
import manifest from '../../../assets/monster-studio/vesper-hollow-reaper/manifest.json'
import { ARENA_DEFINITIONS } from './arena-definitions'
import type { ReaperEncounter } from './reaper-encounter'

/** Hovering articulated robe, hands and a registered scythe grip; no walking feet. */
export class ReaperRig {
  readonly root = new T.Group()
  private maps: T.Texture[] = []
  private materials: T.SpriteMaterial[] = []
  private hood: T.Sprite
  private torso: T.Sprite
  private sleeves: T.Sprite[] = []
  private hems: T.Sprite[] = []
  private scythe: T.Sprite
  private trail: T.Sprite
  static async create() {
    const atlas = await new T.TextureLoader().loadAsync(ARENA_DEFINITIONS.reaper.assets + manifest.atlas)
    atlas.magFilter = atlas.minFilter = T.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = T.SRGBColorSpace
    try { return new ReaperRig(atlas) } catch (error) { atlas.dispose(); throw error }
  }
  private constructor(private atlas: T.Texture) {
    const p = manifest.parts; this.root.name = manifest.id + '-hovering-cutout-rig'
    for (let i = 0; i < manifest.columns * manifest.rows; i++) { const map = atlas.clone(); map.repeat.set(1 / manifest.columns, 1 / manifest.rows); map.offset.set(i % manifest.columns / manifest.columns, 1 - (Math.floor(i / manifest.columns) + 1) / manifest.rows); map.needsUpdate = true; this.maps.push(map) }
    this.hems = [this.part(p.leftHem, 2, 1.45, 2), this.part(p.rightHem, 3, 1.45, 2)]
    this.torso = this.part(p.torso, 4, 1.7, 1.85); this.hood = this.part(p.hood, 8, 1.6, 1.7)
    this.sleeves = [this.part(p.leftSleeve, 6, 1.2, 1.55), this.part(p.rightSleeve, 6, 1.2, 1.55)]
    this.sleeves[0].center.set(manifest.holdingShoulder.x, manifest.holdingShoulder.y)
    this.scythe = this.part(p.scythe, 7, 4.4, 4.4); this.scythe.center.set(manifest.weaponGrip.x, manifest.weaponGrip.y)
    this.trail = this.part(p.trail, 1, 4.8, 3); this.trail.material.depthWrite = false; this.trail.visible = false
  }
  private part(frame: number, order: number, width: number, height: number) {
    const material = new T.SpriteMaterial({ map: this.maps[frame], transparent: true, alphaTest: .1, depthWrite: true, toneMapped: false }); material.userData.frame = frame; this.materials.push(material)
    const sprite = new T.Sprite(material); sprite.scale.set(width, height, 1); sprite.renderOrder = order; this.root.add(sprite); return sprite
  }
  pose(time: number, encounter: ReaperEncounter, reduced: boolean) {
    const e = encounter, t = time / 1000, offset = e.enraged ? manifest.enragedFrameOffset : 0, death = Math.min(1, e.deathElapsed / 1200)
    const stage = e.window(), elapsed = e.cast?.elapsed ?? 0, arc = e.cast?.id === 'reaping-arc', eclipse = e.cast?.id === 'hollow-eclipse'
    const breath = reduced ? 0 : Math.sin(t * 2) * .025, cloth = reduced ? 0 : Math.sin(t * 1.6) * .055
    const windup = arc ? Math.min(1, elapsed / 1150) : 0
    const sweep = arc ? T.MathUtils.clamp((elapsed - 1150) / 500, 0, 1) : 0
    const recover = arc ? T.MathUtils.clamp((elapsed - 1650) / 1250, 0, 1) : 0
    const weaponAngle = arc ? elapsed < 1150 ? -.12 + windup * .85 : elapsed < 1650 ? .73 - sweep * 2.1 : -1.37 + recover * 1.25 : eclipse ? .35 + (reduced ? 0 : Math.sin(elapsed / 300) * .1) : -.12
    for (const material of this.materials) { material.map = this.maps[(material.userData.frame as number) + offset]; material.opacity = 1 - death * .95 }
    this.hood.position.set(0, 3.55 + breath - death * .3, .05); this.hood.material.rotation = cloth * .3
    this.torso.position.set(0, 2.55 + breath - death * .2, 0); this.torso.scale.y = 1.85 * (1 + breath * .5)
    for (let i = 0; i < this.hems.length; i++) {
      const sign = i ? 1 : -1, spread = e.enraged || eclipse ? .16 : 0
      this.hems[i].position.set(sign * (.42 + spread), 1.13 + breath - death * .1, .02)
      this.hems[i].material.rotation = sign * (.04 + spread) + cloth * sign
      this.hems[i].scale.y = 2 * (1 + (reduced ? 0 : Math.sin(t * 1.6 + i) * .015))
    }
    const armTurn = arc ? Math.min(0, weaponAngle + .12) * .9 + Math.max(0, weaponAngle + .12) * .15 : eclipse ? -.55 : 0
    this.sleeves[0].position.set(-.45, 3.05 + breath, .1); this.sleeves[0].material.rotation = armTurn
    this.sleeves[1].position.set(.7, 2.3 + breath, .12); this.sleeves[1].material.rotation = -cloth * .7 - (eclipse ? .18 : 0)
    const gripX = (manifest.holdingHand.x - manifest.holdingShoulder.x) * 1.2, gripY = (manifest.holdingHand.y - manifest.holdingShoulder.y) * 1.55, armAngle = this.sleeves[0].material.rotation
    const handX = gripX * Math.cos(armAngle) - gripY * Math.sin(armAngle), handY = gripX * Math.sin(armAngle) + gripY * Math.cos(armAngle)
    // Fixed arena camera's billboard-up basis; grip follows the actual rotated artwork.
    this.scythe.position.set(this.sleeves[0].position.x + handX, this.sleeves[0].position.y + handY * .896, this.sleeves[0].position.z - handY * .443); this.scythe.material.rotation = weaponAngle
    this.trail.visible = stage === 'striking'; this.trail.position.set(0, 1.45, 1)
    this.trail.material.rotation = arc ? weaponAngle * .7 : elapsed / 500
    this.trail.material.opacity = reduced ? .24 : .48 * Math.sin(Math.PI * T.MathUtils.clamp((elapsed - (arc ? 1150 : 1650)) / 500, 0, 1))
    if (e.clock < e.hurtUntil && !reduced) this.torso.position.x += Math.sin(time / 20) * .045
  }
  dispose() { this.root.removeFromParent(); this.materials.forEach(m => m.dispose()); this.maps.forEach(m => m.dispose()); this.atlas.dispose(); this.root.clear() }
}
