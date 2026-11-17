import * as T from 'three'
import { createRescuer, type Rig } from './rigs'
import type { ActorAppearance } from './appearance'
import { refinedModelKit } from './refined-model-kit'
import { miraTexture, type MiraSurface } from './mira-textures'

/** The actual common body, not an archived/replaced or billboard body. */
export function createMira(appearance: ActorAppearance): Rig {
  const base = createRescuer(appearance)
  const C = appearance.colors
  base.root.name = 'MiraAdlerSharedBody'
  const get = (name: string) => {
    const node = base.root.getObjectByName(name)
    if (!node) throw Error('Mira’s shared rig is missing ' + name)
    return node
  }
  const maps = new Map<MiraSurface, T.Texture>()
  const texture = (surface: MiraSurface) => {
    if (!maps.has(surface)) maps.set(surface, miraTexture(surface))
    return maps.get(surface)!
  }
  const originals = new Set<T.Material>()
  const replacements = new Map<string, T.MeshBasicMaterial>()
  const paint = (mesh: T.Mesh, surface?: MiraSurface, color = '#ffffff') => {
    const source = mesh.material as T.MeshBasicMaterial
    originals.add(source)
    const key = source.uuid + ':' + (surface ?? color)
    if (!replacements.has(key)) {
      const material = source.clone()
      material.map = surface ? texture(surface) : null
      material.color.set(color)
      replacements.set(key, material)
    }
    mesh.material = replacements.get(key)!
  }
  // Dress the existing geometry using its original UVs. Retain normal limbs.
  base.root.traverse(node => {
    if (!(node instanceof T.Mesh)) return
    const name = node.name
    if (/^(TunicTorso|TunicCollar|TunicFrontSeam|HemFabric|HemEdge|CargoPocket|ShortsOuterSeam|ShortsTopFold|ShirtFoldLight|ShirtHemShade)_/.test(name)) {
      node.visible = false
    } else if (/Hair|Fringe/.test(name) && (node.material as T.MeshBasicMaterial).map?.userData.actorKey) {
      paint(node, 'hair')
    } else if (/^(TealShirt|ContinuousShortsWaist|Belt)_/.test(name)) {
      paint(node, 'suit')
    } else if (/^(CargoShorts|Shin)_/.test(name)) {
      paint(node, 'stocking')
    } else if (/^(JacketSleeve|SleeveEdgeLight)_/.test(name)) {
      paint(node, undefined, C.skin)
    } else if (/^(Boot|BootCuff|BootToeLight)_/.test(name)) {
      paint(node, undefined, C.shoe)
    }
  })
  // Keep displaced materials reachable for normal rig disposal, including the
  // common hair-map reference counts. This is not a hidden duplicate body.
  const keeper = new T.Mesh(new T.BufferGeometry(), [...originals])
  keeper.name = 'MiraOriginalMaterialKeeper'; keeper.visible = false; base.root.add(keeper)
  const kit = refinedModelKit(texture)
  const { group, mesh, round, volume } = kit
  const head = get('Head'), chest = get('ChestBreath'), spine = get('SpineBend')
  const ears: { node: T.Group; angle: number; phase: number }[] = []
  for (const side of [-1, 1]) {
    const ear = group('MiraRabbitEar_' + side, head, side * 1.7, 5.1, -.2)
    const angle = side < 0 ? .13 : -.85
    ear.rotation.z = angle
    ears.push({ node: ear, angle, phase: side * .4 })
    volume('MiraEarVolume', ear, [[-1.1,0],[1,0],[2,7.6],[.1,13],[-1.9,7.1]], .8, C.ink, 'ear')
    const rim = volume('MiraBronzeEarInlay', ear, [[-.55,1.5],[.55,1.4],[1.2,7.3],[.15,10.5],[-1.15,7]], .12, C.gold)
    rim.position.z = .57
    const inset = volume('MiraDarkEarInterior', ear, [[-.18,2.5],[.3,2.4],[.65,6.9],[.12,8.6],[-.65,6.7]], .12, C.ink)
    inset.position.z = .68
  }
  const bow = group('MiraCollarBow', chest, 0, 5.4, 3.5)
  for (const side of [-1, 1]) volume('MiraBowWing', bow, [[0,0],[side*1.7,1],[side*2,-.8],[0,-.3]], .45, C.ink, 'suit')
  const jewel = mesh('MiraBowBronzePin', bow, new T.OctahedronGeometry(.7), C.gold)
  jewel.position.z = .65
  for (const side of ['Left', 'Right']) {
    const wrist = get('Wrist' + side)
    const cuff = mesh('MiraWhiteWristCuff', wrist, new T.CylinderGeometry(1.65,1.6,1.35,12), C.cream, 'cuff')
    cuff.position.y = .65
    round('MiraCuffPin', wrist, C.gold, 0, .65, 1.7, .27,.3,.16)
    const tail = get('LongHairSideTail_' + (side === 'Left' ? -1 : 1))
    const sign = side === 'Left' ? -1 : 1
    const path = new T.CatmullRomCurve3([
      new T.Vector3(0,-2.5,0), new T.Vector3(sign*1.5,-5,.4),
      new T.Vector3(sign*3.6,-6.5,.8), new T.Vector3(sign*5.6,-5.7,1.2),
      new T.Vector3(sign*5.4,-3.8,1.4), new T.Vector3(sign*3.6,-3.5,1.35),
    ])
    mesh('MiraCurledHairTip', tail, new T.TubeGeometry(path,24,.65,8,false), C.hair, 'hair')
  }
  // Reference prop only. It gains no weapon abilities or damage authority.
  const stowed = group('MiraStowedReferenceProp', spine, 0, 7.5, -7.3)
  stowed.rotation.z = -.75
  const prop = group('MiraCarbine', stowed)
  const receiver = mesh('MiraPropReceiver', prop, new T.BoxGeometry(9,2.2,1.65), C.ink, 'metal')
  receiver.position.x = .8
  const barrel = mesh('MiraPropBarrel', prop, new T.CylinderGeometry(.5,.5,6,8), C.metalShade)
  barrel.rotation.z = Math.PI / 2; barrel.position.x = 8
  const stock = mesh('MiraPropStock', prop, new T.BoxGeometry(3.8,2.8,1.9), C.metalShade, 'metal')
  stock.position.x = -5.2
  const grip = mesh('MiraPropGrip', prop, new T.BoxGeometry(1.1,2.9,1.25), C.ink)
  grip.position.set(-1,-1.8,0); grip.rotation.z = -.2
  const held = group('MiraHeldReferenceProp', get('WristRight'), 0,-.6,1.5)
  held.add(prop.clone(true)); held.rotation.z = .3; held.visible = false
  const hairTails = ['LongHairBackTail', 'LongHairSideTail_-1', 'LongHairSideTail_1'].map(get)
  base.nodes.push(bow, stowed, held, ...ears.map(e => e.node))
  return {
    ...base,
    pose(action, phase, layers) {
      base.pose(action, phase, layers)
      const t = (layers?.secondaryMotion?.phase ?? phase) * Math.PI * 2
      const resting = ['sleep', 'lie_down'].includes(action)
      const seated = ['sit', 'float', 'ride'].includes(action)
      // Cosmetic lengths adapt to the same shared sitting/sleeping contacts.
      for (const tail of hairTails) tail.scale.y = resting ? 1.05 : seated ? 1.5 : 2.05
      for (const ear of ears) ear.node.rotation.z = ear.angle + Math.sin(t + ear.phase) * .012
      stowed.visible = !resting && action !== 'hold_item'
      held.visible = action === 'hold_item'
      if (held.visible) {
        const parcel = base.root.getObjectByName('HeldSupplies')
        if (parcel) parcel.scale.setScalar(.0001)
      }
    },
  }
}
