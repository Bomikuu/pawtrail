import * as T from 'three'
import { REAPER_RULES, type ReaperEncounter } from './reaper-encounter'

/** Preallocated exact sector/ring warnings, from the same definitions as damage. */
export class ReaperFields {
  readonly root = new T.Group()
  private meshes: T.Mesh<T.RingGeometry, T.MeshBasicMaterial>[] = []
  private borders: T.LineSegments[] = []
  constructor() {
    for (const state of [REAPER_RULES.normal, REAPER_RULES.enraged]) for (const kind of ['sector', 'ring'] as const) {
      const angle = kind === 'sector' ? state.arcAngle * Math.PI / 180 : Math.PI * 2
      const geometry = new T.RingGeometry(kind === 'ring' ? state.ringInner / state.ringOuter : 0, 1, 72, 1, kind === 'sector' ? -angle / 2 : 0, angle)
      const mesh = new T.Mesh(geometry, new T.MeshBasicMaterial({ color: '#edbb67', transparent: true, opacity: .28, depthWrite: false, side: T.DoubleSide, toneMapped: false }))
      mesh.rotation.x = -Math.PI / 2; mesh.visible = false; mesh.position.y = -.012
      const lines: number[] = []
      const edge = (r: number, a: number, b: number) => lines.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0)
      const start = kind === 'sector' ? -angle / 2 : 0
      for (let i = 0; i < 72; i++) { const a = start + i * angle / 72, b = start + (i + 1) * angle / 72; edge(1, a, b); if (kind === 'ring') edge(state.ringInner / state.ringOuter, a, b) }
      if (kind === 'sector') for (const a of [-angle / 2, angle / 2]) lines.push(0, 0, 0, Math.cos(a), Math.sin(a), 0)
      const borderGeometry = new T.BufferGeometry(); borderGeometry.setAttribute('position', new T.Float32BufferAttribute(lines, 3))
      const border = new T.LineSegments(borderGeometry, new T.LineBasicMaterial({ color: '#ffe1a0', transparent: true, opacity: .8, depthWrite: false, toneMapped: false }))
      mesh.add(border); this.borders.push(border); this.meshes.push(mesh); this.root.add(mesh)
    }
  }
  update(encounter: ReaperEncounter, reduced: boolean) {
    this.meshes.forEach(mesh => { mesh.visible = false })
    const area = encounter.areas()[0]
    if (!area) return
    const index = (encounter.enraged ? 2 : 0) + (area.kind === 'ring' ? 1 : 0), mesh = this.meshes[index]
    mesh.visible = true; mesh.position.set(area.x, -.012, area.z); mesh.scale.setScalar(area.outer)
    mesh.rotation.set(-Math.PI / 2, 0, area.kind === 'sector' ? area.facing - Math.PI / 2 : 0)
    mesh.material.color.set(area.active ? '#ae8aff' : '#edbb67'); mesh.material.opacity = area.active ? .5 : reduced ? .3 : .26 + Math.sin(encounter.clock / 120) * .04
    ;(this.borders[index].material as T.LineBasicMaterial).color.set(area.active ? '#d5c2ff' : '#ffe1a0')
  }
  dispose() { this.root.removeFromParent(); for (const mesh of this.meshes) { mesh.geometry.dispose(); mesh.material.dispose() } for (const border of this.borders) { border.geometry.dispose(); (border.material as T.Material).dispose() } this.root.clear() }
}
