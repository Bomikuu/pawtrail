import * as T from 'three'

/** Shared by the in-game actor preview and texture authoring viewport. */
export const CREATOR_FRAME = {width:128, height:160, density:2 as const, worldWidth:64, worldHeight:80, anchor:{x:.5,y:.75}}
export const ACTOR_CAMERA = {target:[0,21.5,0], position:[0,56,90]} as const
export function createActorCamera() {
  const camera = new T.OrthographicCamera(-32,32,40,-40,.1,200)
  camera.position.set(...ACTOR_CAMERA.position)
  camera.lookAt(...ACTOR_CAMERA.target)
  return camera
}
export function configureActorRenderer(renderer:T.WebGLRenderer) {
  renderer.setPixelRatio(1)
  renderer.outputColorSpace=T.SRGBColorSpace
  renderer.toneMapping=T.NoToneMapping
  renderer.setClearColor(0x000000,0)
}
