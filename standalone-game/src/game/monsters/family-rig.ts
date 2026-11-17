import * as T from 'three'
import { familyAssets, type BossFamily, type FamilyCreature } from './family-catalog'
import type { FamilyEncounter } from './family-encounter'

type NativeManifest = { atlas: string; cellWidth: number; cellHeight: number; columns: number; rows: number; baseline: number; contentHeight: number; poses: Record<string, number> }
/** Authored full-frame poses, registered to one baseline; no stretched boss art. */
export class FamilyRig {
  readonly root = new T.Group()
  private sprite: T.Sprite
  static async create(family: BossFamily, creature: FamilyCreature) {
    const base = familyAssets(family, creature), response = await fetch(base + 'manifest.json')
    if (!response.ok) throw new Error(`${family.name} family manifest could not load (${response.status}).`)
    const manifest: NativeManifest = await response.json()
    const texture = await new T.TextureLoader().loadAsync(base + manifest.atlas)
    texture.magFilter = texture.minFilter = T.NearestFilter; texture.generateMipmaps = false
    texture.colorSpace = T.SRGBColorSpace; texture.repeat.set(1 / manifest.columns, 1 / manifest.rows)
    return new FamilyRig(creature, manifest, texture)
  }
  private constructor(private creature: FamilyCreature, private manifest: NativeManifest, private texture: T.Texture) {
    const material = new T.SpriteMaterial({ map: texture, transparent: true, alphaTest: .5, depthWrite: true, toneMapped: false })
    this.sprite = new T.Sprite(material)
    this.sprite.center.set(.5, 1 - manifest.baseline / manifest.cellHeight)
    this.root.add(this.sprite); this.frame('idle', false)
  }
  private frame(pose: string, enraged: boolean) {
    const row = enraged && this.creature.enragedRow !== null ? this.creature.enragedRow : this.creature.row
    const col = this.manifest.poses[pose] ?? 0
    this.texture.offset.set(col / this.manifest.columns, 1 - (row + 1) / this.manifest.rows)
  }
  pose(_time: number, encounter: FamilyEncounter, reduced: boolean) {
    this.frame(encounter.frame, encounter.enraged)
    const body = this.creature.height * this.manifest.cellHeight / this.manifest.contentHeight
    const breath = encounter.running && !reduced ? Math.sin(encounter.clock / 420) * .006 : 0
    const state = encounter.window(), swing = state === 'striking' ? Math.sin((encounter.cast!.elapsed - encounter.cast!.skill.windup) / encounter.cast!.skill.active * Math.PI) : 0
    this.sprite.scale.set(body * (1 - breath), body * (1 + breath), 1)
    this.sprite.position.set(reduced ? 0 : swing * Math.sin(encounter.facing) * .1, 0, reduced ? 0 : swing * Math.cos(encounter.facing) * .1)
    this.sprite.material.rotation = reduced ? 0 : state === 'warning' ? -.025 : state === 'striking' ? .055 * swing : encounter.moving ? Math.sin(encounter.clock / 110) * .012 : 0
    this.sprite.material.opacity = encounter.hp <= 0 ? Math.max(0, 1 - encounter.deathElapsed / 1000) : 1
    if (encounter.hp <= 0) this.sprite.scale.y *= Math.max(.12, 1 - encounter.deathElapsed / 1300)
  }
  dispose() { this.root.removeFromParent(); this.texture.dispose(); this.sprite.material.dispose(); this.root.clear() }
}
