import {defaultAppearance,type ActorAppearance} from './appearance'
export function rikaAppearance():ActorAppearance{
 const a=defaultAppearance();return{...a,parts:{...a.parts,hair:'long',outfit:'spacesuit',legs:'trousers',headwear:'none',wings:'none',held:'none',backpack:false},colors:{...a.colors,ink:'#302534',hair:'#704333',hairLight:'#a77652',hairShade:'#402e31',hairSheen:'#c59367',skin:'#f3c4a5',skinLight:'#ffe2c1',skinShadow:'#be897c',blush:'#d98c8a',mouth:'#955b69',shirt:'#5b4a96',shirtLight:'#8a73bf',shirtDark:'#342f5b',jacket:'#e9e1e9',jacketLight:'#fff6f3',jacketDark:'#a89db5',shorts:'#54418a',shortsLight:'#8f69b9',shortsDark:'#302b50',shoe:'#e5dae6',ribbon:'#e65d9f',gold:'#52e1d3',metal:'#e3dce6',metalShade:'#5a5269',cream:'#f4e8ea',creamShadow:'#b5a7c1'},face:{leftEye:'#a5673f',rightEye:'#a5673f',nose:'#be897c',marking:'#714332'}}
}
export function peonyAppearance():ActorAppearance{
 const a=rikaAppearance();return{...a,parts:{...a.parts,hair:'cropped'},colors:{...a.colors,shirt:'#de7bab',shirtLight:'#ffb3d7',shirtDark:'#984c84',jacket:'#eb8eb9',jacketLight:'#ffd0df',jacketDark:'#994c7b',shorts:'#5a5269',shortsLight:'#a49aae',shortsDark:'#302a3c',shoe:'#e1ccdf',ribbon:'#ec71b2',gold:'#5ee8d5'}}
}
