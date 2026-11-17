import * as T from 'three'
export type AureliaSurface='face'|'half'|'closed'|'hair'|'fringe'|'armor'|'back'|'undersuit'|'skirt'|'feather'|'lining'|'boots'|'bracer'
const surfaces:AureliaSurface[]=['face','half','closed','hair','fringe','armor','back','undersuit','skirt','feather','lining','boots','bracer']
const images=new Map<AureliaSurface,HTMLImageElement>();let loading:Promise<void>|undefined
export function loadAureliaTextures(){
 return loading??=Promise.all(surfaces.map(async key=>{
  const image=new Image();image.src='/pawtrail-game/actor-studio/aurelia-weiss/v1/'+key+'.png';await image.decode();images.set(key,image)
 })).then(()=>{}).catch(error=>{images.clear();loading=undefined;throw error})
}
export function aureliaTexture(surface:AureliaSurface){
 const image=images.get(surface);if(!image)throw Error('Aurelia’s painted materials are not ready.')
 const map=new T.Texture(image);map.needsUpdate=true;map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;map.generateMipmaps=false;map.userData.studioSurface=surface;return map
}
