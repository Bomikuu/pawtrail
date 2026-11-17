import * as T from 'three'
export type SieghartSurface='face'|'half'|'closed'|'hair'|'coat'|'lining'|'vest'|'scarf'|'trousers'|'boots'|'blade'|'fringe'
const images=new Map<SieghartSurface,HTMLImageElement>();let loading:Promise<void>|undefined
export function loadSieghartTextures(){
 return loading??=Promise.all((['face','half','closed','hair','coat','lining','vest','scarf','trousers','boots','blade','fringe']as SieghartSurface[]).map(async key=>{
  const image=new Image();image.src='/pawtrail-game/actor-studio/sieghart/v1/'+key+'.webp';await image.decode();images.set(key,image)
 })).then(()=>{}).catch(error=>{images.clear();loading=undefined;throw error})
}
export function sieghartTexture(surface:SieghartSurface){
 const image=images.get(surface);if(!image)throw Error('Sieghart’s painted materials are not ready.')
 const map=new T.Texture(image);map.needsUpdate=true;map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;map.generateMipmaps=false;map.userData.studioSurface=surface;return map
}
