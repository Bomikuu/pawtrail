import * as T from 'three'
import { familyAreaShape, type FamilyEncounter } from './family-encounter'
import type { FamilyCreature } from './family-catalog'

/** The same parameterized sector/ring/disk data supplies the mesh and contact. */
export class FamilyFields {
  readonly root = new T.Group()
  private views = new Map<string, T.Mesh<T.RingGeometry, T.MeshBasicMaterial>>()
  private borders: T.LineSegments<T.BufferGeometry, T.LineBasicMaterial>[] = []
  constructor(creature: FamilyCreature) {
    for (const enraged of creature.tier === 'mini-boss' ? [false, true] : [false]) for (const skill of creature.skills) {
      const { inner, outer, angle } = familyAreaShape(skill, enraged), sector = skill.shape === 'sector', start = sector ? -angle / 2 : 0, ratio = inner / outer
      const geometry = new T.RingGeometry(ratio, 1, 64, 1, start, angle)
      const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ color: '#f4c46b', transparent: true, opacity: .3, depthWrite: false, side: T.DoubleSide, toneMapped: false }))
      const points: number[] = []
      for (let i = 0; i < 64; i++) {
        const a = start + i * angle / 64, b = start + (i + 1) * angle / 64
        for (const r of ratio > 0 ? [ratio, 1] : [1]) points.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0)
      }
      if (sector) for (const a of [start, start + angle]) points.push(0, 0, 0, Math.cos(a), Math.sin(a), 0)
      const lines = new T.BufferGeometry(); lines.setAttribute('position', new T.Float32BufferAttribute(points, 3))
      const border = new T.LineSegments(lines, new T.LineBasicMaterial({ color: '#ffe5ac', transparent: true, opacity: .9, depthWrite: false, toneMapped: false }))
      mesh.add(border); mesh.visible = false; mesh.renderOrder = 1
      this.root.add(mesh); this.views.set(skill.id + ':' + enraged, mesh); this.borders.push(border)
    }
  }
  update(encounter: FamilyEncounter, reduced: boolean) {
    for (const mesh of this.views.values()) mesh.visible = false
    const area = encounter.areas()[0], skill = encounter.cast?.skill
    if (!area || !skill) return
    const mesh = this.views.get(skill.id + ':' + encounter.enraged)!
    mesh.visible = true; mesh.position.set(area.x, -.012, area.z); mesh.scale.setScalar(area.outer)
    mesh.rotation.set(-Math.PI / 2, 0, area.kind === 'sector' ? area.facing - Math.PI / 2 : 0)
    mesh.material.color.set(area.active ? '#dd8264' : '#f4c46b')
    mesh.material.opacity = area.active ? .55 : reduced ? .32 : .3 + Math.sin(encounter.clock / 130) * .04
  }
  dispose() {
    this.root.removeFromParent()
    for (const mesh of this.views.values()) { mesh.geometry.dispose(); mesh.material.dispose() }
    for (const border of this.borders) { border.geometry.dispose(); border.material.dispose() }
    this.views.clear(); this.root.clear()
  }
}
