import * as T from 'three'
import { RIFTFIRE } from './fire'
import { hydraBoltHeight, type HydraBolt } from './hydra-encounter'

/** Reuses the approved generated flame frames; bounded sprites follow real projectiles. */
export class HydraEmbers {
  readonly root = new T.Group()
  private sprites: T.Sprite[] = []
  private maps: T.Texture[] = []
  static async create() {
    const atlas = await new T.TextureLoader().loadAsync(RIFTFIRE.url)
    atlas.magFilter = atlas.minFilter = T.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = T.SRGBColorSpace
    return new HydraEmbers(atlas)
  }
  private constructor(private atlas: T.Texture) {
    for (let i = 0; i < 80; i++) {
      const map = atlas.clone(); map.repeat.set(1 / RIFTFIRE.columns, 1 / RIFTFIRE.rows); map.needsUpdate = true
      const sprite = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, depthWrite: false, alphaTest: .04, toneMapped: false }))
      sprite.visible = false; sprite.scale.set(.45, .65, 1); this.maps.push(map); this.sprites.push(sprite); this.root.add(sprite)
    }
  }
  update(bolts: readonly HydraBolt[], reduced: boolean) {
    for (let i = 0; i < this.sprites.length; i++) {
      const bolt = bolts[i], sprite = this.sprites[i]; sprite.visible = !!bolt
      if (!bolt) continue
      const frame = reduced ? 6 : 4 + Math.floor((1800 - bolt.life) / RIFTFIRE.frameMs) % 8
      this.maps[i].offset.set(frame % RIFTFIRE.columns / RIFTFIRE.columns, 1 - (Math.floor(frame / RIFTFIRE.columns) + 1) / RIFTFIRE.rows)
      sprite.position.set(bolt.x, hydraBoltHeight(bolt), bolt.z)
    }
  }
  dispose() { this.root.removeFromParent(); this.sprites.forEach(s => s.material.dispose()); this.maps.forEach(m => m.dispose()); this.atlas.dispose(); this.root.clear() }
}
