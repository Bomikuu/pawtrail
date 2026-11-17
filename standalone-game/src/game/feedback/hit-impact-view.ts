import * as T from 'three'
import { HIT_IMPACT, HitImpactPool, type HitImpactRequest } from './hit-impact'

/** Animated contact sprites drawn at real 3D contact positions, separate from numbers. */
export class HitImpactView {
  readonly root = new T.Group()
  readonly pool = new HitImpactPool()
  private sprites: T.Sprite[] = []
  private maps: T.Texture[] = []
  private disposed = false
  private constructor(private atlas: T.Texture) {
    this.root.name = 'confirmed-contact-sprite-pool'
    for (let index = 0; index < HIT_IMPACT.capacity; index++) {
      const map = atlas.clone(); map.repeat.set(1 / HIT_IMPACT.columns, 1 / HIT_IMPACT.rows); map.needsUpdate = true
      const sprite = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, alphaTest: .04, depthWrite: false, depthTest: false, toneMapped: false }))
      sprite.name = 'hit-impact-' + index; sprite.renderOrder = 20; sprite.visible = false
      this.maps.push(map); this.sprites.push(sprite); this.root.add(sprite)
    }
  }
  static async create() {
    let texture: T.Texture
    try { texture = await new T.TextureLoader().loadAsync(HIT_IMPACT.url) }
    catch (cause) { throw new Error('The hit-impact animation could not load. Reload the page and try again.', { cause }) }
    texture.minFilter = texture.magFilter = T.NearestFilter; texture.generateMipmaps = false; texture.colorSpace = T.SRGBColorSpace
    try { return new HitImpactView(texture) } catch (error) { texture.dispose(); throw error }
  }
  get pending() { return this.pool.pending }
  spawn(request: HitImpactRequest) { if (!this.disposed) this.pool.spawn(request) }
  update(delta: number) {
    this.pool.advance(delta)
    for (let index = 0; index < this.sprites.length; index++) {
      const sprite = this.sprites[index], slot = this.pool.slots[index], frame = this.pool.frame(slot)
      sprite.visible = frame >= 0
      if (frame < 0) continue
      sprite.position.set(slot.position.x, slot.position.y, slot.position.z)
      sprite.scale.setScalar(slot.unit * HIT_IMPACT.clips[slot.kind].size)
      sprite.material.color.set(slot.color)
      const map = this.maps[index]
      if (map.userData.impactFrame !== frame) {
        map.offset.set((frame % HIT_IMPACT.columns) / HIT_IMPACT.columns, 1 - (Math.floor(frame / HIT_IMPACT.columns) + 1) / HIT_IMPACT.rows)
        map.userData.impactFrame = frame
      }
    }
  }
  clear() { this.pool.clear(); for (const sprite of this.sprites) sprite.visible = false }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.clear(); this.root.removeFromParent()
    for (const sprite of this.sprites) sprite.material.dispose()
    this.maps.forEach(map => map.dispose()); this.atlas.dispose()
    this.root.clear(); this.sprites = []; this.maps = []
  }
}
