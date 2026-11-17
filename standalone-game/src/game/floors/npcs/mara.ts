import { defaultAppearance } from '../../actor-rig/appearance'
/** Friendly medic: approved illustration, existing shared humanoid parts/actions. */
export function maraAppearance() {
  const a=defaultAppearance()
  a.parts={...a.parts,hair:'cropped',outfit:'vest',legs:'trousers',headwear:'none',backpack:true,held:'none',face:'soft'}
  Object.assign(a.colors,{ink:'#302c2b',hair:'#393038',hairLight:'#5d4950',hairShade:'#27232a',hairSheen:'#796267',skin:'#ba9074',skinShadow:'#8b6558',skinLight:'#d7b095',shirt:'#d0c1a6',shirtLight:'#e5d8c2',shirtDark:'#918775',jacket:'#73816a',jacketLight:'#939b7d',jacketDark:'#485343',shorts:'#47434a',shortsLight:'#635f64',shortsDark:'#302e35',shoe:'#674c39',backpack:'#6b5746',backpackLight:'#8b745c',backpackDark:'#493d33'})
  a.face={leftEye:'#675a36',rightEye:'#675a36',nose:a.colors.skinShadow,marking:a.colors.hairShade}
  return a
}
