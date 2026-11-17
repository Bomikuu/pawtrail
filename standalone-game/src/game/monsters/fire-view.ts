import * as T from 'three'
import { ATTACKS } from './vaelrith'
import type { MonsterEncounter } from './encounter'
import { fireFrame, RIFTFIRE } from './fire'

/** Eight preallocated tile effects share one generated 16-frame image source. */
export class RiftfireView {
  readonly root = new T.Group()
  private sprites: T.Sprite[] = []
  private tiles: T.Mesh[] = []
  private maps: T.Texture[] = []
  private geometry = new T.PlaneGeometry(RIFTFIRE.tileSize, RIFTFIRE.tileSize)
  private warning = new T.MeshBasicMaterial({ color: '#e8a847', transparent: true, opacity: .52, depthWrite: false, toneMapped: false })
  private constructor(private atlas: T.Texture) {
    this.root.name = 'riftfire-eight-tile-pool'
    for (let index = 0; index < RIFTFIRE.count; index++) {
      const map = atlas.clone(); map.repeat.set(1 / RIFTFIRE.columns, 1 / RIFTFIRE.rows); map.needsUpdate = true; this.maps.push(map)
      const sprite = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, alphaTest: .035, depthWrite: false, toneMapped: false }))
      sprite.center.set(.5, .09); sprite.scale.set(RIFTFIRE.tileSize * 1.35, RIFTFIRE.tileSize * 2.025, 1)
      sprite.visible = false; this.root.add(sprite); this.sprites.push(sprite)
      const tile = new T.Mesh(this.geometry, this.warning); tile.rotation.x = -Math.PI / 2; tile.visible = false
      this.root.add(tile); this.tiles.push(tile)
    }
  }
  static async create() {
    let texture: T.Texture
    try { texture = await new T.TextureLoader().loadAsync(RIFTFIRE.url) }
    catch (cause) { throw new Error('The Riftfire animation could not load. Reload the page and try again.', { cause }) }
    texture.minFilter = texture.magFilter = T.NearestFilter; texture.generateMipmaps = false; texture.colorSpace = T.SRGBColorSpace
    try { return new RiftfireView(texture) } catch (error) { texture.dispose(); throw error }
  }
  update(encounter: MonsterEncounter, reducedMotion: boolean) {
    const cast = encounter.cast, window = encounter.window()
    const visible = cast?.id === 'riftfire-rain' && (window === 'preparation' || window === 'active')
    this.warning.color.set(window === 'active' ? '#e94d2f' : '#e8a847')
    for (let index = 0; index < RIFTFIRE.count; index++) {
      const sprite = this.sprites[index], tile = this.tiles[index], point = visible ? cast.fireTiles[index] : undefined
      tile.visible = !!point; sprite.visible = false
      if (!point || !cast) continue
      tile.position.set(point.x, .012, point.z); sprite.position.set(point.x, .018, point.z)
      if (window !== 'active') continue
      const spec = ATTACKS['riftfire-rain'], frame = fireFrame(cast.elapsed - spec.preparation, spec.active, index, reducedMotion)
      sprite.visible = frame >= 0
      if (frame >= 0 && this.maps[index].userData.fireFrame !== frame) {
        this.maps[index].offset.set((frame % RIFTFIRE.columns) / RIFTFIRE.columns, 1 - (Math.floor(frame / RIFTFIRE.columns) + 1) / RIFTFIRE.rows)
        this.maps[index].userData.fireFrame = frame
      }
    }
  }
  dispose() {
    this.root.removeFromParent(); this.geometry.dispose(); this.warning.dispose()
    for (const sprite of this.sprites) (sprite.material as T.SpriteMaterial).dispose()
    this.maps.forEach(map => map.dispose()); this.atlas.dispose(); this.root.clear()
  }
}
