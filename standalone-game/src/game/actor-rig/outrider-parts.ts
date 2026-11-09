import * as T from 'three'
import { solid, type PartKit } from './part-kit'

/** Reference costume on the shared skeleton; every piece follows existing joints. */
export function attachOutriderHeadwear(kit: PartKit, head: T.Object3D) {
  const { colors: C, group, part, round } = kit
  const wear = group('OutriderBowAndGoggles', head)
  part('GoggleHeadband', wear, C.leather, 0, 4, -.2, 13.8, 1.4, 10, .4)
  for (const side of [-1, 1]) {
    const lens = group('ForeheadGoggle_' + side, wear, side * 3.2, 4.2, 5.2)
    lens.rotation.z = side * -.13
    round('BronzeGoggleRim', lens, C.gold, 0, 0, 0, 5.8, 4.4, 1.6)
    round('GoggleInnerRim', lens, C.leather, 0, 0, .7, 4.6, 3.3, .7)
    round('AmberGoggleLens', lens, C.metalShade, 0, 0, 1, 3.8, 2.7, .5)
    part('LensReflection', lens, C.cream, -.7, .5, 1.3, 1.2, .55, .2, .1)
    part('RimRivet', lens, C.creamShadow, side * 2, -.3, .8, .5, .5, .3, .1)
    const ear = group('RibbonEar_' + side, wear, side * .9, 6.1, -1.1)
    ear.rotation.z = side * -.45
    const shape = new T.Shape()
    shape.moveTo(-1.5, 0); shape.lineTo(-2.5, 6.7); shape.lineTo(-1.1, 12)
    shape.lineTo(1.8, 8.4); shape.lineTo(2.1, 3.2); shape.lineTo(1.3, 0); shape.closePath()
    const ribbon = solid(kit, new T.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false }), C.ribbon)
    ribbon.name = 'SculptedRabbitRibbon'; ear.add(ribbon)
    part('RibbonFold', ear, C.jacketDark, .4, 5, 1.3, .65, 6.5, .25, .1)
    const tip = part('CreamRibbonTip', ear, C.gold, -.9, 10.4, 1.3, .65, 2.2, .25, .1)
    tip.rotation.z = -.2
    part('RibbonGoldCross', ear, C.creamShadow, 0, 3, 1.3, 3.3, .55, .25, .05)
  }
  round('RibbonKnot', wear, C.ribbon, 0, 6.4, -.1, 3.7, 2.5, 2.5)
  return wear
}

export function attachOutriderTorso(kit: PartKit, chest: T.Object3D, upper: T.Object3D) {
  const { colors: C, part } = kit
  part('WhiteBodice', chest, C.cream, 0, -.3, 2.8, 7.5, 10.5, 1, .45)
  part('BodiceGoldSeam', chest, C.gold, 0, -1.8, 3.4, .6, 6.6, .3, .1)
  for (const side of [-1, 1]) {
    part('ShortRedJacket', chest, C.jacket, side * 4, 2, .1, 2.5, 7.7, 6.4, .55)
    const lapel = part('GoldJacketPiping', chest, C.gold, side * 2.8, 3.5, 3.55, .65, 4.6, .4, .1)
    lapel.rotation.z = side * -.38
    const corset = part('BodiceFiligree', chest, C.gold, side * 1.6, -2, 3.5, .65, 4.1, .3, .1)
    corset.rotation.z = side * .3
    part('BodiceDiamond', chest, C.gold, side * 1.3, .9, 3.5, .9, 1.1, .3, .15)
  }
  part('RedCapeletBack', chest, C.jacketDark, 0, 3.5, -3.4, 10.5, 4.1, 1.1, .5)
  part('RedStandingCollar', upper, C.jacket, 0, 26.3, -.4, 6, 2.6, 4.5, .4)
  part('HipSatchel', upper, C.leather, -6.1, 12.9, -.1, 3.6, 5.5, 3.7, .55)
  part('SatchelFlap', upper, C.hat, -6.1, 14.9, 1.9, 3.8, 1.4, .7, .25)
  part('SatchelClasp', upper, C.gold, -6.1, 13.8, 2.3, .8, 1.1, .3, .1)
  part('GoldBeltBuckle', upper, C.gold, 0, 14.4, 3.4, 1.6, 1.7, .6, .2)
}

export function attachOutriderLimbs(kit: PartKit, hip: T.Object3D, knee: T.Object3D, shoulder: T.Object3D, elbow: T.Object3D, wrist: T.Object3D, side: number) {
  const { colors: C, part } = kit
  part('IvoryShortsHem', hip, C.cream, 0, -4.9, .1, 4.45, .65, 5.3, .15)
  part('RedThighBoot', knee, C.jacketDark, 0, -1.4, 0, 3.5, 3.1, 3.8, .4)
  part('DarkBootLeg', knee, C.shoe, 0, -3.8, .1, 3.4, 2.8, 3.8, .35)
  const trim = part('BootGoldChevron', knee, C.gold, side * -.6, -2.1, 2.05, .75, 2.5, .3, .1)
  trim.rotation.z = side * .35
  part('ShoulderGoldBadge', shoulder, C.gold, side * 1.65, -1.2, 1, .55, 2.3, 2.1, .15)
  part('DarkJacketForearm', elbow, C.shortsDark, 0, -1.8, 0, 2.8, 3.8, 3.4, .4)
  part('RedGloveCuff', wrist, C.jacket, 0, .7, 0, 3.1, 1.4, 3.5, .25)
  part('GloveGoldSeam', wrist, C.gold, 0, 1.3, 1.8, 2.8, .4, .3, .08)
}
