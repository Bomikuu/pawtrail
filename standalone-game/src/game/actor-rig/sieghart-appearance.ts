import {defaultAppearance,type ActorAppearance} from './appearance'

export function sieghartAppearance():ActorAppearance{
 const base=defaultAppearance()
 return {...base,parts:{...base.parts,hair:'spiky',outfit:'coat',legs:'trousers',headwear:'none',held:'none',backpack:false},colors:{...base.colors,
  ink:'#211d2b',hair:'#282231',hairLight:'#51405f',hairShade:'#171725',hairSheen:'#8c5b9c',
  skin:'#e8b69d',skinLight:'#ffe1c4',skinShadow:'#bb8876',blush:'#ce9586',mouth:'#815253',
  shirt:'#d5ced3',shirtLight:'#f3e7df',shirtDark:'#9b919f',cream:'#e2dae0',creamShadow:'#a49aa9',
  jacket:'#2d2639',jacketLight:'#51405e',jacketDark:'#181b2b',shorts:'#282530',shortsLight:'#453b4d',shortsDark:'#191a26',
  shoe:'#302735',gold:'#b6adb9',metal:'#d8cfda',metalShade:'#82778e',ribbon:'#773d86',backpack:'#532c68',backpackLight:'#a563b0',backpackDark:'#33213f',
 },face:{leftEye:'#7e91b1',rightEye:'#7e91b1',nose:'#bb8876',marking:'#815253'}}
}
