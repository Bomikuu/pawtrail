import * as T from 'three'

export type MiraSurface = 'hair' | 'suit' | 'stocking' | 'cuff' | 'ear' | 'metal'
const surfaces: MiraSurface[] = ['hair', 'suit', 'stocking', 'cuff', 'ear', 'metal']
const images = new Map<MiraSurface, HTMLImageElement>()
let loading: Promise<void> | undefined

export function loadMiraTextures() {
  return loading ??= Promise.all(surfaces.map(async key => {
    const image = new Image()
    image.src = '/pawtrail-game/actor-studio/mira-adler/v1/' + key + '.png'
    await image.decode()
    images.set(key, image)
  })).then(() => {}).catch(error => { images.clear(); loading = undefined; throw error })
}

/** Instance-owned GPU maps; the shared image cache holds decoded sources only. */
export function miraTexture(surface: MiraSurface) {
  const image = images.get(surface)
  if (!image) throw Error('Mira’s painted textures are not ready. Retry the preview.')
  const map = new T.Texture(image)
  map.needsUpdate = true
  map.colorSpace = T.SRGBColorSpace
  map.magFilter = T.NearestFilter
  map.minFilter = T.NearestFilter
  map.generateMipmaps = false
  map.userData.actorOwned = true
  map.userData.studioSurface = surface
  return map
}
