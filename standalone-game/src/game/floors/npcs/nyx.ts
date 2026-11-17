import { defaultAppearance } from '../../actor-rig/appearance'
/** Courier on the shared rig; normal friendly NPC, no combat/enrage variant. */
export function nyxAppearance(){
 const a=defaultAppearance()
 a.parts={...a.parts,hair:'swept',outfit:'coat',legs:'trousers',headwear:'none',backpack:true,held:'none',face:'default'}
 Object.assign(a.colors,{ink:'#2b2933',hair:'#302d35',hairLight:'#534751',hairShade:'#201f29',hairSheen:'#796673',skin:'#ad8065',skinShadow:'#7c574b',skinLight:'#cfa88c',shirt:'#8b8987',shirtLight:'#b4b1a8',shirtDark:'#5c5e66',jacket:'#4e596e',jacketLight:'#748096',jacketDark:'#343d50',hood:'#4e596e',hoodShade:'#343d50',shorts:'#3a3c48',shortsLight:'#5a5b67',shortsDark:'#262935',shoe:'#533f37',backpack:'#6c4e42',backpackLight:'#93745c',backpackDark:'#48382f',metal:'#a58f74',metalShade:'#71635c'})
 a.face={leftEye:'#717c86',rightEye:'#717c86',nose:a.colors.skinShadow,marking:a.colors.hairShade};return a
}
