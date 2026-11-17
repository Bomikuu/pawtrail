import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { ATTACKS, HEADS, VAELRITH, headX, type HeadId } from './vaelrith'
import type { MonsterEncounter } from './encounter'
import { sampleBossMotion } from './motion'

type Materials = Record<'armor' | 'throat' | 'stone' | 'horn' | 'dark' | 'gold' | 'glow' | 'cyan' | 'ivory', T.Material>
type Neck = { id: HeadId; links: T.Group[]; head: T.Group; jaw: T.Group; glow: T.Mesh; throat: T.Object3D; home: T.Vector3[]; tip: T.Vector3; seal: T.Mesh }
const vector = (x: number, y: number, z: number) => new T.Vector3(x, y, z)
const up = vector(0, 1, 0)

/** Articulated volume: the source textures wrap real necks, skulls and jaws. */
export class VaelrithRig {
  readonly root = new T.Group()
  readonly necks: Neck[] = []
  private materials: Materials
  private geometries = new Set<T.BufferGeometry>()
  private textures: T.Texture[]
  private posedAt: number | null = null
  private constructor(textures: T.Texture[], private full3d = false) {
    this.textures = textures; this.root.name = VAELRITH.id
    const textured = (map: T.Texture, color = '#ffffff') => new T.MeshLambertMaterial({ map, color, flatShading: true, toneMapped: false })
    const solid = (color: string) => new T.MeshLambertMaterial({ color, flatShading: true, toneMapped: false })
    const surface = (color: string, roughness: number, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness })
    this.materials = full3d ? {
      // The same rig with actual light-driven surfaces, not painted highlights.
      armor: surface('#493253', .44, .24), throat: surface('#9863ad', .58, .1),
      stone: surface('#746b78', .95), horn: surface('#291f35', .38, .15),
      dark: surface('#180f22', .96), gold: surface('#c9a362', .3, .65), ivory: surface('#f2e2c9', .42),
      glow: new T.MeshStandardMaterial({ color: '#ee58f3', emissive: '#e929ed', emissiveIntensity: 1.8, roughness: .25 }),
      cyan: new T.MeshStandardMaterial({ color: '#62dccd', emissive: '#37c4c3', emissiveIntensity: .9, roughness: .3 }),
    } : {
      armor: textured(textures[0]), throat: textured(textures[1]), stone: textured(textures[2]), horn: textured(textures[3]),
      dark: solid('#211329'), gold: solid('#bfa06b'), ivory: solid('#ead9c9'),
      glow: new T.MeshBasicMaterial({ color: '#f45eff', toneMapped: false }),
      cyan: new T.MeshBasicMaterial({ color: '#62dccd', toneMapped: false }),
    }
    this.wall()
    for (const id of HEADS) this.necks.push(this.neck(id))
    if (full3d) this.root.traverse(node => { if (node instanceof T.Mesh) { node.castShadow = true; node.receiveShadow = true } })
  }
  static createFull3D() { return new VaelrithRig([], true) }
  static async create() {
    const loader = new T.TextureLoader(), textures: T.Texture[] = []
    try {
      // Settle every load before cleanup; a failed sibling must not leak late textures.
      const results = await Promise.allSettled(['armor', 'throat', 'stone', 'horn'].map(async key => {
        let texture: T.Texture
        try { texture = await loader.loadAsync(VAELRITH.assets + key + '.png') }
        catch (cause) { throw new Error(`The boss ${key} texture could not load. Reload the page and try again.`, { cause }) }
        texture.magFilter = texture.minFilter = T.NearestFilter; texture.colorSpace = T.SRGBColorSpace
        texture.generateMipmaps = false; textures.push(texture); return texture
      }))
      const failed = results.find(r => r.status === 'rejected')
      if (failed?.status === 'rejected') throw failed.reason
      return new VaelrithRig(results.map(r => (r as PromiseFulfilledResult<T.Texture>).value))
    } catch (error) { textures.forEach(t => t.dispose()); throw error }
  }
  private mesh(name: string, geometry: T.BufferGeometry, material: keyof Materials, parent: T.Object3D, at: T.Vector3, scale?: T.Vector3) {
    this.geometries.add(geometry)
    const mesh = new T.Mesh(geometry, this.materials[material]); mesh.name = name; mesh.position.copy(at)
    if (scale) mesh.scale.copy(scale)
    parent.add(mesh); return mesh
  }
  private box(name: string, parent: T.Object3D, material: keyof Materials, at: T.Vector3, size: T.Vector3, radius = .06) {
    return this.mesh(name, new RoundedBoxGeometry(size.x, size.y, size.z, 2, radius), material, parent, at)
  }
  private spike(name: string, parent: T.Object3D, start: T.Vector3, end: T.Vector3, radius: number, material: keyof Materials = 'armor') {
    const delta = end.clone().sub(start)
    const mesh = this.mesh(name, new T.ConeGeometry(radius, delta.length(), this.full3d ? 10 : 5), material, parent, start.clone().add(end).multiplyScalar(.5))
    mesh.quaternion.setFromUnitVectors(up, delta.normalize()); return mesh
  }
  private plate(name: string, parent: T.Object3D, at: T.Vector3, width: number, height: number, material: keyof Materials = 'armor') {
    const shape = new T.Shape(); shape.moveTo(-width / 2, height * .35); shape.lineTo(0, height * .55)
    shape.lineTo(width / 2, height * .35); shape.lineTo(width * .36, -height * .2); shape.lineTo(0, -height * .55); shape.lineTo(-width * .36, -height * .2); shape.closePath()
    const geometry = new T.ExtrudeGeometry(shape, { depth: .11, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .025, bevelThickness: .02 })
    // ExtrudeGeometry UVs are world-space. Normalize to the generated material tile.
    const uv = geometry.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + width / 2) / width, (uv.getY(i) + height / 2) / height)
    return this.mesh(name, geometry, material, parent, at)
  }
  private wall() {
    const wall = new T.Group(); wall.name = 'fixed-sanctuary-wall'; this.root.add(wall)
    // Low structural wall is the blocker. Socket crowns rise above it independently.
    this.box('wall-foundation', wall, 'dark', vector(0, .52, -.55), vector(15, 1.04, 1.1))
    for (let row = 0; row < 3; row++) for (let col = 0; col < 15; col++) {
      const x = col - 7 + (row % 2 ? .2 : 0), y = .24 + row * .46
      const stone = this.box(`stone-${row}-${col}`, wall, 'stone', vector(x, y, -.42), vector(.96, .42, .94), .035)
      const uv = stone.geometry.getAttribute('uv')
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (col + uv.getX(i)) / 15, (row + uv.getY(i)) / 3)
    }
    for (const x of [-7.1, -2.1, 2.1, 7.1]) {
      this.box('buttress', wall, 'stone', vector(x, 1.14, -.55), vector(.56, 2.28, 1.45))
      for (const y of [.3, 1.7, 2.3]) this.box('gold-cap', wall, 'gold', vector(x, y, -.51), vector(.72, .12, 1.55), .025)
      const gem = this.mesh('wall-rift', new T.OctahedronGeometry(.21), 'glow', wall, vector(x, 1.25, .22)); gem.scale.y = 1.5
    }
    for (const id of HEADS) {
      const rim = this.mesh(id + '-socket-rim', new T.TorusGeometry(.69, .13, 5, 14, Math.PI), 'gold', wall, vector(headX[id], 1.45, -.18))
      rim.rotation.x = -.1
      this.box(id + '-socket-shadow', wall, 'dark', vector(headX[id], 1.45, -.44), vector(1.4, 1.2, .35))
    }
    for (let i = 0; i < 14; i++) {
      const rock = this.mesh('rubble-' + i, new T.DodecahedronGeometry(.16 + (i % 3) * .06, 0), 'stone', wall, vector(-7 + i * 1.05, .12, .4 + (i % 2) * .2))
      rock.rotation.set(i * .3, i * .7, .4)
    }
  }
  private neck(id: HeadId): Neck {
    const x = headX[id], side = id === 'left' ? -1 : id === 'right' ? 1 : 0
    const home = [vector(x, 1.4, -.35), vector(x + side * .7, 2.55, -.1), vector(x + side * 1.1, 3.9, .12), vector(x + side * .85, 5.15, .65), vector(x + side * .25, side ? 5.85 : 6.65, 1.05)]
    if (!side) { home[1].y += .3; home[2].y += .6; home[3].y += .7 }
    const links: T.Group[] = []
    for (let i = 0; i < 4; i++) {
      const link = new T.Group(); link.name = `${id}-neck-${i}`; this.root.add(link); links.push(link)
      const radius = (.58 - i * .035) * (id === 'center' ? 1.15 : 1)
      this.mesh('neck-volume', new T.CylinderGeometry(radius * .92, radius, 1.12, this.full3d ? 18 : 9), 'armor', link, vector(0, .56, 0))
      for (let band = 0; band < 2; band++) {
        this.plate('belly-scale', link, vector(0, .22 + band * .53, radius * .84), radius * 1.42, .64, 'throat')
        this.spike('dorsal-spine', link, vector(0, .5 + band * .45, -radius * .72), vector(0, 1.06 + band * .45, -radius - .5), .23)
      }
      const seam = this.mesh('cyan-armor-seam', new T.TorusGeometry(radius * .95, .014, 3, 9), 'cyan', link, vector(0, .94, 0)); seam.rotation.x = Math.PI / 2
    }
    const head = new T.Group(); head.name = id + '-head'; this.root.add(head)
    if (id === 'center') head.scale.setScalar(1.18)
    this.mesh('skull', new T.SphereGeometry(1, this.full3d ? 24 : 10, this.full3d ? 16 : 7), 'armor', head, vector(0, .14, .1), vector(.73, .65, .83))
    this.box('upper-snout', head, 'armor', vector(0, -.08, .72), vector(.91, .42, .94), .15)
    this.box('mouth-cavity', head, 'dark', vector(0, -.32, .79), vector(.79, .45, .68), .1)
    const glow = this.mesh('exposed-throat', new T.SphereGeometry(.3, 9, 6), 'glow', head, vector(0, -.35, .66), vector(1, .8, .5))
    const throat = new T.Object3D(); throat.name = 'hurt-throat'; throat.position.set(0, -.35, 1); head.add(throat)
    const jaw = new T.Group(); jaw.name = id + '-jaw'; jaw.position.set(0, -.27, .18); head.add(jaw)
    this.box('lower-jaw', jaw, 'throat', vector(0, -.22, .51), vector(.83, .23, 1.13), .09)
    this.plate('chin-armor', jaw, vector(0, -.32, .91), .8, .6)
    for (let i = 0; i < 6; i++) for (const direction of [-1, 1]) {
      const z = .32 + i * .14, tooth = .18 + (i % 2) * .08
      this.spike('upper-tooth', head, vector(direction * .36, -.23, z + .16), vector(direction * .31, -.23 - tooth, z + .2), .07, 'ivory')
      this.spike('lower-tooth', jaw, vector(direction * .31, -.1, z), vector(direction * .26, .1 + tooth * .35, z + .02), .065, 'ivory')
    }
    for (const direction of [-1, 1]) {
      const eye = this.plate('magenta-eye', head, vector(direction * .49, .21, .76), .38, .16, 'glow'); eye.rotation.z = direction * -.23
      const brow = this.plate('heavy-brow', head, vector(direction * .49, .38, .75), .62, .27); brow.rotation.z = direction * -.27
      for (let i = 0; i < 3; i++) {
        const a = vector(direction * (.52 + i * .1), .35 - i * .3, -.12 - i * .12)
        this.spike('swept-cheek-horn', head, a, vector(direction * (1.07 + i * .16), .8 - i * .35, -.64 - i * .13), .22 - i * .025)
      }
      this.spike('horn-base', head, vector(direction * .43, .61, -.19), vector(direction * .83, 1.13, -.43), .25)
      this.spike('horn-tip', head, vector(direction * .83, 1.13, -.43), vector(direction * 1.04, 1.45, -.91), .16, 'horn')
      this.spike('jaw-prong', head, vector(direction * .44, -.25, .25), vector(direction * .95, -.58, -.22), .16)
    }
    for (let i = 0; i < 4; i++) {
      const plate = this.plate('crown-plate-' + i, head, vector(0, .57 + i * .15, .64 - i * .3), .59 - i * .06, .56)
      plate.rotation.x = -.38
      this.spike('crown-spine-' + i, head, vector(0, .69 + i * .13, .4 - i * .32), vector(0, 1.05 + i * .12, .12 - i * .37), .16)
    }
    const seal = this.mesh(id + '-seal', new T.OctahedronGeometry(.24), 'glow', this.root, vector(x, 1.25, .51)); seal.scale.y = 1.4
    return { id, links, head, jaw, glow, throat, home, tip: home[4].clone(), seal }
  }
  pose(time: number, encounter: MonsterEncounter, reducedMotion: boolean) {
    const cast = encounter.cast, window = encounter.window(), attack = cast && ATTACKS[cast.id]
    const defeat = encounter.hp <= 0
    const deathProgress = defeat ? Math.min(1, encounter.deathElapsed / 1200) : 0
    const deathEase = deathProgress * deathProgress * (3 - 2 * deathProgress)
    const first = this.posedAt === null || time < this.posedAt
    const delta = first ? 0 : Math.max(0, time - this.posedAt!)
    const blend = first ? 1 : delta ? (reducedMotion ? 1 : 1 - Math.exp(-delta / 55)) : 0
    this.posedAt = time
    for (const neck of this.necks) {
      const involved = attack && (attack.head === neck.id || attack.head === 'all')
      const points = neck.home.map(p => p.clone())
      const phase = HEADS.indexOf(neck.id) * .9
      const wave = reducedMotion || defeat ? 0 : Math.sin(time * .0018 + phase) * .085
      const motion = sampleBossMotion(involved && cast ? cast.id : null, cast?.elapsed ?? 0)
      let lower = motion.lower
      if (window === 'stagger') lower = .9
      if (defeat) lower = .94 * deathEase
      const tip = points[4], home = neck.home[4]
      tip.y = T.MathUtils.lerp(home.y, 1.35, lower) + motion.lift + wave
      tip.z += motion.back + motion.reach * 1.8 + lower * 1.4
      tip.x += wave * .65
      if (!reducedMotion && encounter.hurtHead === neck.id && encounter.clock < encounter.hurtUntil && !defeat) {
        const p = 1 - (encounter.hurtUntil - encounter.clock) / 220
        tip.z -= Math.sin(Math.PI * p) * .15
      }
      if (involved && cast?.id === 'rift-fang') {
        tip.x = T.MathUtils.lerp(tip.x, cast.aim.x, motion.aimMix)
        tip.y = T.MathUtils.lerp(tip.y, 1.2, motion.aimMix); tip.z = T.MathUtils.lerp(tip.z, cast.aim.z, motion.aimMix)
      }
      if (involved && cast?.id === 'obsidian-sweep') {
        tip.x = T.MathUtils.lerp(tip.x, motion.sweepX, motion.sweepMix)
        tip.y = T.MathUtils.lerp(tip.y, 1.3, motion.sweepMix); tip.z = T.MathUtils.lerp(tip.z, 2.6, motion.sweepMix)
      }
      neck.tip.lerp(tip, blend); tip.copy(neck.tip)
      // Four linked volumes form the same continuous neck while its tip descends.
      for (let i = 1; i < 4; i++) {
        const ratio = i / 4
        points[i].x += (tip.x - home.x) * ratio * ratio
        points[i].y += (tip.y - home.y) * ratio * ratio
        points[i].z += (tip.z - home.z) * ratio * ratio
        if (!reducedMotion && !defeat) points[i].x += Math.sin(time * .0018 + phase - i * .42) * .065 * ratio * (1 - ratio)
      }
      for (let i = 0; i < 4; i++) {
        const delta = points[i + 1].clone().sub(points[i])
        neck.links[i].position.copy(points[i]); neck.links[i].quaternion.setFromUnitVectors(up, delta.clone().normalize())
        neck.links[i].scale.y = delta.length() / 1.05
      }
      neck.head.position.copy(tip)
      const yaw = neck.id === 'left' ? .38 : neck.id === 'right' ? -.38 : 0
      neck.head.rotation.set(defeat ? .08 + .57 * deathEase : .08 + motion.pitch + wave * .6, yaw + wave * .35, defeat ? (neck.id === 'left' ? -.18 : .18) * deathEase : wave * .3)
      const jaw = defeat ? .27 + .35 * deathEase : window === 'stagger' ? .72 : motion.jaw + wave * .25
      neck.jaw.rotation.x = T.MathUtils.lerp(neck.jaw.rotation.x, jaw, blend)
      const glow = encounter.exposed(neck.id) ? 1.2 : .85
      neck.glow.scale.set(glow, glow * .8, glow * .5)
      neck.glow.visible = !defeat
      neck.seal.visible = !defeat
      const sealScale = encounter.sealExposed() ? 1.4 : 1
      neck.seal.scale.set(sealScale, sealScale * 1.4, sealScale)
    }
    this.root.updateMatrixWorld(true)
  }
  throatPosition(id: HeadId) { return this.necks.find(n => n.id === id)!.throat.getWorldPosition(new T.Vector3()) }
  sealPosition(id: HeadId) { return this.necks.find(n => n.id === id)!.seal.getWorldPosition(new T.Vector3()) }
  dispose() {
    this.root.removeFromParent(); this.geometries.forEach(g => g.dispose())
    Object.values(this.materials).forEach(m => m.dispose()); this.textures.forEach(t => t.dispose())
  }
}
