import * as T from 'three'

export type SiegSurface='face'|'half'|'closed'|'hair'|'copper'|'shirt'|'cape'|'lining'|'trousers'|'boots'|'blade'
const maps=new Map<SiegSurface,HTMLImageElement>()
let loading:Promise<void>|undefined
export function loadSiegTextures(){
  return loading??=Promise.all((['face','half','closed','hair','copper','shirt','cape','lining','trousers','boots','blade'] as SiegSurface[]).map(async key=>{
    const image=new Image();image.src='/pawtrail-game/actor-studio/sieg/v2/'+key+'.png';await image.decode();maps.set(key,image)
  })).then(()=>{}).catch(error=>{maps.clear();loading=undefined;throw error})
}
export function siegTexture(surface:SiegSurface){
  const image=maps.get(surface);if(!image)throw Error('Sieg’s painted surfaces have not loaded.')
  const texture=new T.Texture(image);texture.needsUpdate=true;texture.colorSpace=T.SRGBColorSpace
  texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false
  texture.userData.studioSurface=surface
  return texture
}
