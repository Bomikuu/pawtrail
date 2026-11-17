import * as T from 'three'
import art from './spectral-art.json'
export type SpectralSurface='body'|'armor'|'blade'|'talisman'
const surfaces:SpectralSurface[]=['body','armor','blade','talisman']
const textures=new Map<SpectralSurface,T.Texture>()
let loading:Promise<void>|undefined
export const spectralPalette=[...art.palette,'#ead3ff','#cf87f5','#3b204c','#ffb0db','#fff1e2','#11101c','#f4ce70']
export const spectralBladeTexture=art.blade
/** One tiny generated atlas, loaded only when this weapon is selected. */
export function prepareSpectralArt(){
 return loading??=Promise.all(surfaces.map(surface=>new Promise<void>((resolve,reject)=>{
  const image=new Image()
  image.onload=()=>{
   const map=new T.Texture(image);map.colorSpace=T.SRGBColorSpace
   map.magFilter=map.minFilter=T.NearestFilter;map.generateMipmaps=false
   map.wrapS=map.wrapT=T.RepeatWrapping;map.needsUpdate=true;textures.set(surface,map);resolve()
  }
  image.onerror=()=>reject(Error('The spectral weapon artwork could not load. Retry the viewport.'))
  image.src=art[surface]
 }))).then(()=>{}).catch(error=>{loading=undefined;throw error})
}
export function spectralTexture(surface:SpectralSurface){
 const source=textures.get(surface)
 if(!source)throw Error('Prepare the spectral weapon artwork before opening its preview.')
 const map=source.clone();map.needsUpdate=true;return map
}
