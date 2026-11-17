import type { ActorAppearance } from '../actor-rig/appearance'
import type { Rig } from '../actor-rig/rigs'

export type CreatorPreviewModel='shared'|'amber'|'yae'
const factories:Partial<Record<CreatorPreviewModel,(appearance:ActorAppearance)=>Rig>>={}
export async function prepareCreatorModel(model:CreatorPreviewModel){
  if(model==='shared'||factories[model])return
  if(model==='amber'){
    const [textures,rig]=await Promise.all([import('../actor-rig/amber-study-textures'),import('../actor-rig/amber-study-rig')])
    await textures.loadAmberStudyTextures();factories.amber=rig.createAmberShoulderStudy
  }else{
    const [textures,rig]=await Promise.all([import('../actor-rig/yae-study-textures'),import('../actor-rig/yae-study-rig')])
    await textures.loadYaeStudyTextures();factories.yae=rig.createYaeStudy
  }
}
export function creatorModelFactory(model:CreatorPreviewModel){
  if(model==='shared')return undefined
  const factory=factories[model]
  if(!factory)throw Error('The selected character model is not ready. Reopen its preview.')
  return factory
}
