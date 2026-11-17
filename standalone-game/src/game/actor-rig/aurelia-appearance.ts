import {defaultAppearance,type ActorAppearance} from './appearance'

export function aureliaAppearance():ActorAppearance{
 const base=defaultAppearance()
 return {...base,parts:{...base.parts,hair:'long',outfit:'gown',legs:'trousers',headwear:'halo',held:'none',wings:'none',backpack:false},
  colors:{...base.colors,ink:'#362331',hair:'#ce719d',hairLight:'#f0a8c0',hairShade:'#884569',hairSheen:'#ffe0df',
   skin:'#f5c8b0',skinLight:'#ffe4cc',skinShadow:'#cc958e',blush:'#da969d',mouth:'#955d74',
   shirt:'#e6e0ee',shirtLight:'#fff7f1',shirtDark:'#b5a3c4',jacket:'#e4dbe9',jacketLight:'#fff5ee',jacketDark:'#9d83ad',
   shorts:'#39313f',shortsLight:'#615064',shortsDark:'#262532',shoe:'#d7c9de',cream:'#f3e8ee',creamShadow:'#b5a1c2',
   gown:'#b99acb',gownLight:'#e5c6e6',gownShade:'#826c9d',ribbon:'#b695d2',gold:'#c9ac83',metal:'#eee5ee',metalShade:'#a393ae',
   feather:'#eee4f1',featherLight:'#fff8f4',featherShade:'#ab91bd'},
  face:{leftEye:'#a263d0',rightEye:'#a263d0',nose:'#cc958e',marking:'#884569'}}
}
