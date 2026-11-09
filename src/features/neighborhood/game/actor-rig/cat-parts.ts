import * as T from 'three'
import type { PartKit } from './part-kit'
import type { CatOptions } from './cat-appearance'

/** A crisp, low-resolution coat painted onto surfaces, rather than buried marks. */
export function catCoat(mesh: T.Mesh, colors: Record<string, string>, options: Required<CatOptions>, region: 'body' | 'head') {
  const canvas = document.createElement('canvas')
  canvas.width = 32; canvas.height = 16
  const paint = canvas.getContext('2d')!
  paint.imageSmoothingEnabled = false
  paint.fillStyle = colors.orange; paint.fillRect(0, 0, 32, 16)
  const block = (color: string, x: number, y: number, w: number, h: number) => {
    paint.fillStyle = color; paint.fillRect(x, y, w, h)
  }
  if (options.pattern === 'mackerel' || options.pattern === 'classic-tabby') {
    for (let x = 1; x < 32; x += 6) {
      block(colors.stripe, x, 3, 2, 5)
      block(colors.stripe, x + 1, 8, 2, 4)
      block(colors.furLight, x + 3, 4, 1, 6)
    }
    if (options.pattern === 'classic-tabby') {
      for (const x of [4, 20]) {
        block(colors.stripe, x, 4, 7, 2); block(colors.stripe, x, 6, 2, 6)
        block(colors.stripe, x, 11, 7, 2); block(colors.stripe, x + 5, 7, 2, 4)
      }
    }
  } else if (options.pattern === 'spotted') {
    for (const [x, y] of [[2, 4], [9, 7], [16, 3], [23, 9], [29, 5], [5, 12], [18, 12]]) block(colors.stripe, x, y, 3, 2)
  } else if (options.pattern === 'calico') {
    block(colors.cream, 0, 0, 32, 16)
    block(colors.orange, 1, 3, 9, 7); block(colors.orange, 24, 0, 8, 8)
    block(colors.ink, 13, 2, 7, 8); block(colors.ink, 22, 11, 9, 5)
    block(colors.orange, 3, 11, 7, 5)
  } else if (options.pattern === 'bicolor') {
    block(colors.cream, 0, 11, 32, 5)
    if (region === 'head') { block(colors.cream, 7, 7, 4, 9); block(colors.cream, 8, 4, 2, 5) }
  } else if (options.pattern === 'colorpoint' && region === 'head') {
    block(colors.stripe, 2, 4, 14, 10)
    block(colors.stripe, 4, 2, 10, 3)
    block(colors.stripe, 16, 6, 2, 6)
  }
  // A few deliberate tufts retain detail on solid-colored coats too.
  for (const [x, y] of [[2, 2], [18, 1], [25, 5]]) block(colors.furLight, x, y, 2, 1)
  const texture = new T.CanvasTexture(canvas)
  texture.magFilter = T.NearestFilter; texture.minFilter = T.NearestFilter
  texture.colorSpace = T.SRGBColorSpace; texture.generateMipmaps = false
  texture.userData.catCoat = true
  mesh.material = new T.MeshBasicMaterial({ color: '#ffffff', map: texture, vertexColors: true, toneMapped: false })
  return mesh
}

export function attachCatDetails(kit: PartKit, options: Required<CatOptions>, upper: T.Group, chest: T.Group, head: T.Group, paws: T.Group[], ears: T.Group[]) {
  const { colors: c, group, part, round } = kit
  const fluffy = options.fur !== 'short'
  if (fluffy) {
    const length = options.fur === 'long' ? 1.8 : 1
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const tuft = part('CheekFluff', head, i % 2 ? c.furLight : c.orange, side * (5.2 + i * .35), -1.3 - i * 1.1, .5 + i * .7, 3.3, 2.3, 3, .3)
        tuft.rotation.z = side * (.15 + i * .12)
      }
      for (let i = 0; i < 4; i++) part('ChestRuff', upper, i % 2 ? c.cream : c.furLight, side * (2.8 + i * .6), 7.6 - i * .9, 5.6, 2, 2.5 * length, 1.6, .2)
      for (let i = 0; i < 3; i++) part('HaunchFluff', chest, i % 2 ? c.furLight : c.orange, side * 4.9, .4 - i * 1.1, -3.5 - i * 1.6, 2.2, 2.2, 3.2, .35)
    }
  }
  if (options.breed === 'maine-coon') for (const ear of ears) {
    part('EarTuft', ear, c.stripe, 0, 3.8, 0, .9, 3.2, .9, .1)
    part('EarTuftLight', ear, c.furLight, -.3, 3, .5, .6, 1.9, .3, .05)
  }
  if (options.hat !== 'none') {
    const hat = group('CatHat', head, 0, 5.1, .7)
    if (options.hat === 'cap') {
      round('CapCrown', hat, c.hat, 0, 1, -.3, 9.3, 4.4, 7)
      part('CapBrim', hat, c.hatBand, 0, -.4, 4.3, 9, .8, 5.5, .25)
      part('CapPaw', hat, c.cream, 0, .9, 3.3, 1.7, 1.7, .3, .3)
    } else if (options.hat === 'witch') {
      round('WitchBrim', hat, c.hoodShade, 0, 0, 0, 15, 1.2, 10)
      const cone = new T.Mesh(kit.shade(new T.ConeGeometry(4.1, 9, 5)), new T.MeshBasicMaterial({ color: c.hood, vertexColors: true, toneMapped: false }))
      cone.position.set(.6, 4, -.3); cone.rotation.z = -.15; hat.add(cone)
      part('WitchBand', hat, c.ribbon, 0, 1.3, 3, 7.2, 1.2, .6, .1)
      part('WitchBuckle', hat, c.gold, 0, 1.3, 3.5, 1.8, 1.4, .3, .1)
    } else {
      for (let i = 0; i < 7; i++) {
        const angle = i / 7 * Math.PI * 2
        round('FlowerPetal', hat, i % 2 ? c.ribbon : c.cream, Math.sin(angle) * 4.5, 0, Math.cos(angle) * 3.4, 3.1, 2.3, 3.1)
        round('FlowerHeart', hat, c.gold, Math.sin(angle) * 4.5, 1.1, Math.cos(angle) * 3.4, 1.2, .8, 1.2)
      }
    }
  }
  if (options.collar !== 'none') {
    round('CollarBand', upper, options.collar === 'bandana' ? c.ribbon : c.shirt, 0, 9.9, 4.8, 8.8, 1.4, 5.5)
    if (options.collar === 'bell') {
      round('CollarBell', upper, c.gold, 0, 8.8, 7.8, 2.1, 2.2, 1.4)
      part('BellSlit', upper, c.ink, 0, 8.6, 8.5, .5, .7, .2, .02)
    } else {
      const scarf = part('BandanaTip', upper, c.ribbon, 0, 7.5, 7.1, 4.8, 3.2, .6, .2)
      scarf.rotation.z = Math.PI / 4
    }
  }
  if (options.shoes === 'boots') for (const paw of paws) {
    part('CatBoot', paw, c.leather, 0, -.7, .4, 3.5, 2.5, 4, .45)
    part('BootCuff', paw, c.cream, 0, .4, .25, 3.7, .7, 3.5, .2)
    part('BootToe', paw, c.hat, 0, -.9, 2.4, 2.8, 1.2, .4, .15)
  }
  const wings: { root: T.Group; tip: T.Group; side: number }[] = []
  if (options.wings !== 'none') for (const side of [-1, 1]) {
    const wing = group('CatWing' + side, upper, side * 4.3, 11, -2.3)
    const tip = group('CatWingTip' + side, wing, side * 5, 1.4, -.6)
    round('WingShoulder', wing, options.wings === 'bat' ? c.hoodShade : c.featherShade, side * 2.4, .8, 0, 5.5, 4.8, 1.8)
    for (let i = 0; i < 5; i++) {
      const feather = part('WingFeather', tip, options.wings === 'bat' ? (i % 2 ? c.hood : c.hoodShade) : i % 2 ? c.feather : c.featherLight, side * (i * 1.2 + .5), 1.2 - i * .6, -.15 - i * .15, 2.1, 7 - i * .55, 1.1, .3)
      feather.rotation.z = -side * (.45 + i * .13)
    }
    wings.push({ root: wing, tip, side })
  }
  return { wings }
}
