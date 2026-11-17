import { defaultAppearance, type ActorAppearance } from './appearance'

/** Preview-only data; not a new save-contract slot or installed roster identity. */
export function yaeStudyAppearance():ActorAppearance{
  const base=defaultAppearance()
  return {...base,parts:{...base.parts,hair:'long',outfit:'coat',legs:'shorts',backpack:false,headwear:'none'},colors:{...base.colors,
    ink:'#422538',hair:'#d780a0',hairLight:'#eda2b8',hairShade:'#984865',hairSheen:'#ffd0cf',
    skin:'#f7cfbe',skinShadow:'#dca597',skinLight:'#ffe7d1',blush:'#e3a1a4',mouth:'#a75c75',
    shirt:'#fff2e7',shirtDark:'#cfa8bd',shirtLight:'#fff9e9',cream:'#fff2e7',creamShadow:'#d3aabb',
    jacket:'#b52d58',jacketLight:'#df6987',jacketDark:'#751f45',shorts:'#b52d58',shortsLight:'#df6987',shortsDark:'#661e42',
    shoe:'#5b2442',gold:'#dfba79',ribbon:'#9770c0',metal:'#c3a2e8',metalShade:'#66428c',gown:'#fff2e7',gownShade:'#d3aabb',gownLight:'#fff9ed',
  },face:{leftEye:'#8555b0',rightEye:'#8555b0',nose:'#dca597',marking:'#984865'}}
}
