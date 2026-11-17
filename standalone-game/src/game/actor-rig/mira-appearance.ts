import { defaultAppearance, type ActorAppearance } from './appearance'

/** Canonical shared body; Mira's identity is cosmetic, not another anatomy rig. */
export function miraAppearance(): ActorAppearance {
  const base = defaultAppearance()
  return {
    ...base,
    parts: { ...base.parts, hair: 'long', outfit: 'tunic', legs: 'trousers', face: 'soft', backpack: false },
    colors: {
      ...base.colors,
      ink: '#291e2b', hair: '#694a43', hairLight: '#a87962', hairShade: '#382b35', hairSheen: '#c99d7d',
      skin: '#efbb98', skinLight: '#ffdfb6', skinShadow: '#b88272', blush: '#db9290', mouth: '#9c6069',
      shirt: '#302638', shirtLight: '#685366', shirtDark: '#191821',
      jacket: '#302638', jacketLight: '#8f786f', jacketDark: '#1c1925',
      shorts: '#745b53', shortsLight: '#9a7b68', shortsDark: '#41343b', shoe: '#241e2b',
      cream: '#f4e6d5', creamShadow: '#b5a4a6', ribbon: '#302638', gold: '#c39a55', metal: '#c7bcc4', metalShade: '#4d4357',
    },
    face: { ...base.face, leftEye: '#b57830', rightEye: '#b57830', nose: '#b88272', marking: '#694a43' },
  }
}
