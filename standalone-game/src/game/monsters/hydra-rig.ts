import * as T from 'three'
import { HYDRA, HYDRA_HEADS } from './hydra'
import type { HydraEncounter } from './hydra-encounter'
import manifest from '../../../assets/monster-studio/kaedros-embermaw/manifest.json'

type Neck = { parts: T.Sprite[]; head: T.Sprite; x: number; height: number; index: number }
/** A native illustrated rig, not a tinted poster. All cutouts share registered phase cells. */
export class HydraRig {
  readonly root = new T.Group()
  private maps: T.Texture[] = []
  private materials: T.SpriteMaterial[] = []
  private wings: T.Sprite[] = []
  private feet: T.Sprite[] = []
  private necks: Neck[] = []
  private torso: T.Sprite
  private tail: T.Sprite
  private disposed = false
  static async create() {
    const atlas = await new T.TextureLoader().loadAsync(HYDRA.assets + 'parts.webp')
    atlas.minFilter = atlas.magFilter = T.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = T.SRGBColorSpace
    try { return new HydraRig(atlas) } catch (error) { atlas.dispose(); throw error }
  }
  private constructor(private atlas: T.Texture) {
    this.root.name = HYDRA.id + '-layered-pixel-rig'
    for (let i = 0; i < manifest.columns * manifest.rows; i++) {
      const map = atlas.clone(); map.repeat.set(1 / manifest.columns, 1 / manifest.rows); map.offset.set(i % manifest.columns / manifest.columns, 1 - (Math.floor(i / manifest.columns) + 1) / manifest.rows); map.needsUpdate = true; this.maps.push(map)
    }
    const p = manifest.parts
    this.tail = this.part(p.tail, 1, 2.6, 2.6); this.tail.position.set(1.2, .8, -.7)
    for (const side of [-1, 1]) {
      const wing = this.part(side < 0 ? p.leftWing : p.rightWing, 2, 3.2, 3.9); wing.center.set(side < 0 ? .9 : .1, .28); wing.position.set(side * .72, 2.05, -.45); this.wings.push(wing)
    }
    for (let i = 0; i < 4; i++) {
      const foot = this.part(p.leg, i < 2 ? 3 : 7, 1.25, 1.5); foot.center.set(.5, .22); foot.position.set((i % 2 ? 1 : -1) * .85, .28, i < 2 ? -.48 : .48); this.feet.push(foot)
    }
    this.torso = this.part(p.torso, 5, 2.75, 2.8); this.torso.position.set(0, 1.4, 0)
    const heights = HYDRA_HEADS.heights, xs = HYDRA_HEADS.x
    for (let i = 0; i < 5; i++) {
      const parts = Array.from({ length: 7 }, () => this.part(p.neck, i === 0 || i === 4 ? 8 : 6, 1.05, 1.4))
      const head = this.part(p.headClosed, 10, 1.4, 1.4)
      this.necks.push({ parts, head, x: xs[i], height: heights[i], index: i })
    }
  }
  private part(frame: number, order: number, width: number, height: number) {
    const material = new T.SpriteMaterial({ map: this.maps[frame], alphaTest: .12, transparent: true, depthWrite: true, toneMapped: false })
    material.userData.frame = frame; this.materials.push(material)
    const sprite = new T.Sprite(material); sprite.renderOrder = order; sprite.scale.set(width, height, 1); this.root.add(sprite); return sprite
  }
  pose(time: number, encounter: HydraEncounter, reduced: boolean) {
    if (this.disposed) return
    const offset = encounter.enraged ? manifest.enragedFrameOffset : 0, window = encounter.window(), death = Math.min(1, encounter.deathElapsed / 1200)
    const t = time / 1000, breath = reduced ? 0 : Math.sin(t * 2.2) * .025
    const stride = encounter.moving && !reduced ? Math.sin(t * (encounter.enraged ? 10 : 7)) : 0
    const roar = window === 'firing' || window === 'enraging', flying = encounter.lift > .1
    for (const material of this.materials) { material.map = this.maps[(material.userData.frame as number) + offset]; material.opacity = 1 - death * .65 }
    this.torso.scale.y = 2.8 * (1 + breath); this.torso.position.y = 1.4 + Math.abs(stride) * .035
    this.tail.material.rotation = reduced ? 0 : Math.sin(t * 1.4) * .07
    for (let i = 0; i < this.feet.length; i++) {
      const foot = this.feet[i], swing = stride * (i === 0 || i === 3 ? 1 : -1)
      foot.position.y = .28 + Math.max(0, swing) * .16; foot.position.z = (i < 2 ? -.48 : .48) + swing * .18
      foot.material.rotation = swing * .1 + (flying ? (i % 2 ? -.22 : .22) : 0)
    }
    for (let i = 0; i < this.wings.length; i++) {
      const sign = i ? -1 : 1
      this.wings[i].material.rotation = sign * (flying ? Math.sin(t * 11) * .48 : window === 'enraging' ? .38 : .08 + breath * 2)
    }
    for (const neck of this.necks) {
      const i = neck.index, wave = reduced ? 0 : Math.sin(t * 1.9 + i * .85) * .065
      const firing = window === 'firing' || window === 'warning' && encounter.cast?.id === 'ember-barrage'
      const lower = firing ? HYDRA_HEADS.fireLower * (window === 'firing' ? 1 : Math.min(1, (encounter.cast?.elapsed ?? 0) / 900)) : death
      const tipX = neck.x * (1 - lower * .55) + wave
      const tipY = T.MathUtils.lerp(neck.height, 1.25, lower) + (window === 'enraging' ? .3 : 0) - death * .5
      const rootX = (i - 2) * .23, rootY = 2
      for (let n = 0; n < neck.parts.length; n++) {
        const u = n / (neck.parts.length - 1), bend = Math.sin(u * Math.PI) * (i - 2) * .08
        neck.parts[n].position.set(T.MathUtils.lerp(rootX, tipX, u) + bend, T.MathUtils.lerp(rootY, tipY, u), .12 + u * .18 + lower * .75)
        neck.parts[n].material.rotation = -Math.atan2(tipX - rootX, tipY - rootY) * .8
      }
      neck.head.position.set(tipX, tipY + .22, .38 + lower * .75)
      neck.head.material.map = this.maps[(roar || firing && i === Math.floor(t * 5) % 5 ? manifest.parts.headRoar : manifest.parts.headClosed) + offset]
      neck.head.material.rotation = wave * .3 + (window === 'enraging' ? (i - 2) * -.05 : 0)
      if (encounter.clock < encounter.hurtUntil && !reduced) neck.head.position.x += Math.sin(time / 22) * .035
    }
    this.root.rotation.z = death * -.12
  }
  dispose() { if (this.disposed) return; this.disposed = true; this.root.removeFromParent(); this.materials.forEach(m => m.dispose()); this.maps.forEach(m => m.dispose()); this.atlas.dispose(); this.root.clear() }
}
