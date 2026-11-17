import * as T from 'three'
export type RikaSurface='face'|'half'|'closed'|'hair'|'fringe'|'suit'|'pilot-back'|'white'|'trim'|'pink'|'canopy'|'metal'|'mech-white'
const surfaces:RikaSurface[]=['face','half','closed','hair','fringe','suit','pilot-back','white','trim','pink','canopy','metal','mech-white']
const images=new Map<RikaSurface,HTMLImageElement>();let loading:Promise<void>|undefined
export function loadRikaTextures(){return loading??=Promise.all(surfaces.map(async key=>{const image=new Image();image.src='/pawtrail-game/actor-studio/rika-hoshino/v1/'+key+'.png';await image.decode();images.set(key,image)})).then(()=>{}).catch(error=>{images.clear();loading=undefined;throw error})}
export function rikaTexture(surface:RikaSurface){const image=images.get(surface);if(!image)throw Error('Rika and Peony’s painted materials are not ready.');const map=new T.Texture(image);map.needsUpdate=true;map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;map.generateMipmaps=false;map.userData.studioSurface=surface;return map}
