import { defaultAppearance } from '../../actor-rig/appearance'
/** Friendly merchant: approved coat/glasses/mustache on the shared rig. */
export function ivoAppearance() {
  const a=defaultAppearance()
  a.parts={...a.parts,hair:'swept',outfit:'coat',legs:'trousers',headwear:'none',backpack:false,held:'none',face:'default'}
  a.accessories={glasses:true,facialHair:'mustache',faceMarking:'none'}
  Object.assign(a.colors,{ink:'#302a2b',hair:'#4c4144',hairLight:'#817273',hairShade:'#312b30',hairSheen:'#a19590',skin:'#c49d7b',skinShadow:'#977059',skinLight:'#ddbb95',shirt:'#554b49',shirtLight:'#82736b',shirtDark:'#383338',jacket:'#8c5b43',jacketLight:'#b0805d',jacketDark:'#573c32',shorts:'#474148',shortsLight:'#635a60',shortsDark:'#2e2c33',shoe:'#654938',metal:'#baa280',metalShade:'#7c6d60'})
  a.face={leftEye:'#614c39',rightEye:'#614c39',nose:a.colors.skinShadow,marking:a.colors.hairShade}
  return a
}
