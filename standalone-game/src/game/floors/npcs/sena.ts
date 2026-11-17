import { defaultAppearance } from '../../actor-rig/appearance'
/** Sena's approved dispatch uniform on the shared friendly actor rig. */
export function senaAppearance(){
 const a=defaultAppearance()
 a.parts={...a.parts,hair:'swept',outfit:'coat',legs:'trousers',headwear:'none',backpack:false,held:'none',face:'default'}
 Object.assign(a.colors,{ink:'#242633',hair:'#272831',hairLight:'#484950',hairShade:'#191b24',hairSheen:'#686771',skin:'#ad805f',skinShadow:'#785344',skinLight:'#cba382',shirt:'#d1c6ad',shirtLight:'#ede1c9',shirtDark:'#9f9588',jacket:'#344258',jacketLight:'#52627a',jacketDark:'#242d40',hood:'#344258',hoodShade:'#242d40',shorts:'#35363f',shortsLight:'#55545e',shortsDark:'#23242d',shoe:'#393036',metal:'#b59158',metalShade:'#77603e'})
 a.face={leftEye:'#77816f',rightEye:'#77816f',nose:a.colors.skinShadow,marking:a.colors.hairShade};return a
}
