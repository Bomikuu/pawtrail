import { defaultAppearance, type ActorAppearance } from './appearance'

/** Original, preview-only Stormwarden identity. Voice deliberately omitted. */
export function siegAppearance(): ActorAppearance {
  const base = defaultAppearance()
  return { ...base, parts: { ...base.parts, hair: 'swept', outfit: 'coat', legs: 'trousers', headwear: 'none', backpack: false, held: 'none' },
    colors: { ...base.colors, ink:'#242331',hair:'#302d37',hairShade:'#191e2b',hairLight:'#53505b',hairSheen:'#74646b',
      skin:'#f0c5a2',skinLight:'#ffe1b9',skinShadow:'#bb8a70',blush:'#d3987c',mouth:'#865548',
      shirt:'#ece1c7',shirtLight:'#fff1d4',shirtDark:'#b3a48e',cream:'#ece1c7',creamShadow:'#b3a48e',
      jacket:'#253144',jacketLight:'#465166',jacketDark:'#171f30',shorts:'#35323b',shortsLight:'#514953',shortsDark:'#211f2c',
      shoe:'#352b2c',gold:'#b99055',metal:'#d3d3c1',metalShade:'#7f8189',ribbon:'#b9673e',backpack:'#376c70',backpackLight:'#72a3a0',backpackDark:'#23494f' },
    face:{leftEye:'#ba822f',rightEye:'#ba822f',nose:'#bb8a70',marking:'#865548'} }
}
